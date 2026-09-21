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

function ok<T>(data: T) {
  return { code: 0 as const, msg: 'ok' as const, data }
}

function hongKongYear(ms: number) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Hong_Kong', year: 'numeric' }).format(ms))
}

export async function mockGetApiInfo() {
  return delay(MOCK_API_INFO)
}

export async function mockGetLatest() {
  return delay(ok({ ...MOCK_LATEST }))
}

export async function mockGetHistory(params: Record<string, any> = {}) {
  const { page, pageSize } = pagination(params, 20, 100)
  let rows = [...MOCK_HISTORY]

  if (params.year) {
    const year = Number(params.year)
    rows = rows.filter(r => hongKongYear(r.released_at) === year)
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
    rows = rows.slice(0, positiveInteger(params.periods, 'periods', 20, 120))
  }

  const total = rows.length
  const start = (page - 1) * pageSize
  const items = rows.slice(start, start + pageSize)
  return delay(ok({
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
    filter_options: {
      years: [...new Set(MOCK_HISTORY.map(row => hongKongYear(row.released_at)))].sort((a, b) => b - a),
      period_codes: MOCK_HISTORY.slice(0, 120).map(row => row.period_code),
    },
  }))
}

export async function mockGetAnalysis(params: Record<string, any> = {}) {
  return delay(ok(analysis(params)))
}

export async function mockGetAdvancedStats(params: Record<string, any> = {}) {
  return delay(ok(advancedStats(params)))
}

const DEMO_COPY = {
  'zh-HK': {
    featuredTags: ['\u983B\u6B21\u6A23\u4F8B', '\u5340\u9593\u5747\u8861', '\u76F8\u9130\u6A23\u4F8B'],
    featuredReason: '\u56FA\u5B9A\u6A23\u4F8B\uFF0C\u50C5\u4F9B\u4F5C\u54C1\u5C55\u793A\uFF0C\u4E0D\u662F\u9810\u6E2C\u3002',
    itemReasons: [
      '\u5340\u9593\u5206\u4F48\u8F03\u5747\u8861\u7684\u56FA\u5B9A\u6A23\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9810\u6E2C\uFF09',
      '\u9AD8\u4F4E\u983B\u642D\u914D\u7684\u56FA\u5B9A\u6A23\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9810\u6E2C\uFF09',
      '\u9593\u9694\u5C0D\u7167\u7684\u56FA\u5B9A\u6A23\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9810\u6E2C\uFF09',
      '\u76F8\u9130\u8207\u5206\u6563\u7D44\u5408\u7684\u56FA\u5B9A\u6A23\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9810\u6E2C\uFF09',
      '\u5C0D\u7167\u7528\u56FA\u5B9A\u6A23\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9810\u6E2C\uFF09',
    ],
    tag: '\u6F14\u793A',
  },
  'zh-CN': {
    featuredTags: ['\u9891\u6B21\u6837\u4F8B', '\u533A\u95F4\u5747\u8861', '\u76F8\u90BB\u6837\u4F8B'],
    featuredReason: '\u56FA\u5B9A\u6837\u4F8B\uFF0C\u4EC5\u4F9B\u4F5C\u54C1\u5C55\u793A\uFF0C\u4E0D\u662F\u9884\u6D4B\u3002',
    itemReasons: [
      '\u533A\u95F4\u5206\u5E03\u8F83\u5747\u8861\u7684\u56FA\u5B9A\u6837\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9884\u6D4B\uFF09',
      '\u9AD8\u4F4E\u9891\u642D\u914D\u7684\u56FA\u5B9A\u6837\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9884\u6D4B\uFF09',
      '\u95F4\u9694\u5BF9\u7167\u7684\u56FA\u5B9A\u6837\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9884\u6D4B\uFF09',
      '\u76F8\u90BB\u4E0E\u5206\u6563\u7EC4\u5408\u7684\u56FA\u5B9A\u6837\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9884\u6D4B\uFF09',
      '\u5BF9\u7167\u7528\u56FA\u5B9A\u6837\u4F8B\uFF08\u6F14\u793A\uFF0C\u4E0D\u662F\u9884\u6D4B\uFF09',
    ],
    tag: '\u6F14\u793A',
  },
  'en-US': {
    featuredTags: ['Frequency sample', 'Balanced ranges', 'Adjacent sample'],
    featuredReason: 'Fixed sample for portfolio demonstration only; not a prediction.',
    itemReasons: [
      'Balanced sample across ranges (demo data, not a prediction)',
      'High and low frequency sample (demo data, not a prediction)',
      'Interval comparison sample (demo data, not a prediction)',
      'Adjacent and scattered sample (demo data, not a prediction)',
      'Fixed control sample (demo data, not a prediction)',
    ],
    tag: 'demo',
  },
} as const

export async function mockGetDemoCombinations(locale?: string) {
  const copy = locale === 'en' || locale === 'en-US'
    ? DEMO_COPY['en-US']
    : locale === 'sc' || locale === 'zh-CN'
      ? DEMO_COPY['zh-CN']
      : DEMO_COPY['zh-HK']
  return delay(ok({
    source: 'fixed_demo' as const,
    is_generated: false as const,
    generated_at: Date.parse('2026-09-17T12:00:00+08:00'),
    featured: {
      numbers: MOCK_LUCKY_NUMBER.numbers,
      tags: [...copy.featuredTags],
      reason: copy.featuredReason,
    },
    items: MOCK_AI_PREDICTION.recommendations.map((item, index) => ({
      numbers: item.numbers,
      tags: [copy.tag],
      reason: copy.itemReasons[index] || item.reason,
    })),
  }))
}

export async function mockGetNumberMiss(params: Record<string, any> = {}) {
  return delay(ok(numberMiss(params)))
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

  // ?????????????????? API ??????
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
