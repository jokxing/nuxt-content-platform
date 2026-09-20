import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const REQUEST_ID_HEADER = 'x-request-id'

export function getRequestId(res: Response): string {
  const value = res.locals.requestId
  return typeof value === 'string' && value.length > 0 ? value : 'unknown'
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER)?.trim()
  const requestId = incoming && incoming.length > 0 ? incoming.slice(0, 128) : randomUUID()
  res.locals.requestId = requestId
  res.setHeader(REQUEST_ID_HEADER, requestId)
  next()
}
