import process from 'node:process'
import { loadEnv } from '../src/config/env.js'
import { connectDatabase, disconnectDatabase } from '../src/db/prisma.js'
import { logger } from '../src/lib/logger.js'
import { requireBuildWorkerConfig, runBuildWorkerOnce } from '../src/services/buildWorkerService.js'

const once = process.argv.includes('--once')
const dryRun = process.argv.includes('--dry-run')

async function main(): Promise<void> {
  const env = loadEnv()
  const workerConfig = requireBuildWorkerConfig(env)
  await connectDatabase()

  const tick = async () => {
    const ids = await runBuildWorkerOnce(workerConfig, dryRun)
    logger.info(dryRun ? 'build_worker_dry_run' : 'build_worker_tick', { eventIds: ids })
  }

  await tick()
  if (once)
    return
  setInterval(() => void tick().catch(error => logger.error('build_worker_tick_failed', {
    name: error instanceof Error ? error.name : 'UnknownError',
  })), env.BUILD_WORKER_INTERVAL_SECONDS * 1000)
}

main()
  .then(async () => {
    if (once)
      await disconnectDatabase()
  })
  .catch(async (error: unknown) => {
    logger.error('build_worker_failed', { name: error instanceof Error ? error.name : 'UnknownError' })
    await disconnectDatabase().catch(() => undefined)
    process.exit(1)
  })
