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

const optionalBoolFromEnv = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .optional()
  .transform((value) => {
    if (value === undefined)
      return undefined
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
    /** 逗号分隔的管理站 Origin 白名单，例如 http://localhost:3670 */
    ADMIN_ALLOWED_ORIGINS: z.string().default('http://localhost:3670,http://127.0.0.1:3670'),
    /** 仅本地/测试允许缺少 Origin 的非浏览器请求。 */
    ADMIN_ALLOW_MISSING_ORIGIN: boolFromEnv,
    /** Cookie Secure；缺省时 production=true，其它环境 false。 */
    ADMIN_COOKIE_SECURE: optionalBoolFromEnv,
    /** 仅 ensure-admin 使用；不进 seed、不写文档示例真值。 */
    ADMIN_BOOTSTRAP_USERNAME: z.string().optional(),
    ADMIN_BOOTSTRAP_PASSWORD: z.string().optional(),
    ADMIN_BOOTSTRAP_DISPLAY_NAME: z.string().optional(),
    /** 媒体公开基址（无尾斜杠），本地如 http://127.0.0.1:4000/media */
    MEDIA_PUBLIC_BASE_URL: z.string().optional(),
    /** local | r2；缺省 local */
    MEDIA_STORAGE_DRIVER: z.enum(['local', 'r2']).optional(),
    /** 本地磁盘根目录；缺省 .data/media */
    MEDIA_LOCAL_ROOT: z.string().optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_ENDPOINT: z.string().optional(),
    /** A7 GitHub Actions 构建 worker；缺少任一必填项时 worker 拒绝启动。 */
    BUILD_GITHUB_OWNER: z.string().trim().min(1).optional(),
    BUILD_GITHUB_REPO: z.string().trim().min(1).optional(),
    BUILD_GITHUB_WORKFLOW: z.string().trim().min(1).default('content-deploy.yml'),
    BUILD_GITHUB_REF: z.string().trim().min(1).default('main'),
    BUILD_GITHUB_TOKEN: z.string().trim().min(1).optional(),
    BUILD_MERGE_WINDOW_SECONDS: z.coerce.number().int().min(0).max(180).default(120),
    BUILD_WORKER_INTERVAL_SECONDS: z.coerce.number().int().min(10).max(3600).default(30),
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
    if (value.NODE_ENV === 'production' && value.ADMIN_ALLOW_MISSING_ORIGIN) {
      ctx.addIssue({
        code: 'custom',
        path: ['ADMIN_ALLOW_MISSING_ORIGIN'],
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
    ADMIN_ALLOWED_ORIGINS: process.env.ADMIN_ALLOWED_ORIGINS,
    ADMIN_ALLOW_MISSING_ORIGIN: process.env.ADMIN_ALLOW_MISSING_ORIGIN,
    ADMIN_COOKIE_SECURE: process.env.ADMIN_COOKIE_SECURE,
    ADMIN_BOOTSTRAP_USERNAME: process.env.ADMIN_BOOTSTRAP_USERNAME,
    ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    ADMIN_BOOTSTRAP_DISPLAY_NAME: process.env.ADMIN_BOOTSTRAP_DISPLAY_NAME,
    MEDIA_PUBLIC_BASE_URL: process.env.MEDIA_PUBLIC_BASE_URL,
    MEDIA_STORAGE_DRIVER: process.env.MEDIA_STORAGE_DRIVER,
    MEDIA_LOCAL_ROOT: process.env.MEDIA_LOCAL_ROOT,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    BUILD_GITHUB_OWNER: process.env.BUILD_GITHUB_OWNER,
    BUILD_GITHUB_REPO: process.env.BUILD_GITHUB_REPO,
    BUILD_GITHUB_WORKFLOW: process.env.BUILD_GITHUB_WORKFLOW,
    BUILD_GITHUB_REF: process.env.BUILD_GITHUB_REF,
    BUILD_GITHUB_TOKEN: process.env.BUILD_GITHUB_TOKEN,
    BUILD_MERGE_WINDOW_SECONDS: process.env.BUILD_MERGE_WINDOW_SECONDS,
    BUILD_WORKER_INTERVAL_SECONDS: process.env.BUILD_WORKER_INTERVAL_SECONDS,
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
