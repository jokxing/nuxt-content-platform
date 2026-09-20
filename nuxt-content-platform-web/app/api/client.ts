import type { FetchOptions } from 'ofetch'
import { normalizeTransportError, unwrapApiPayload } from './envelope'

export type ApiTransport = (path: string, options: Pick<FetchOptions<'json'>, 'query' | 'retry' | 'timeout'> & { method: 'GET' }) => Promise<unknown>

const endpoints = new Set([
  'latest',
  'history',
  'analysis',
  'advanced-stats',
  'ai-prediction',
  'articles',
  'categories',
  'content-directory',
  'lucky-number',
  'number-miss',
  'article-ids',
  'prose',
])

/** 每个 Nuxt 应用实例持有独立客户端，避免 SSR 请求共享可变请求头或令牌状态。 */
export function createContentApi(transport: ApiTransport) {
  return {
    async get<T = Record<string, any>>(path: string, options: Pick<FetchOptions<'json'>, 'params'> = {}): Promise<T> {
      const endpoint = path.replace(/^\/api\//, '')
      if (!path.startsWith('/api/') || (!endpoints.has(endpoint) && !/^articles\/\d+$/.test(endpoint)))
        throw new Error('Unsupported content API path')
      // 每次复制查询参数，避免语言和筛选条件污染后续 SSR 请求。
      try {
        const raw = await transport(path, { method: 'GET', query: { ...options.params }, retry: 0, timeout: 10000 })
        // 统一检查数字 code：成功提取 data；统计等无外壳 Mock 原样返回。页面禁止各自解包。
        return unwrapApiPayload<T>(raw)
      }
      catch (err) {
        normalizeTransportError(err)
      }
    },
  }
}
