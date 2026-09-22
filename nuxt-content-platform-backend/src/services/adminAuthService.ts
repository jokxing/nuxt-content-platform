import type { AdminSession, AdminUser } from '@prisma/client'
import { getAuthConfig } from '../config/authConfig.js'
import { prisma } from '../db/prisma.js'
import {
  authRequired,
  csrfInvalid,
  invalidArgument,
  invalidCredentials,
} from '../lib/errors.js'
import { generateOpaqueToken, safeEqualText, sha256Hex } from '../lib/cryptoTokens.js'
import {
  assertLoginNotRateLimited,
  clearLoginFailures,
  recordLoginFailure,
} from '../lib/loginRateLimit.js'
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '../lib/password.js'

export type AdminSessionDto = {
  admin: {
    id: number
    username: string
    display_name: string
  }
  csrf_token: string
  idle_expires_at: number
  absolute_expires_at: number
}

export type LoginResult = {
  session: AdminSessionDto
  sessionToken: string
  maxAgeSeconds: number
}

type SessionWithUser = AdminSession & { adminUser: AdminUser }

function toMillis(value: Date): number {
  return value.getTime()
}

function buildSessionDto(row: SessionWithUser, csrfToken: string): AdminSessionDto {
  return {
    admin: {
      id: row.adminUser.id,
      username: row.adminUser.username,
      display_name: row.adminUser.displayName,
    },
    csrf_token: csrfToken,
    idle_expires_at: toMillis(row.idleExpiresAt),
    absolute_expires_at: toMillis(row.absoluteExpiresAt),
  }
}

function isSessionAlive(row: SessionWithUser, now: Date): boolean {
  if (row.revokedAt)
    return false
  if (!row.adminUser.isActive)
    return false
  if (row.idleExpiresAt.getTime() <= now.getTime())
    return false
  if (row.absoluteExpiresAt.getTime() <= now.getTime())
    return false
  return true
}

async function findSessionByToken(token: string): Promise<SessionWithUser | null> {
  const tokenHash = sha256Hex(token)
  return prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  })
}

async function maybeTouchSession(row: SessionWithUser, now: Date): Promise<SessionWithUser> {
  const config = getAuthConfig()
  const elapsed = now.getTime() - row.lastSeenAt.getTime()
  if (elapsed < config.touchThrottleMs)
    return row

  const idleExpiresAt = new Date(now.getTime() + config.idleTtlMs)
  const absoluteCap = row.absoluteExpiresAt
  const nextIdle = idleExpiresAt.getTime() > absoluteCap.getTime()
    ? absoluteCap
    : idleExpiresAt

  return prisma.adminSession.update({
    where: { id: row.id },
    data: {
      lastSeenAt: now,
      idleExpiresAt: nextIdle,
    },
    include: { adminUser: true },
  })
}

function parseLoginBody(body: unknown): { username: string, password: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw invalidArgument('请求体不合法')
  const record = body as Record<string, unknown>
  const keys = Object.keys(record)
  for (const key of keys) {
    if (key !== 'username' && key !== 'password')
      throw invalidArgument('请求体包含未知字段')
  }
  if (typeof record.username !== 'string' || typeof record.password !== 'string')
    throw invalidArgument('用户名或密码不合法')
  const username = record.username.trim()
  const password = record.password
  if (username.length < 1 || username.length > 100)
    throw invalidArgument('用户名或密码不合法')
  if (password.length < 1 || password.length > 1024)
    throw invalidArgument('用户名或密码不合法')
  return { username, password }
}

export async function loginAdmin(
  body: unknown,
  clientIp: string,
): Promise<LoginResult> {
  const { username, password } = parseLoginBody(body)
  assertLoginNotRateLimited(clientIp, username)

  const user = await prisma.adminUser.findUnique({ where: { username } })
  const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH
  const passwordOk = await verifyPassword(password, passwordHash)

  if (!user || !user.isActive || !passwordOk) {
    recordLoginFailure(clientIp, username)
    throw invalidCredentials()
  }

  clearLoginFailures(clientIp, username)

  const config = getAuthConfig()
  const now = new Date()
  const sessionToken = generateOpaqueToken(32)
  const csrfToken = generateOpaqueToken(32)
  const idleExpiresAt = new Date(now.getTime() + config.idleTtlMs)
  const absoluteExpiresAt = new Date(now.getTime() + config.absoluteTtlMs)

  const created = await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    })
    return tx.adminSession.create({
      data: {
        adminUserId: user.id,
        tokenHash: sha256Hex(sessionToken),
        csrfTokenHash: sha256Hex(csrfToken),
        idleExpiresAt,
        absoluteExpiresAt,
        lastSeenAt: now,
      },
      include: { adminUser: true },
    })
  })

  return {
    session: buildSessionDto(created, csrfToken),
    sessionToken,
    maxAgeSeconds: Math.floor((absoluteExpiresAt.getTime() - now.getTime()) / 1000),
  }
}

