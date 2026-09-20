import { Router } from 'express'
import { getCategories } from '../controllers/categoryController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createCategoriesRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getCategories))
  return router
}
