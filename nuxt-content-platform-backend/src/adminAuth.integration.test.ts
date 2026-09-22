import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { createHash, randomBytes } from 'node:crypto'
import { prisma } from './db/prisma.js'
import { resetLoginRateLimitForTests } from './lib/loginRateLimit.js'
import { hashPassword } from './lib/password.js'
import {
  apiGet,
  apiSend,
  assertErrorEnvelope,
  assertMillis,
  assertSuccessEnvelope,
  asObject,
  readSetCookie,
  startTestServer,
  type TestServer,
} from './test/httpHarness.js'

const ORIGIN = 'http://localhost:3670'
const PROBE_PREFIX = 'a2_auth_probe_'

function probeUsername(suffix: string): string {
  return `${PROBE_PREFIX}${suffix}`
}

async function deleteProbeAdmins(): Promise<void> {
  await prisma.adminSession.deleteMany({
    where: { adminUser: { username: { startsWith: PROBE_PREFIX } } },
  })
  await prisma.adminUser.deleteMany({
    where: { username: { startsWith: PROBE_PREFIX } },
  })
}

async function createProbeAdmin(username: string, password: string, options?: {
  displayName?: string
  isActive?: boolean
}) {
  return prisma.adminUser.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      displayName: options?.displayName || '探针管理员',
      isActive: options?.isActive ?? true,
    },
  })
}

