/**
 * 构建前拉取/固化 content-directory 快照（真实模式一次 HTTP；Mock 模式离线读 catalog）。
 * 失败必须中止，避免残缺预渲染/sitemap。
 */
import process from 'node:process'
import { MOCK_ARTICLES } from '../app/mock/data/catalog'
import {
  writeContentDirectorySnapshot,
} from './content-directory'
import type { ContentArticle } from './content-directory'

async function loadFromUpstream(): Promise<ContentArticle[]> {
  const base = (process.env.NUXT_CONTENT_API_BASE_URL || '').replace(/\/$/, '')
  if (!base)
    throw new Error('NUXT_CONTENT_API_USE_REAL=true requires NUXT_CONTENT_API_BASE_URL')

  const url = `${base}/api/content-directory`
  const response = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  const body = await response.json() as {
    code?: number
    msg?: string
    data?: { articles?: Array<{ id: number, parent_route: string, status: number, publish_date: number }> }
  }

  if (!response.ok || body.code !== 0 || !body.data?.articles) {
    throw new Error(
      `content-directory failed: HTTP ${response.status}, code=${body.code}, msg=${body.msg || 'unknown'}`,
    )
  }

  return body.data.articles.map(a => ({
    id: a.id,
    parent_route: a.parent_route,
    status: a.status,
    publish_date: a.publish_date,
  }))
}

async function main() {
  const useReal = process.env.NUXT_CONTENT_API_USE_REAL === 'true'
  const articles = useReal
    ? await loadFromUpstream()
    : MOCK_ARTICLES.map(a => ({
        id: a.id,
        parent_route: a.parent_route,
        status: a.status,
        publish_date: a.publish_date,
      }))

  writeContentDirectorySnapshot({
    articles,
    source: useReal ? 'content-directory' : 'mock',
    fetchedAt: Date.now(),
  })
  console.log(`[content-directory] snapshot written (${useReal ? 'real' : 'mock'}), articles=${articles.length}`)
}

main().catch((err) => {
  console.error('[content-directory] prepare failed:', err)
  process.exit(1)
})
