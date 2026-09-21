import { Router } from 'express'
import { getLatestHandler } from '../controllers/latestController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createLatestRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getLatestHandler))
  return router
}
