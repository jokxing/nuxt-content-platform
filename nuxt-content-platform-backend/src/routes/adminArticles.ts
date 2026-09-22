import { Router } from 'express'
import {
  deleteAdminArticleById,
  getAdminArticleById,
  getAdminArticles,
  getAdminCategories,
  postAdminArticle,
  putAdminArticle,
} from '../controllers/adminArticleController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createAdminCategoriesRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getAdminCategories))
  return router
}

export function createAdminArticlesRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getAdminArticles))
  router.post('/', asyncHandler(postAdminArticle))
  router.get('/:id', asyncHandler(getAdminArticleById))
  router.put('/:id', asyncHandler(putAdminArticle))
  router.delete('/:id', asyncHandler(deleteAdminArticleById))
  return router
}
