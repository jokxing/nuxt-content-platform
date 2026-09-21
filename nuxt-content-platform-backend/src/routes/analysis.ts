import { Router } from 'express'
import { getAnalysisHandler } from '../controllers/analysisController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createAnalysisRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getAnalysisHandler))
  return router
}
