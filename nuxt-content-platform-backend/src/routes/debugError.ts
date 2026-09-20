import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'

/** Development-only probes for error envelope verification. */
export function createDebugErrorRouter(): Router {
  const router = Router()
  router.get('/unhandled', (_req: Request, _res: Response, next: NextFunction) => {
    next(new Error('forced_unhandled'))
  })
  return router
}
