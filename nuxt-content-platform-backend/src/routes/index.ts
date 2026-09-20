import { Router } from 'express'
import { createArticlesRouter } from './articles.js'
import { createCategoriesRouter } from './categories.js'
import { createContentDirectoryRouter } from './contentDirectory.js'
import { createHealthRouter } from './health.js'

export function createApiRouter(): Router {
  const router = Router()
  router.use('/health', createHealthRouter())
  router.use('/api/categories', createCategoriesRouter())
  router.use('/api/articles', createArticlesRouter())
  router.use('/api/content-directory', createContentDirectoryRouter())
  return router
}
