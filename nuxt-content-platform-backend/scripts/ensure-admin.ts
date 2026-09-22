/**
 * 仅创建缺失的管理员账号。凭据只从环境变量读取，成功/失败日志不含密码。
 * 用法：在 backend 目录配置 ADMIN_BOOTSTRAP_* 后执行 `pnpm admin:ensure`。
 */
import { loadEnv, requireDatabaseEnv } from '../src/config/env.js'
import { connectDatabase, disconnectDatabase } from '../src/db/prisma.js'
import { ensureAdminUser } from '../src/services/adminAuthService.js'

async function main(): Promise<void> {
  requireDatabaseEnv()
  const env = loadEnv()
  const username = env.ADMIN_BOOTSTRAP_USERNAME?.trim()
  const password = env.ADMIN_BOOTSTRAP_PASSWORD
  const displayName = env.ADMIN_BOOTSTRAP_DISPLAY_NAME?.trim() || '管理员'

  if (!username || !password) {
    throw new Error(
      'ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD are required (set in local .env; do not commit).',
    )
  }

  await connectDatabase()
  try {
    const result = await ensureAdminUser({ username, password, displayName })
    if (result === 'created')
      console.log('admin_ensure: created')
    else
      console.log('admin_ensure: exists')
  }
  finally {
    await disconnectDatabase()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'admin_ensure_failed'
  console.error(message)
  process.exit(1)
})
