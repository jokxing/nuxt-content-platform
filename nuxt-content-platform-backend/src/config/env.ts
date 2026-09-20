import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

// 加载本地 .env（若存在）；禁止打印变量值。
loadDotenv({ path: '.env', quiet: true })

const mysqlUrl = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => value.startsWith('mysql://') || value.startsWith('mysqls://'),
    'must use mysql:// or mysqls://',
  )

const boolFromEnv = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .optional()
  .transform((value) => {
    if (value === undefined)
      return false
    if (typeof value === 'boolean')
      return value
    return value === 'true' || value === '1'
  })

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: mysqlUrl.optional(),
    SHADOW_DATABASE_URL: mysqlUrl.optional(),
    /** 显式开启 /__debug；production 下禁止为 true。 */
    ENABLE_DEBUG_ROUTES: boolFromEnv,
  })
  .superRefine((value, ctx) => {
    if (value.DATABASE_URL && value.SHADOW_DATABASE_URL && value.DATABASE_URL === value.SHADOW_DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['SHADOW_DATABASE_URL'],
        message: 'must differ from DATABASE_URL',
      })
    }
    if (value.NODE_ENV === 'production' && value.ENABLE_DEBUG_ROUTES) {
      ctx.addIssue({
        code: 'custom',
        path: ['ENABLE_DEBUG_ROUTES'],
        message: 'must not be enabled in production',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

function readProcessEnv(): Record<string, string | undefined> {
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL,
    ENABLE_DEBUG_ROUTES: process.env.ENABLE_DEBUG_ROUTES,
  }
}

/**
 * 校验进程环境变量形态，不建立数据库连接，也不记录连接串。
 */
export function loadEnv(raw: Record<string, string | undefined> = readProcessEnv()): Env {
  const parsed = envSchema.safeParse(raw)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid environment: ${details}`)
  }
  return parsed.data
}

/** migrate/seed 前要求业务库与影子库 URL 都已配置。 */
export function requireDatabaseEnv(
  raw: Record<string, string | undefined> = readProcessEnv(),
): Env & { DATABASE_URL: string, SHADOW_DATABASE_URL: string } {
  const env = loadEnv(raw)
  if (!env.DATABASE_URL || !env.SHADOW_DATABASE_URL) {
    throw new Error(
      'DATABASE_URL and SHADOW_DATABASE_URL are required for migrate/seed. Copy .env.example to .env and fill dedicated MySQL credentials (see docs/backend/MYSQL_SETUP.md).',
    )
  }
  return env as Env & { DATABASE_URL: string, SHADOW_DATABASE_URL: string }
}

/** /__debug 仅在 test 或显式 ENABLE_DEBUG_ROUTES 时挂载。 */
export function shouldMountDebugRoutes(env: Env): boolean {
  return env.NODE_ENV === 'test' || env.ENABLE_DEBUG_ROUTES === true
}
