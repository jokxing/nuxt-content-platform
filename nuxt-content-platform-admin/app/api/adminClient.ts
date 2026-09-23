import type { AdminApiErrorBody } from '~/types/admin'

/**
 * 管理端集中 API 客户端。
 * 浏览器只请求同源 `/api/admin/*`；Cookie 走 credentials；不写 localStorage。
 */

export const ADMIN_API_WHITELIST = [
  'POST /api/admin/auth/login',
  'POST /api/admin/auth/logout',
  'GET /api/admin/auth/session',
  'GET /api/admin/categories',
  'GET /api/admin/articles',
  'GET /api/admin/articles/:id',
  'POST /api/admin/articles',
  'PUT /api/admin/articles/:id',
  'DELETE /api/admin/articles/:id',
  'POST /api/admin/media/images',
  'POST /api/admin/articles/:id/publish',
  'POST /api/admin/articles/:id/unpublish',
  'GET /api/admin/deployments',
  'GET /api/admin/deployments/:id',
  'POST /api/admin/deployments/:id/retry',
] as const

export type AdminApiPath = typeof ADMIN_API_WHITELIST[number]

export class AdminApiError extends Error {
  readonly statusCode: number
  readonly code: number
  readonly requestId: string | null

  constructor(statusCode: number, body: AdminApiErrorBody) {
    super(body.msg || '请求失败')
    this.name = 'AdminApiError'
    this.statusCode = statusCode
    this.code = body.code
    this.requestId = typeof body.requestId === 'string' ? body.requestId : null
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

function normalizePath(path: string): string {
  const withoutQuery = path.split('?')[0] || path
  return withoutQuery.replace(/\/$/, '') || '/'
}

function pathMatches(patternPath: string, actualPath: string): boolean {
  const patternParts = patternPath.split('/')
  const actualParts = actualPath.split('/')
  if (patternParts.length !== actualParts.length)
    return false
  for (let i = 0; i < patternParts.length; i++) {
    const expected = patternParts[i]!
    const actual = actualParts[i]!
    if (expected.startsWith(':'))
      continue
    if (expected !== actual)
      return false
  }
  return true
}

export function isWhitelistedAdminCall(method: HttpMethod, path: string): boolean {
  const normalized = normalizePath(path)
  const keyPrefix = `${method.toUpperCase()} `
  for (const entry of ADMIN_API_WHITELIST) {
    if (!entry.startsWith(keyPrefix))
      continue
    const entryPath = entry.slice(keyPrefix.length)
    if (pathMatches(entryPath, normalized))
      return true
  }
  return false
}

export type AdminApiRequestOptions = {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string | number | undefined | null>
  csrfToken?: string | null
  /** 401 时是否自动清会话并跳转登录；登录接口本身应为 false */
  redirectOnUnauthorized?: boolean
}

function buildUrl(path: string, query?: AdminApiRequestOptions['query']): string {
  const url = new URL(path, 'http://localhost')
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '')
        continue
      url.searchParams.set(key, String(value))
    }
  }
  return `${url.pathname}${url.search}`
}

/**
 * 调用同源管理 API。成功解包 data；失败抛 AdminApiError。
 */
export async function adminApiRequest<T>(
  path: string,
  options: AdminApiRequestOptions = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase() as HttpMethod
  const url = buildUrl(path, options.query)

  if (!isWhitelistedAdminCall(method, url.split('?')[0] || url)) {
    throw new AdminApiError(404, {
      code: 40400,
      msg: '接口不在管理端白名单内',
      data: null,
    })
  }

  const headers: Record<string, string> = {
    accept: 'application/json',
  }
  if (options.csrfToken)
    headers['x-csrf-token'] = options.csrfToken
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (options.body !== undefined && !isFormData)
    headers['content-type'] = 'application/json'

  // SSR 时转发浏览器 Cookie，避免跨请求串会话；客户端靠 credentials。
  if (import.meta.server) {
    const cookieHeaders = useRequestHeaders(['cookie'])
    if (cookieHeaders.cookie)
      headers.cookie = cookieHeaders.cookie
  }

  try {
    const response = await $fetch.raw<{
      code: number
      msg: string
      data: T
      requestId?: string
    }>(url, {
      method,
      headers,
      body: options.body as BodyInit | Record<string, unknown> | undefined,
      credentials: 'include',
    })

    const payload = response._data
    if (!payload || typeof payload !== 'object') {
      throw new AdminApiError(response.status, {
        code: 50000,
        msg: '响应格式无效',
        data: null,
      })
    }

    if (payload.code !== 0) {
      throw new AdminApiError(response.status, {
        code: payload.code,
        msg: payload.msg || '请求失败',
        data: null,
        requestId: payload.requestId,
      })
    }

    return payload.data
  }
  catch (error: unknown) {
    if (error instanceof AdminApiError) {
      if (options.redirectOnUnauthorized !== false && error.statusCode === 401 && error.code === 40100) {
        const auth = useAdminAuth()
        auth.clearSession()
        if (import.meta.client)
          await navigateTo('/login')
      }
      throw error
    }

    const fetchError = error as {
      statusCode?: number
      status?: number
      data?: AdminApiErrorBody
      message?: string
    }
    const statusCode = fetchError.statusCode || fetchError.status || 500
    const body = fetchError.data
    if (body && typeof body.code === 'number' && typeof body.msg === 'string') {
      const apiError = new AdminApiError(statusCode, body)
      if (options.redirectOnUnauthorized !== false && statusCode === 401 && body.code === 40100) {
        const auth = useAdminAuth()
        auth.clearSession()
        if (import.meta.client)
          await navigateTo('/login')
      }
      throw apiError
    }

    throw new AdminApiError(statusCode, {
      code: 50000,
      msg: '服务暂不可用',
      data: null,
    })
  }
}
