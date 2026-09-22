/**
 * 同源 `/api/admin/**` BFF：仅白名单方法/路径/query 代理到私有 Express 上游。
 * 浏览器不得直连后端；上游地址不进入 public runtimeConfig。
 */
import { createError, defineEventHandler } from 'h3'
import { proxyAdminApi } from '../../utils/adminApiProxy'

export default defineEventHandler(async (event) => {
  try {
    return await proxyAdminApi(event)
  }
  catch (err: unknown) {
    const error = err as { statusCode?: number, statusMessage?: string, message?: string, data?: unknown }
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Admin API error',
      data: error.data,
    })
  }
})
