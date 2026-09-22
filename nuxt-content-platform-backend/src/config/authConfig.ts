import type { Env } from './env.js'

export type AuthConfig = {
  allowedOrigins: string[]
  allowMissingOrigin: boolean
  cookieSecure: boolean
  idleTtlMs: number
  absoluteTtlMs: number
  touchThrottleMs: number
}

let authConfig: AuthConfig | null = null

const DEFAULT_IDLE_MS = 12 * 60 * 60 * 1000
const DEFAULT_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_TOUCH_MS = 5 * 60 * 1000

export function buildAuthConfig(env: Env): AuthConfig {
  const origins = env.ADMIN_ALLOWED_ORIGINS
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  return {
    allowedOrigins: origins,
    allowMissingOrigin: env.ADMIN_ALLOW_MISSING_ORIGIN,
    cookieSecure: env.ADMIN_COOKIE_SECURE ?? env.NODE_ENV === 'production',
    idleTtlMs: DEFAULT_IDLE_MS,
    absoluteTtlMs: DEFAULT_ABSOLUTE_MS,
    touchThrottleMs: DEFAULT_TOUCH_MS,
  }
}

export function initAuthConfig(env: Env): AuthConfig {
  authConfig = buildAuthConfig(env)
  return authConfig
}

export function getAuthConfig(): AuthConfig {
  if (!authConfig) {
    throw new Error('Auth config is not initialized')
  }
  return authConfig
}

/** 测试重置，避免用例间残留。 */
export function resetAuthConfigForTests(): void {
  authConfig = null
}
