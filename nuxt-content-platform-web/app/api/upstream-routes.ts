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
