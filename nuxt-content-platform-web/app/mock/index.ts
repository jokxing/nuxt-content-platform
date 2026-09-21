/**
 * 本地 Mock 数据入口。
 * Nitro 代理和浏览器请求共用同一分发函数，保证 SSR 与客户端行为一致。
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
    const year = Number(params.year)
    rows = rows.filter(r => new Date(r.released_at).getFullYear() === year)
  }
  if (params.period_code) {
    rows = rows.filter(r => r.period_code === String(params.period_code))
  }
  if (params.number !== undefined) {
    const n = positiveInteger(params.number, 'number', 1, 49)
    rows = rows.filter(r =>
      [...r.values, r.extra_value].includes(n),
    )
  }
  if (params.periods !== undefined) {
    rows = rows.slice(0, positiveInteger(params.periods, 'periods', 20))
  }

  const total = rows.length
  const start = (page - 1) * pageSize
  const items = rows.slice(start, start + pageSize)
  return delay({
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
    filter_options: {
      years: [...new Set(MOCK_HISTORY.map(row => new Date(row.released_at).getFullYear()))].sort((a, b) => b - a),
      period_codes: MOCK_HISTORY.slice(0, 120).map(row => row.period_code),
    },
  })
}

export async function mockGetAnalysis(params: Record<string, any> = {}) {
  return delay(analysis(params))
}

export async function mockGetAdvancedStats(params: Record<string, any> = {}) {
  return delay(advancedStats(params))
}

export async function mockGetDemoCombinations(locale?: string) {
  const english = locale === 'en' || locale === 'en-US'
  const simplified = locale === 'sc' || locale === 'zh-CN'
  const reasons = ['Balanced sample across ranges', 'High and low frequency sample', 'Interval comparison sample', 'Adjacent and scattered sample', 'Fixed control sample']
  const featured = english
    ? { ...MOCK_LUCKY_NUMBER, tags: ['Frequency sample', 'Balanced ranges', 'Adjacent sample'], reason: 'Fixed sample for portfolio demonstration only; not a prediction.' }
    : { ...MOCK_LUCKY_NUMBER, reason: simplified ? '固定样例，仅供作品展示，不是预测。' : '固定樣例，僅供作品展示，不是預測。' }
  return delay({
    source: 'fixed_demo',
    is_generated: false,
    generated_at: Date.parse('2026-09-17T12:00:00+08:00'),
    featured,
    items: MOCK_AI_PREDICTION.recommendations.map((item, index) => ({
      ...item,
      reason: english ? `${reasons[index]} (demo data, not a prediction)` : item.reason,
    })),
  })
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
      || a.parent_route === cat,
    )
  }

  const total = list.length
  const start = (page - 1) * pageSize
  const data = list
    .slice(start, start + pageSize)
    .map(a => pickLocalizedArticle(a, lang || params.lang))

  // 资讯接口保持统一成功外壳，页面只通过 API 客户端解包。
  return delay({
    code: 0,
    msg: 'ok',
    data: {
      items: data,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.max(1, Math.ceil(total / pageSize) || 1),
    },
  })
}

export async function mockGetArticleDetail(id: number | string, lang?: string) {
  const article = MOCK_ARTICLES.find(a => a.id === Number(id) || a.slug === String(id))
  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: `Article ${id} not found in mock`,
      data: { code: 40401, msg: 'Article not found', data: null, requestId: 'mock' },
    })
  }
  return delay({
    code: 0,
    msg: 'ok',
    data: pickLocalizedArticle(article, lang),
  })
}

export async function mockGetArticleIds() {
  return delay({ ids: [...MOCK_ARTICLE_IDS] })
}

export async function mockGetProse() {
  return delay(MOCK_PROSE)
}

/** Nitro 与客户端共用的 Mock 路由分发。 */
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
  if (clean === 'demo-combinations' || clean === 'demo_combinations')
    return mockGetDemoCombinations(lang)
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

function createError(opts: { statusCode: number, statusMessage: string, data?: unknown }) {
  const err: any = new Error(opts.statusMessage)
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  if (opts.data !== undefined)
    err.data = opts.data
  return err
}
