import { Router } from 'express'
import { getHealth } from '../controllers/healthController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createHealthRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getHealth))
  return router
}
