/**
 * Nitro /api/**：资讯路径在 NUXT_CONTENT_API_USE_REAL 时代理到 Express；其余（含统计）继续 Mock。
 * 上游失败不回退 Mock。私有 base URL 不进入 public runtimeConfig。
 */
import { createError, defineEventHandler, getQuery } from 'h3'
import { mockHandleApi } from '../../app/mock'
import { matchContentUpstreamPath, proxyContentApi } from '../utils/contentApiProxy'

export default defineEventHandler(async (event) => {
  try {
    const path = event.path || '/api/'
    const withoutQuery = path.split('?')[0] || path
    const clean = withoutQuery.replace(/^\/api\/?/, '').replace(/\/$/, '')
    const query = getQuery(event) as Record<string, unknown>

    if (matchContentUpstreamPath(clean)) {
      const proxied = await proxyContentApi(event, clean, query)
      if (proxied !== null)
        return proxied
    }

    return await mockHandleApi(path, query as Record<string, any>)
  }
  catch (err: any) {
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'API error',
      data: err?.data,
    })
  }
})
