import type { H3Event } from 'h3'
import {
  appendResponseHeader,
  createError,
  getHeader,
  getQuery,
  getRequestURL,
  readRawBody,
  setResponseStatus,
} from 'h3'

type AdminRouteRule = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 相对 /api/admin 的路径模式，如 auth/login、articles/:id */
  pattern: string
  queryKeys: readonly string[]
}

/**
 * 固定白名单：方法 + 路径 + 允许的 query。
 * 未知组合一律拒绝，不做任意代理。
 */
const ADMIN_ROUTE_RULES: readonly AdminRouteRule[] = [
  { method: 'POST', pattern: 'auth/login', queryKeys: [] },
  { method: 'POST', pattern: 'auth/logout', queryKeys: [] },
  { method: 'GET', pattern: 'auth/session', queryKeys: [] },
  { method: 'GET', pattern: 'categories', queryKeys: [] },
  { method: 'GET', pattern: 'articles', queryKeys: ['status', 'category', 'q', 'page', 'page_size'] },
  { method: 'POST', pattern: 'articles', queryKeys: [] },
  { method: 'GET', pattern: 'articles/:id', queryKeys: [] },
  { method: 'PUT', pattern: 'articles/:id', queryKeys: [] },
  { method: 'DELETE', pattern: 'articles/:id', queryKeys: [] },
  { method: 'POST', pattern: 'articles/:id/publish', queryKeys: [] },
  { method: 'POST', pattern: 'articles/:id/unpublish', queryKeys: [] },
  { method: 'GET', pattern: 'deployments', queryKeys: ['status', 'reason', 'page', 'page_size'] },
  { method: 'GET', pattern: 'deployments/:id', queryKeys: [] },
]

function matchPattern(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')
  if (patternParts.length !== pathParts.length)
    return false
  for (let i = 0; i < patternParts.length; i++) {
    const expected = patternParts[i]!
    const actual = pathParts[i]!
    if (expected.startsWith(':')) {
      if (!/^\d+$/.test(actual))
        return false
      const id = Number(actual)
      if (!Number.isInteger(id) || id < 1 || id > 2147483647)
        return false
      continue
    }
    if (expected !== actual)
      return false
  }
  return true
}

export function matchAdminRoute(
  method: string,
  cleanPath: string,
): AdminRouteRule | null {
  const normalizedMethod = method.toUpperCase()
  for (const rule of ADMIN_ROUTE_RULES) {
    if (rule.method !== normalizedMethod)
      continue
    if (matchPattern(rule.pattern, cleanPath))
      return rule
  }
  return null
}

function pickAllowedQuery(
  query: Record<string, unknown>,
  allowed: readonly string[],
): Record<string, string> {
  const unknown = Object.keys(query).filter(key => !allowed.includes(key))
  if (unknown.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported query parameter: ${unknown[0]}`,
    })
  }

  const out: Record<string, string> = {}
  for (const key of allowed) {
    const value = query[key]
    if (value === undefined || value === null)
      continue
    if (Array.isArray(value)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Duplicate or array query not allowed: ${key}`,
      })
    }
    const text = String(value)
    if (!text) {
      throw createError({
        statusCode: 400,
        statusMessage: `Empty query not allowed: ${key}`,
      })
    }
    out[key] = text
  }
  return out
}

function forwardSetCookie(event: H3Event, headers: Headers): void {
  const anyHeaders = headers as Headers & { getSetCookie?: () => string[] }
  const lines = typeof anyHeaders.getSetCookie === 'function'
    ? anyHeaders.getSetCookie()
    : (() => {
        const single = headers.get('set-cookie')
        return single ? [single] : []
      })()
  for (const line of lines)
    appendResponseHeader(event, 'set-cookie', line)
}

/**
 * 将白名单管理请求代理到 Express。
 * 转发 Cookie / Origin / CSRF；不转发 Authorization；不做任意路径代理。
 */
export async function proxyAdminApi(event: H3Event): Promise<unknown> {
  const method = event.method
  const requestUrl = getRequestURL(event)
  const clean = requestUrl.pathname
    .replace(/^\/api\/admin\/?/, '')
    .replace(/\/$/, '')

  if (!clean) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Admin API path required',
    })
  }

  const rule = matchAdminRoute(method, clean)
  if (!rule) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Admin API route is not allowed',
    })
  }

  const query = getQuery(event) as Record<string, unknown>
  const params = pickAllowedQuery(query, rule.queryKeys)

  const config = useRuntimeConfig(event)
  const base = String(config.adminApiBaseUrl || '').replace(/\/$/, '')
  if (!base) {
    throw createError({
      statusCode: 503,
      statusMessage: 'NUXT_ADMIN_API_BASE_URL is required for admin BFF',
    })
  }

  const upstream = new URL(`/api/admin/${clean}`, `${base}/`)
  for (const [key, value] of Object.entries(params))
    upstream.searchParams.set(key, value)

  const headers: Record<string, string> = {
    accept: 'application/json',
  }

  const cookie = getHeader(event, 'cookie')
  if (cookie)
    headers.cookie = cookie

  const origin = getHeader(event, 'origin')
  if (origin)
    headers.origin = origin

  const csrf = getHeader(event, 'x-csrf-token')
  if (csrf)
    headers['x-csrf-token'] = csrf

  const contentType = getHeader(event, 'content-type')
  let body: Buffer | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readRawBody(event, false) as Buffer | undefined
    if (contentType)
      headers['content-type'] = contentType
    else if (body && body.length > 0)
      headers['content-type'] = 'application/json'
  }

  try {
    const response = await $fetch.raw(upstream.toString(), {
      method,
      headers,
      body,
      timeout: 15000,
      retry: 0,
      ignoreResponseError: true,
    })
    forwardSetCookie(event, response.headers)
    setResponseStatus(event, response.status)
    return response._data
  }
  catch (err: unknown) {
    const error = err as { statusCode?: number, status?: number, statusMessage?: string, message?: string, data?: unknown }
    throw createError({
      statusCode: error.statusCode || error.status || 503,
      statusMessage: error.statusMessage || error.message || 'Admin API upstream unavailable',
      data: error.data ?? null,
    })
  }
}
