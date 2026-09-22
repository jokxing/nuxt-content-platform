import { Router } from 'express'
import { createAdminArticlesRouter, createAdminCategoriesRouter } from './adminArticles.js'
import { createAdminAuthRouter } from './adminAuth.js'
import { createAdminMediaRouter } from './adminMedia.js'
import { createAdvancedStatsRouter } from './advancedStats.js'
import { createAnalysisRouter } from './analysis.js'
import { createArticlesRouter } from './articles.js'
import { createCategoriesRouter } from './categories.js'
import { createContentDirectoryRouter } from './contentDirectory.js'
import { createDemoCombinationsRouter } from './demoCombinations.js'
import { createHealthRouter } from './health.js'
import { createHistoryRouter } from './history.js'
import { createLatestRouter } from './latest.js'
import { createLocalMediaRouter } from './localMedia.js'
import { createNumberMissRouter } from './numberMiss.js'

export function createApiRouter(): Router {
  const router = Router()
  router.use('/health', createHealthRouter())
  router.use('/media', createLocalMediaRouter())
  router.use('/api/admin/auth', createAdminAuthRouter())
  router.use('/api/admin/categories', createAdminCategoriesRouter())
  router.use('/api/admin/articles', createAdminArticlesRouter())
  router.use('/api/admin/media', createAdminMediaRouter())
  router.use('/api/categories', createCategoriesRouter())
  router.use('/api/articles', createArticlesRouter())
  router.use('/api/content-directory', createContentDirectoryRouter())
  router.use('/api/latest', createLatestRouter())
  router.use('/api/history', createHistoryRouter())
  router.use('/api/analysis', createAnalysisRouter())
  router.use('/api/advanced-stats', createAdvancedStatsRouter())
  router.use('/api/number-miss', createNumberMissRouter())
  router.use('/api/demo-combinations', createDemoCombinationsRouter())
  return router
}
