import express from 'express'
import type { Env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestIdMiddleware } from './middleware/requestId.js'
import { createApiRouter } from './routes/index.js'
import { createDebugErrorRouter } from './routes/debugError.js'

export function createApp(env: Env) {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))
  app.use(requestIdMiddleware)

  // /health 挂在根路径，与 OpenAPI 一致（不在 /api 前缀下）。
  app.use(createApiRouter())

  // 非生产环境才挂调试路由，便于验证未处理异常外壳。
  if (env.NODE_ENV !== 'production') {
    app.use('/__debug', createDebugErrorRouter())
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
