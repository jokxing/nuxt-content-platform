import type { FetchOptions } from 'ofetch'

export type ApiTransport = (path: string, options: Pick<FetchOptions<'json'>, 'query' | 'retry' | 'timeout'> & { method: 'GET' }) => Promise<unknown>

const endpoints = new Set(['latest', 'history', 'analysis', 'advanced-stats', 'ai-prediction', 'articles', 'lucky-number', 'number-miss', 'article-ids', 'prose'])

/** No singleton, ambient headers or token storage: one client belongs to one Nuxt app. */
export function createContentApi(transport: ApiTransport) {
  return {
    async get<T = Record<string, any>>(path: string, options: Pick<FetchOptions<'json'>, 'params'> = {}): Promise<T> {
      const endpoint = path.replace(/^\/api\//, '')
      if (!path.startsWith('/api/') || (!endpoints.has(endpoint) && !/^articles\/\d+$/.test(endpoint)))
        throw new Error('Unsupported content API path')
      // Fresh query object per invocation; locale/filters never become shared client defaults.
      return await transport(path, { method: 'GET', query: { ...options.params }, retry: 0, timeout: 10000 }) as T
    },
  }
}
