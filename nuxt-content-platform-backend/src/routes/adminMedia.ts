import { Router } from 'express'
import { postAdminMediaImage } from '../controllers/adminMediaController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createAdminMediaRouter(): Router {
  const router = Router()
  router.post('/images', asyncHandler(postAdminMediaImage))
  return router
}