describe('A2 admin auth integration', () => {
  let server: TestServer

  before(async () => {
    await deleteProbeAdmins()
    server = await startTestServer()
  })

  after(async () => {
    await deleteProbeAdmins()
    await server.close()
  })

  beforeEach(() => {
    resetLoginRateLimitForTests()
  })

  it('login sets HttpOnly cookie without returning session token', async () => {
    const username = probeUsername(`ok_${randomBytes(3).toString('hex')}`)
    const password = `Pw_${randomBytes(6).toString('hex')}`
    await createProbeAdmin(username, password)

    const { status, body, headers } = await apiSend(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: ORIGIN },
      body: { username, password },
    })
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const data = asObject(body.data, 'data')
    const admin = asObject(data.admin, 'admin')
    assert.equal(admin.username, username)
    assert.equal(typeof data.csrf_token, 'string')
    assert.ok(String(data.csrf_token).length >= 32)
    assertMillis(data.idle_expires_at, 'idle_expires_at')
    assertMillis(data.absolute_expires_at, 'absolute_expires_at')
    assert.equal('session_token' in data, false)
    assert.equal(JSON.stringify(body).includes(password), false)

    const cookie = readSetCookie(headers, 'cp_admin_session')
    assert.ok(cookie)
    const setCookie = headers.get('set-cookie') || ''
    assert.match(setCookie, /HttpOnly/i)
    assert.match(setCookie, /SameSite=Lax/i)
    assert.match(setCookie, /Path=\//i)
    assert.doesNotMatch(setCookie, /Secure/i)
  })

  it('wrong username and wrong password both return 40101', async () => {
    const username = probeUsername(`cred_${randomBytes(3).toString('hex')}`)
    const password = `Pw_${randomBytes(6).toString('hex')}`
    await createProbeAdmin(username, password)

    const missing = await apiSend(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: ORIGIN },
      body: { username: probeUsername('missing'), password },
    })
    assert.equal(missing.status, 401)
    assertErrorEnvelope(missing.body, 40101)
    assert.equal(missing.body.msg, '用户名或密码错误')

    const wrong = await apiSend(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: ORIGIN },
      body: { username, password: 'definitely-wrong-password' },
    })
    assert.equal(wrong.status, 401)
    assertErrorEnvelope(wrong.body, 40101)
    assert.equal(wrong.body.msg, missing.body.msg)
  })

  it('rate limits after 5 failures for same ip+username', async () => {
    const username = probeUsername(`rl_${randomBytes(3).toString('hex')}`)
    await createProbeAdmin(username, `Pw_${randomBytes(6).toString('hex')}`)

    for (let i = 0; i < 5; i++) {
      const res = await apiSend(server.baseUrl, '/api/admin/auth/login', {
        method: 'POST',
        headers: { Origin: ORIGIN },
        body: { username, password: `bad-${i}` },
      })
      assert.equal(res.status, 401)
      assertErrorEnvelope(res.body, 40101)
    }

    const limited = await apiSend(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: ORIGIN },
      body: { username, password: 'bad-final' },
    })
    assert.equal(limited.status, 429)
    assertErrorEnvelope(limited.body, 42900)
    assert.ok(limited.headers.get('retry-after'))
  })

  it('session restores csrf and logout revokes cookie', async () => {
    const username = probeUsername(`sess_${randomBytes(3).toString('hex')}`)
    const password = `Pw_${randomBytes(6).toString('hex')}`
    await createProbeAdmin(username, password)

    const login = await apiSend(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: ORIGIN },
      body: { username, password },
    })
    assert.equal(login.status, 200)
    const token = readSetCookie(login.headers, 'cp_admin_session')
    assert.ok(token)
    const loginCsrf = String(asObject(login.body.data, 'data').csrf_token)

    const session = await apiGet(server.baseUrl, '/api/admin/auth/session', {
      headers: { Cookie: `cp_admin_session=${encodeURIComponent(token)}` },
    })
    assert.equal(session.status, 200)
    assertSuccessEnvelope(session.body)
    const sessionCsrf = String(asObject(session.body.data, 'data').csrf_token)
    assert.notEqual(sessionCsrf, loginCsrf)

    const badCsrfLogout = await apiSend(server.baseUrl, '/api/admin/auth/logout', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: `cp_admin_session=${encodeURIComponent(token)}`,
        'X-CSRF-Token': loginCsrf,
      },
    })
    assert.equal(badCsrfLogout.status, 403)
    assertErrorEnvelope(badCsrfLogout.body, 40301)

    const logout = await apiSend(server.baseUrl, '/api/admin/auth/logout', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: `cp_admin_session=${encodeURIComponent(token)}`,
        'X-CSRF-Token': sessionCsrf,
      },
    })
    assert.equal(logout.status, 200)
    assertSuccessEnvelope(logout.body)
    assert.equal(asObject(logout.body.data, 'data').logged_out, true)

    const after = await apiGet(server.baseUrl, '/api/admin/auth/session', {
      headers: { Cookie: `cp_admin_session=${encodeURIComponent(token)}` },
    })
    assert.equal(after.status, 401)
    assertErrorEnvelope(after.body, 40100)

    const tokenHash = createHash('sha256').update(token, 'utf8').digest('hex')
    const row = await prisma.adminSession.findUnique({ where: { tokenHash } })
    assert.ok(row?.revokedAt)
  })

  it('logout without session is idempotent', async () => {
    const res = await apiSend(server.baseUrl, '/api/admin/auth/logout', {
      method: 'POST',
      headers: { Origin: ORIGIN },
    })
    assert.equal(res.status, 200)
    assertSuccessEnvelope(res.body)
    assert.equal(asObject(res.body.data, 'data').logged_out, true)
  })

  it('rejects disallowed origin on login', async () => {
    const username = probeUsername(`origin_${randomBytes(3).toString('hex')}`)
    const password = `Pw_${randomBytes(6).toString('hex')}`
    await createProbeAdmin(username, password)

    const res = await apiSend(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: 'http://evil.example' },
      body: { username, password },
    })
    assert.equal(res.status, 403)
    assertErrorEnvelope(res.body, 40301)
  })

  it('disabled account cannot login or use session', async () => {
    const username = probeUsername(`off_${randomBytes(3).toString('hex')}`)
    const password = `Pw_${randomBytes(6).toString('hex')}`
    const user = await createProbeAdmin(username, password)

    const login = await apiSend(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: ORIGIN },
      body: { username, password },
    })
    assert.equal(login.status, 200)
    const token = readSetCookie(login.headers, 'cp_admin_session')
    assert.ok(token)

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { isActive: false },
    })

    const session = await apiGet(server.baseUrl, '/api/admin/auth/session', {
      headers: { Cookie: `cp_admin_session=${encodeURIComponent(token)}` },
    })
    assert.equal(session.status, 401)
    assertErrorEnvelope(session.body, 40100)

    const again = await apiSend(server.baseUrl, '/api/admin/auth/login', {
      method: 'POST',
      headers: { Origin: ORIGIN },
      body: { username, password },
    })
    assert.equal(again.status, 401)
    assertErrorEnvelope(again.body, 40101)
  })

  it('public health remains available without admin cookie', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/health')
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
  })
})
