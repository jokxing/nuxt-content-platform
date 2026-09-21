import type { H3Event } from 'h3'
import { createError } from 'h3'

/** 仅允许资讯与统计上游固定路径与查询键；不透传任意 URL 或认证头。 */
const ALLOWED_QUERY: Record<string, readonly string[]> = {
  articles: ['lang', 'category', 'page', 'page_size'],
  categories: ['lang'],
  'content-directory': [],
  latest: [],
  history: ['page', 'page_size', 'year', 'period_code', 'number', 'periods'],
  analysis: ['period'],
  'advanced-stats': ['period'],
  'number-miss': ['period'],
  'demo-combinations': ['lang'],
}

const EXACT_UPSTREAM = new Set([
  'articles',
  'categories',
  'content-directory',
  'latest',
  'history',
  'analysis',
  'advanced-stats',
  'number-miss',
  'demo-combinations',
])

export function matchContentUpstreamPath(cleanPath: string): { upstreamPath: string, queryKeys: readonly string[] } | null {
  if (EXACT_UPSTREAM.has(cleanPath)) {
    return { upstreamPath: `/api/${cleanPath}`, queryKeys: ALLOWED_QUERY[cleanPath]! }
  }
  const detail = cleanPath.match(/^articles\/(\d+)$/)
  if (detail?.[1])
    return { upstreamPath: `/api/articles/${detail[1]}`, queryKeys: ['lang'] }
  return null
}

function pickAllowedQuery(query: Record<string, unknown>, allowed: readonly string[]): Record<string, string> {
  const unknown = Object.keys(query).filter(key => !allowed.includes(key))
  if (unknown.length > 0)
    throw createError({ statusCode: 400, statusMessage: `Unsupported query parameter: ${unknown[0]}` })

  const out: Record<string, string> = {}
  for (const key of allowed) {
    const value = query[key]
    if (value === undefined || value === null)
      continue
    if (Array.isArray(value))
      throw createError({ statusCode: 400, statusMessage: `Duplicate or array query not allowed: ${key}` })
    const text = String(value)
    if (!text)
      throw createError({ statusCode: 400, statusMessage: `Empty query not allowed: ${key}` })
    out[key] = text
  }
  return out
}

/**
 * 将白名单请求代理到 Express；失败明确抛错，不回退 Mock。
 * baseUrl / useReal 来自私有 runtimeConfig，不进入 public。
 */
export async function proxyContentApi(
  event: H3Event,
  cleanPath: string,
  query: Record<string, unknown>,
): Promise<unknown> {
  const config = useRuntimeConfig(event)
  const useReal = Boolean(config.contentApiUseReal)
  if (!useReal)
    return null

  const matched = matchContentUpstreamPath(cleanPath)
  if (!matched)
    return null

  const base = String(config.contentApiBaseUrl || '').replace(/\/$/, '')
  if (!base) {
    throw createError({
      statusCode: 503,
      statusMessage: 'NUXT_CONTENT_API_BASE_URL is required when NUXT_CONTENT_API_USE_REAL=true',
    })
  }

  const params = pickAllowedQuery(query, matched.queryKeys)
  const url = new URL(matched.upstreamPath, `${base}/`)
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)

  try {
    const response = await $fetch.raw(url.toString(), {
      method: 'GET',
      // 不转发来访 Cookie / Authorization
      headers: { accept: 'application/json' },
      timeout: 10000,
      retry: 0,
      ignoreResponseError: true,
    })
    setResponseStatus(event, response.status)
    return response._data
  }
  catch (err: any) {
    throw createError({
      statusCode: err?.statusCode || err?.status || 503,
      statusMessage: err?.statusMessage || err?.message || 'Content API upstream unavailable',
      data: err?.data ?? null,
    })
  }
}
