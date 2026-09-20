import { Router } from 'express'
import { getArticle, getArticles } from '../controllers/articleController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createArticlesRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getArticles))
  router.get('/:id', asyncHandler(getArticle))
  return router
}
