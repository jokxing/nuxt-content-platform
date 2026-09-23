import { Router } from 'express'
import {
  getAdminDeployment,
  getAdminDeployments,
  postAdminDeploymentRetry,
} from '../controllers/adminDeploymentController.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export function createAdminDeploymentsRouter(): Router {
  const router = Router()
  router.get('/', asyncHandler(getAdminDeployments))
  router.get('/:id', asyncHandler(getAdminDeployment))
  router.post('/:id/retry', asyncHandler(postAdminDeploymentRetry))
  return router
}
