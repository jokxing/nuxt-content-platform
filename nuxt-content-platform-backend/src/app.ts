import express from 'express'
import { initAuthConfig } from './config/authConfig.js'
import type { Env } from './config/env.js'
import { shouldMountDebugRoutes } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestIdMiddleware } from './middleware/requestId.js'
import { createApiRouter } from './routes/index.js'
import { createDebugErrorRouter } from './routes/debugError.js'

export function createApp(env: Env) {
  initAuthConfig(env)
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))
  app.use(requestIdMiddleware)

  // /health 挂在根路径，与 OpenAPI 一致（不在 /api 前缀下）。
  app.use(createApiRouter())

  // 仅 test 或 ENABLE_DEBUG_ROUTES=true；不得仅凭非 production 公开。
  if (shouldMountDebugRoutes(env)) {
    app.use('/__debug', createDebugErrorRouter())
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
