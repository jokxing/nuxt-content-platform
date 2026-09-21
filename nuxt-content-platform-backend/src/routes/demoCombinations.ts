import { Router } from 'express'
import { getDemoCombinationsHandler } from '../controllers/fixedDemoController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createDemoCombinationsRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getDemoCombinationsHandler))
  return router
}
