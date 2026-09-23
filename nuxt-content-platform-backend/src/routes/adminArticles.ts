import { Router } from 'express'
import {
  deleteAdminArticleById,
  getAdminArticleById,
  getAdminArticles,
  getAdminCategories,
  postAdminArticle,
  postAdminArticlePublish,
  postAdminArticleUnpublish,
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
  // 静态段须在 /:id 之前注册，避免被当成 id
  router.post('/:id/publish', asyncHandler(postAdminArticlePublish))
  router.post('/:id/unpublish', asyncHandler(postAdminArticleUnpublish))
  router.get('/:id', asyncHandler(getAdminArticleById))
  router.put('/:id', asyncHandler(putAdminArticle))
  router.delete('/:id', asyncHandler(deleteAdminArticleById))
  return router
}
