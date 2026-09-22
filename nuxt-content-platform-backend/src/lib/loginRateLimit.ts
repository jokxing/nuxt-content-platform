import { loginRateLimited } from './errors.js'

const MAX_FAILURES = 5
const WINDOW_MS = 15 * 60 * 1000

type FailureBucket = {
  count: number
  windowStartedAt: number
}

const buckets = new Map<string, FailureBucket>()

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

function bucketKey(clientIp: string, username: string): string {
  return `${clientIp}|${normalizeUsername(username)}`
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStartedAt >= WINDOW_MS)
      buckets.delete(key)
  }
}

/** 测试用：清空全部限速桶。 */
export function resetLoginRateLimitForTests(): void {
  buckets.clear()
}

/**
 * 登录前检查；超限抛 42900。
 * 键为客户端 IP + 规范化用户名，不记录密码。
 */
export function assertLoginNotRateLimited(clientIp: string, username: string, now = Date.now()): void {
  pruneExpired(now)
  const key = bucketKey(clientIp, username)
  const bucket = buckets.get(key)
  if (!bucket)
    return
  if (now - bucket.windowStartedAt >= WINDOW_MS) {
    buckets.delete(key)
    return
  }
  if (bucket.count >= MAX_FAILURES) {
    const retryAfterMs = WINDOW_MS - (now - bucket.windowStartedAt)
    throw loginRateLimited(retryAfterMs / 1000)
  }
}

export function recordLoginFailure(clientIp: string, username: string, now = Date.now()): void {
  pruneExpired(now)
  const key = bucketKey(clientIp, username)
  const existing = buckets.get(key)
  if (!existing || now - existing.windowStartedAt >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStartedAt: now })
    return
  }
  existing.count += 1
}

export function clearLoginFailures(clientIp: string, username: string): void {
  buckets.delete(bucketKey(clientIp, username))
}
