import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { MOCK_ARTICLES } from '../app/mock/data/catalog'
import { toSitemapLastmod } from '../app/utils/publishTime'

export const locales = ['zh-HK', 'zh-CN', 'en-US'] as const
const categories: readonly string[] = ['education', 'analysis', 'story']

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const localEnvPath = join(projectRoot, '.env')
if (existsSync(localEnvPath))
  process.loadEnvFile(localEnvPath)

// Nuxt prepare/typecheck may recreate .nuxt; retain the shared content snapshot outside it.
const snapshotPath = join(projectRoot, '.cache/content-directory-snapshot.json')

export interface ContentArticle {
  id: number
  parent_route: string
  status: number
  /** API：13 位毫秒；Mock 目录：本地时间字符串 */
  publish_date: number | string
}

export interface ContentRoute {
  path: string
  sitemap: boolean
  lastmod?: string
}

export interface ContentDirectorySnapshot {
  articles: ContentArticle[]
  source: 'mock' | 'content-directory'
  fetchedAt: number
}

export function getContentDirectorySnapshotPath(): string {
  return snapshotPath
}

/** 写入构建快照：预渲染与 sitemap 必须读同一份。 */
export function writeContentDirectorySnapshot(snapshot: ContentDirectorySnapshot): void {
  mkdirSync(dirname(snapshotPath), { recursive: true })
  writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
}

export function readContentDirectorySnapshot(): ContentDirectorySnapshot | null {
  if (!existsSync(snapshotPath))
    return null
  return JSON.parse(readFileSync(snapshotPath, 'utf8')) as ContentDirectorySnapshot
}

/**
 * 解析构建用文章列表：优先快照；真实模式无快照则失败；Mock 可回退到本地 catalog。
 */
export function resolveContentArticlesForBuild(): ContentArticle[] {
  const snapshot = readContentDirectorySnapshot()
  const expectedSource = process.env.NUXT_CONTENT_API_USE_REAL === 'true' ? 'content-directory' : 'mock'
  if (snapshot?.articles) {
    if (snapshot.source !== expectedSource)
      throw new Error(`Content-directory snapshot source mismatch: expected ${expectedSource}, got ${snapshot.source}. Run pnpm prepare:content.`)
    return snapshot.articles
  }
  if (expectedSource === 'content-directory')
    throw new Error('Missing content-directory snapshot. Run: pnpm exec tsx scripts/prepare-content-directory.ts')
  return MOCK_ARTICLES.map(a => ({
    id: a.id,
    parent_route: a.parent_route,
    status: a.status,
    publish_date: a.publish_date,
  }))
}

/** 预渲染与 sitemap 共用构建时的已发布内容快照；跳转和筛选页可预渲染但不进入 sitemap。 */
export function createContentDirectory(articles: readonly ContentArticle[] = resolveContentArticlesForBuild()): ContentRoute[] {
  const routes: ContentRoute[] = [
    { path: '/', sitemap: true },
    { path: '/statistics', sitemap: false },
    ...[1, 2, 3].map(id => ({ path: `/statistics/type/${id}`, sitemap: true })),
    { path: '/pick', sitemap: true },
    { path: '/news', sitemap: false },
    ...categories.flatMap(category => [
      { path: `/news/${category}`, sitemap: true },
      // 子分类页有独立筛选结果、canonical、hreflang 与 CollectionPage schema，应进入 sitemap。
      ...[1, 2, 3].map(id => ({ path: `/news/${category}/type/${id}`, sitemap: true })),
    ]),
  ]
  const ids = new Set<number>()
  for (const article of articles) {
    if (article.status !== 1)
      continue
    if (!Number.isSafeInteger(article.id) || article.id < 1 || ids.has(article.id))
      throw new Error('Invalid or duplicate published article ID')
    if (!categories.includes(article.parent_route))
      throw new Error(`Invalid category for article ${article.id}`)
    // Mock 字符串日期先校验日历日，避免 Date 溢出把 02-30 静默滚到 03-02
    if (typeof article.publish_date === 'string') {
      const ymd = article.publish_date.trim().slice(0, 10)
      const parsedYmd = new Date(`${ymd}T00:00:00Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd) || Number.isNaN(parsedYmd.valueOf()) || parsedYmd.toISOString().slice(0, 10) !== ymd)
        throw new Error(`Invalid publication date for article ${article.id}`)
    }
    const date = toSitemapLastmod(article.publish_date)
    const parsed = new Date(`${date}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date)
      throw new Error(`Invalid publication date for article ${article.id}`)
    ids.add(article.id)
    routes.push({ path: `/news/${article.parent_route}/article/${article.id}`, sitemap: true, lastmod: date })
  }
  // Historical redirect, excluded from canonical sitemap URLs.
  if (ids.has(101))
    routes.push({ path: '/news/detail/101', sitemap: false })
  return locales.flatMap(locale => routes.map(route => ({
    ...route,
    path: locale === 'zh-HK' ? route.path : `/${locale}${route.path === '/' ? '' : route.path}`,
  })))
}
