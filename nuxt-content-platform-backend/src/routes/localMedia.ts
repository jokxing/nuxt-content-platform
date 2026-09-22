import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { Router } from 'express'
import { getMediaConfig, MEDIA_CACHE_CONTROL } from '../config/mediaConfig.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { routeNotFound } from '../lib/errors.js'

/**
 * 本地开发公开读媒体：GET /media/covers/...
 * 仅映射到 localRoot 下 covers/，拒绝穿越。
 */
export function createLocalMediaRouter(): Router {
  const router = Router()

  router.get(/.*/, asyncHandler(async (req, res) => {
    const config = getMediaConfig()
    if (config.driver !== 'local')
      throw routeNotFound()

    const raw = String(req.path || '').replace(/^\/+/, '')
    if (!raw.startsWith('covers/') || raw.includes('..') || raw.includes('\\'))
      throw routeNotFound()

    const root = resolve(config.localRoot)
    const full = resolve(join(root, raw))
    if (full !== root && !full.startsWith(root + sep))
      throw routeNotFound()
    if (!existsSync(full) || !statSync(full).isFile())
      throw routeNotFound()

    res.setHeader('Cache-Control', MEDIA_CACHE_CONTROL)
    res.setHeader('Content-Type', 'image/webp')
    createReadStream(full).pipe(res)
  }))

  return router
}