export async function getAdminSessionFromToken(token: string | null): Promise<AdminSessionDto> {
  if (!token)
    throw authRequired()

  const now = new Date()
  const row = await findSessionByToken(token)
  if (!row || !isSessionAlive(row, now))
    throw authRequired()

  // 会话接口需要返回可用的 CSRF 明文；数据库只存哈希，因此轮换 CSRF。
  const csrfToken = generateOpaqueToken(32)
  const touched = await prisma.adminSession.update({
    where: { id: row.id },
    data: {
      csrfTokenHash: sha256Hex(csrfToken),
      lastSeenAt: now,
      idleExpiresAt: (() => {
        const config = getAuthConfig()
        const next = new Date(now.getTime() + config.idleTtlMs)
        return next.getTime() > row.absoluteExpiresAt.getTime()
          ? row.absoluteExpiresAt
          : next
      })(),
    },
    include: { adminUser: true },
  })

  if (!isSessionAlive(touched, now))
    throw authRequired()

  return buildSessionDto(touched, csrfToken)
}

/**
 * 退出：有有效会话时校验 CSRF 后撤销；无有效会话时幂等成功。
 * 返回是否应清除 Cookie（始终 true）。
 */
export async function logoutAdmin(
  token: string | null,
  csrfToken: string | null,
): Promise<{ logged_out: true }> {
  if (!token) {
    // 无 Cookie：无需 CSRF，直接幂等成功。
    return { logged_out: true }
  }

  const now = new Date()
  const row = await findSessionByToken(token)
  if (!row || !isSessionAlive(row, now)) {
    // 失效会话：幂等清 Cookie，不强制 CSRF。
    return { logged_out: true }
  }

  if (!csrfToken)
    throw csrfInvalid()
  if (!safeEqualText(sha256Hex(csrfToken), row.csrfTokenHash))
    throw csrfInvalid()

  await prisma.adminSession.update({
    where: { id: row.id },
    data: { revokedAt: now },
  })

  return { logged_out: true }
}

/** 供管理读接口复用：只校验会话，不轮换 CSRF。 */
export async function requireAdminSession(token: string | null): Promise<SessionWithUser> {
  if (!token)
    throw authRequired()

  const now = new Date()
  const row = await findSessionByToken(token)
  if (!row || !isSessionAlive(row, now))
    throw authRequired()

  return maybeTouchSession(row, now)
}

/** 供后续管理写接口复用：校验会话与 CSRF，并节流刷新 idle。 */
export async function requireAdminWriteSession(
  token: string | null,
  csrfToken: string | null,
): Promise<SessionWithUser> {
  if (!token)
    throw authRequired()
  if (!csrfToken)
    throw csrfInvalid()

  const now = new Date()
  const row = await findSessionByToken(token)
  if (!row || !isSessionAlive(row, now))
    throw authRequired()
  if (!safeEqualText(sha256Hex(csrfToken), row.csrfTokenHash))
    throw csrfInvalid()

  return maybeTouchSession(row, now)
}

/** 仅创建缺失管理员；已存在同名用户则跳过，不覆盖密码。 */
export async function ensureAdminUser(input: {
  username: string
  password: string
  displayName: string
}): Promise<'created' | 'exists'> {
  const username = input.username.trim()
  if (!username || username.length > 100)
    throw new Error('ADMIN_BOOTSTRAP_USERNAME is invalid')
  if (!input.password || input.password.length > 1024)
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD is invalid')
  const displayName = input.displayName.trim() || '管理员'
  if (displayName.length > 100)
    throw new Error('ADMIN_BOOTSTRAP_DISPLAY_NAME is invalid')

  const existing = await prisma.adminUser.findUnique({ where: { username } })
  if (existing)
    return 'exists'

  const passwordHash = await hashPassword(input.password)
  await prisma.adminUser.create({
    data: {
      username,
      passwordHash,
      displayName,
      isActive: true,
    },
  })
  return 'created'
}
