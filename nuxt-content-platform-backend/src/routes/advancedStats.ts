import { Router } from 'express'
import { getAdvancedStatsHandler } from '../controllers/advancedStatsController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createAdvancedStatsRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getAdvancedStatsHandler))
  return router
}
