import { MOCK_ARTICLES } from '../app/mock/data/catalog'

export const locales = ['zh-HK', 'zh-CN', 'en-US'] as const
const categories: readonly string[] = ['education', 'analysis', 'story']
export interface ContentArticle {
  id: number
  parent_route: string
  status: number
  publish_date: string
}
export interface ContentRoute {
  path: string
  sitemap: boolean
  lastmod?: string
}

/** 预渲染与 sitemap 共用构建时的已发布内容快照；跳转和筛选页可预渲染但不进入 sitemap。 */
export function createContentDirectory(articles: readonly ContentArticle[] = MOCK_ARTICLES): ContentRoute[] {
  const routes: ContentRoute[] = [
    { path: '/', sitemap: true },
    { path: '/statistics', sitemap: false },
    ...[1, 2, 3].map(id => ({ path: `/statistics/type/${id}`, sitemap: true })),
    { path: '/pick', sitemap: true },
    { path: '/news', sitemap: false },
    ...categories.flatMap(category => [
      { path: `/news/${category}`, sitemap: true },
      ...[1, 2, 3].map(id => ({ path: `/news/${category}/type/${id}`, sitemap: false })),
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
    const date = article.publish_date.slice(0, 10)
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
