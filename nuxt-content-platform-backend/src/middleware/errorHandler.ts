import type { NextFunction, Request, Response } from 'express'
import { AppError, BusinessCode } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { failResponse } from '../lib/response.js'
import { getRequestId } from './requestId.js'

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(
    failResponse(BusinessCode.ROUTE_NOT_FOUND, '资源不存在', getRequestId(res)),
  )
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = getRequestId(res)

  if (err instanceof AppError) {
    if (!err.expose) {
      logger.error('handled_app_error', {
        requestId,
        code: err.code,
        statusCode: err.statusCode,
      })
    }
    if (err.headers) {
      for (const [key, value] of Object.entries(err.headers))
        res.setHeader(key, value)
    }
    res.status(err.statusCode).json(
      failResponse(
        err.code,
        err.expose ? err.message : '内部服务错误',
        requestId,
      ),
    )
    return
  }

  logger.error('unhandled_error', {
    requestId,
    name: err instanceof Error ? err.name : 'UnknownError',
  })
  res.status(500).json(
    failResponse(BusinessCode.INTERNAL_ERROR, '内部服务错误', requestId),
  )
}
