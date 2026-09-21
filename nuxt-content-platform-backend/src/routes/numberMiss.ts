import { Router } from 'express'
import { getNumberMissHandler } from '../controllers/numberMissController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createNumberMissRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getNumberMissHandler))
  return router
}
