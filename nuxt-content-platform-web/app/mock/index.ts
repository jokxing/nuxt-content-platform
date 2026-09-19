/**
 * Mock 异步适配入口
 * - Nitro `server/api/*` 与本模块共用同一数据源，保证 SSR/浏览器一致
 * - 后续接真实后端时：页面改为调用 service，或在此按开关切换实现
 */

import { MOCK_ARTICLE_IDS } from './brand'
import { pagination, positiveInteger } from './parameters'
import { analysis, advancedStats, numberMiss } from './statistics'
import {
  MOCK_AI_PREDICTION,
  MOCK_API_INFO,
  MOCK_ARTICLES,
  MOCK_HISTORY,
  MOCK_LATEST,
  MOCK_LUCKY_NUMBER,
  MOCK_PROSE,
  pickLocalizedArticle,
} from './data/catalog'

export { BUSINESS_MAPPING, DEMO_BRAND, MOCK_ARTICLE_IDS, MOCK_CLOCK_ISO } from './brand'
export { MOCK_ARTICLES, MOCK_LATEST } from './data/catalog'

function delay<T>(value: T, ms = 0): Promise<T> {
  if (!ms)
    return Promise.resolve(value)
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}

export async function mockGetApiInfo() {
  return delay(MOCK_API_INFO)
}

export async function mockGetLatest() {
  return delay({ ...MOCK_LATEST })
}

export async function mockGetHistory(params: Record<string, any> = {}) {
  const { page, pageSize } = pagination(params, 20, 100)
  let rows = [...MOCK_HISTORY]

  if (params.year) {
    const year = String(params.year)
    rows = rows.filter(r => r.draw_date.startsWith(year))
  }
  if (params.draw_number) {
    rows = rows.filter(r => r.draw_number === String(params.draw_number))
  }
  if (params.number !== undefined) {
    const n = positiveInteger(params.number, 'number', 1, 49)
    rows = rows.filter(r =>
      [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6, r.special_number].includes(n),
    )
  }
  if (params.periods !== undefined) {
    rows = rows.slice(0, positiveInteger(params.periods, 'periods', 20))
  }

  const total = rows.length
  const start = (page - 1) * pageSize
  const data = rows.slice(start, start + pageSize)
  return delay({
    data,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
  })
}

export async function mockGetAnalysis(params: Record<string, any> = {}) {
  return delay(analysis(params))
}

export async function mockGetAdvancedStats(params: Record<string, any> = {}) {
  return delay(advancedStats(params))
}

export async function mockGetAiPrediction(locale?: string) {
  const english = locale === 'en' || locale === 'en-US'
  const reasons = ['Balanced sample across ranges', 'High and low frequency sample', 'Interval comparison sample', 'Adjacent and scattered sample', 'Fixed control sample']
  return delay({ recommendations: MOCK_AI_PREDICTION.recommendations.map((r, i) => ({
    ...r,
    reason: english ? `${reasons[i]} (demo data, not a prediction)` : r.reason,
  })) })
}

export async function mockGetLuckyNumber(locale?: string) {
  if (locale === 'en' || locale === 'en-US') {
    return delay({ ...MOCK_LUCKY_NUMBER, tags: ['Frequency sample', 'Balanced ranges', 'Adjacent sample'], reason: 'Fixed sample for portfolio demonstration only; not a prediction.' })
  }
  return delay({ ...MOCK_LUCKY_NUMBER, reason: '固定组合仅用于演示布局与交互，不代表真实统计推荐或预测。' })
}

export async function mockGetNumberMiss(params: Record<string, any> = {}) {
  return delay(numberMiss(params))
}

export async function mockGetArticles(params: Record<string, any> = {}, lang?: string) {
  const { page, pageSize } = pagination(params, 10, 50)
  let list = [...MOCK_ARTICLES]

  if (params.category) {
    const cat = String(params.category)
    list = list.filter(a =>
      a.category_slug === cat
      || a.parent_route === cat
      || (cat === 'lottery-teach' && a.parent_route === 'education')
      || (cat === 'ai-predict' && a.parent_route === 'analysis')
      || (cat === 'news-story' && a.parent_route === 'story'),
    )
  }

  const total = list.length
  const start = (page - 1) * pageSize
  const data = list
    .slice(start, start + pageSize)
    .map(a => pickLocalizedArticle(a, lang || params.lang))

  return delay({
    data,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.max(1, Math.ceil(total / pageSize) || 1),
  })
}

export async function mockGetArticleDetail(id: number | string, lang?: string) {
  const article = MOCK_ARTICLES.find(a => a.id === Number(id) || a.slug === String(id))
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: `Article ${id} not found in mock` })
  }
  return delay(pickLocalizedArticle(article, lang))
}

export async function mockGetArticleIds() {
  return delay({ ids: [...MOCK_ARTICLE_IDS] })
}

export async function mockGetProse() {
  return delay(MOCK_PROSE)
}

/** 供 Nitro 路由按路径分发 */
export async function mockHandleApi(path: string, query: Record<string, any> = {}) {
  const withoutQuery = path.split('?')[0] || path
  const clean = withoutQuery.replace(/^\/api\/?/, '').replace(/\/$/, '')
  const lang = query.lang as string | undefined

  if (!clean || clean === 'index')
    return mockGetApiInfo()
  if (clean === 'latest')
    return mockGetLatest()
  if (clean === 'history')
    return mockGetHistory(query)
  if (clean === 'analysis')
    return mockGetAnalysis(query)
  if (clean === 'advanced-stats' || clean === 'advanced_stats')
    return mockGetAdvancedStats(query)
  if (clean === 'ai-prediction' || clean === 'ai_prediction')
    return mockGetAiPrediction(lang)
  if (clean === 'lucky-number' || clean === 'lucky_number')
    return mockGetLuckyNumber(lang)
  if (clean === 'number-miss' || clean === 'number_miss')
    return mockGetNumberMiss(query)
  if (clean === 'article-ids' || clean === 'article_ids')
    return mockGetArticleIds()
  if (clean === 'prose')
    return mockGetProse()
  if (clean === 'articles')
    return mockGetArticles(query, lang)

  const articleMatch = clean.match(/^articles\/([^/]+)$/)
  if (articleMatch?.[1])
    return mockGetArticleDetail(articleMatch[1], lang)

  throw createError({ statusCode: 404, statusMessage: `Mock API path not found: ${withoutQuery}` })
}

function createError(opts: { statusCode: number, statusMessage: string }) {
  const err: any = new Error(opts.statusMessage)
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
}
