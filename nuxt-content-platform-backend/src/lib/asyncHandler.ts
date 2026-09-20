import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { mapDatabaseError } from './dbErrors.js'
import { AppError } from './errors.js'

type AsyncRouteHandler = (req: Request, res: Response) => Promise<void>

/**
 * 把 async controller 的异常交给全局错误中间件。
 * AppError 原样传递；其余按数据库/内部错误映射，避免每个 controller 复制 try/catch。
 */
export function asyncHandler(handler: AsyncRouteHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch((error: unknown) => {
      if (error instanceof AppError) {
        next(error)
        return
      }
      next(mapDatabaseError(error))
    })
  }
}
