import { Router } from 'express'
import {
  getAdminSession,
  postAdminLogin,
  postAdminLogout,
} from '../controllers/adminAuthController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createAdminAuthRouter(): Router {
  const router = Router()
  router.post('/login', asyncHandler(postAdminLogin))
  router.post('/logout', asyncHandler(postAdminLogout))
  router.get('/session', asyncHandler(getAdminSession))
  return router
}
