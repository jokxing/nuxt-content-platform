import { createApp } from './app.js'
import { loadEnv } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './db/prisma.js'
import { logger } from './lib/logger.js'

async function main(): Promise<void> {
  const env = loadEnv()
  const app = createApp(env)

  if (env.DATABASE_URL) {
    try {
      await connectDatabase()
    }
    catch (error) {
      logger.error('database_connect_failed', {
        name: error instanceof Error ? error.name : 'UnknownError',
      })
      // Process still starts; /health returns 503 until DB is reachable.
    }
  }
  else {
    logger.warn('database_url_missing')
  }

  const server = app.listen(env.PORT, '127.0.0.1', () => {
    logger.info('server_started', {
      port: env.PORT,
      nodeEnv: env.NODE_ENV,
      databaseConfigured: Boolean(env.DATABASE_URL),
    })
  })

  const shutdown = async (signal: string) => {
    logger.info('server_shutdown', { signal })
    server.close(async () => {
      try {
        await disconnectDatabase()
      }
      catch {
        // ignore disconnect errors on shutdown
      }
      process.exit(0)
    })
  }

  process.on('SIGINT', () => {
    void shutdown('SIGINT')
  })
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM')
  })
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'startup_failed'
  logger.error(message)
  process.exit(1)
})
