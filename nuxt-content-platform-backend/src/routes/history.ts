import { Router } from 'express'
import { getHistoryHandler } from '../controllers/historyController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createHistoryRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getHistoryHandler))
  return router
}
