import { Router } from 'express'
import { getContentDirectoryHandler } from '../controllers/contentDirectoryController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createContentDirectoryRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getContentDirectoryHandler))
  return router
}
