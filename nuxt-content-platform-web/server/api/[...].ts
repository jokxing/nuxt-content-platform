/**
 * Nitro Mock API：/api/** → app/mock
 * 页面统一通过 useContentApi 调用；SSR 内部分发与浏览器 HTTP 共用此入口。
 */
import { createError, defineEventHandler, getQuery } from 'h3'
import { mockHandleApi } from '../../app/mock'

export default defineEventHandler(async (event) => {
  try {
    const path = event.path || '/api/'
    const query = getQuery(event)
    return await mockHandleApi(path, query as Record<string, any>)
  }
  catch (err: any) {
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'Mock API error',
    })
  }
})
