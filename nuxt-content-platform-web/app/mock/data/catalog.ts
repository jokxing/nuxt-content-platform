import { MOCK_ARTICLE_IDS } from '../brand'

/** 固定演示文章：分类 slug 与路由 education/analysis/story 子类保持兼容 */
export interface MockArticle {
  id: number
  title: string
  title_sc: string
  title_en: string
  slug: string
  content: string
  content_sc: string
  content_en: string
  publish_date: string
  author: string
  cover_image: string
  status: number
  category: string
  category_slug: string
  parent_route: 'education' | 'analysis' | 'story'
}

export const MOCK_ARTICLES: MockArticle[] = [
  {
    id: MOCK_ARTICLE_IDS[0],
    title: '如何閱讀數據面板',
    title_sc: '如何阅读数据面板',
    title_en: 'How to read the data dashboard',
    slug: 'how-to-read-dashboard',
    content: '<p>本篇介紹訊覽演示站的數據面板結構、篩選與圖例含義，僅供作品展示。</p>',
    content_sc: '<p>本篇介绍讯览演示站的数据面板结构、筛选与图例含义，仅供作品展示。</p>',
    content_en: '<p>This demo article explains the dashboard layout, filters, and legends. For portfolio use only.</p>',
    publish_date: '2026-09-10 10:00:00',
    author: 'ContentPulse Editor',
    cover_image: '/logo.svg',
    status: 1,
    category: '新手指南',
    category_slug: 'getting-started',
    parent_route: 'education',
  },
  {
    id: MOCK_ARTICLE_IDS[1],
    title: '篩選與對比技巧',
    title_sc: '筛选与对比技巧',
    title_en: 'Filtering and comparison tips',
    slug: 'filter-compare-tips',
    content: '<p>說明如何用期次範圍與指標對比閱讀歷史趨勢，數據為固定 Mock。</p>',
    content_sc: '<p>说明如何用期次范围与指标对比阅读历史趋势，数据为固定 Mock。</p>',
    content_en: '<p>Tips for comparing period ranges and metrics. Data is fixed mock content.</p>',
    publish_date: '2026-09-11 11:00:00',
    author: 'ContentPulse Editor',
    cover_image: '/logo.svg',
    status: 1,
    category: '進階技巧',
    category_slug: 'skills',
    parent_route: 'education',
  },
  {
    id: MOCK_ARTICLE_IDS[2],
    title: '上期數據回顧',
    title_sc: '上期数据回顾',
    title_en: 'Previous period review',
    slug: 'last-period-review',
    content: '<p>示範分析頁的回顧文案結構；數值與統計頁 Mock 保持一致。</p>',
    content_sc: '<p>示范分析页的回顾文案结构；数值与统计页 Mock 保持一致。</p>',
    content_en: '<p>Sample review article aligned with statistics mock numbers.</p>',
    publish_date: '2026-09-12 12:00:00',
    author: 'Insights Desk',
    cover_image: '/logo.svg',
    status: 1,
    category: '數據回顧',
    category_slug: 'last-review',
    parent_route: 'analysis',
  },
  {
    id: MOCK_ARTICLE_IDS[3],
    title: '本期指標觀察',
    title_sc: '本期指标观察',
    title_en: 'Current period observations',
    slug: 'current-period-notes',
    content: '<p>示範「分析」分類下的觀察筆記，不含真實業務預測。</p>',
    content_sc: '<p>示范「分析」分类下的观察笔记，不含真实业务预测。</p>',
    content_en: '<p>Sample insight notes under the analysis category. Not real forecasts.</p>',
    publish_date: '2026-09-13 13:00:00',
    author: 'Insights Desk',
    cover_image: '/logo.svg',
    status: 1,
    category: '指標觀察',
    category_slug: 'current-insights',
    parent_route: 'analysis',
  },
  {
    id: MOCK_ARTICLE_IDS[4],
    title: '平台更新動態',
    title_sc: '平台更新动态',
    title_en: 'Platform update notes',
    slug: 'platform-update-notes',
    content: '<p>訊覽演示站的版本與內容更新說明，用於動態分類展示。</p>',
    content_sc: '<p>讯览演示站的版本与内容更新说明，用于动态分类展示。</p>',
    content_en: '<p>Release notes for the ContentPulse demo, used in the updates category.</p>',
    publish_date: '2026-09-14 14:00:00',
    author: 'News Desk',
    cover_image: '/logo.svg',
    status: 1,
    category: '平台動態',
    category_slug: 'platform-updates',
    parent_route: 'story',
  },
]

export function pickLocalizedArticle(article: MockArticle, lang?: string) {
  const isSc = lang === 'sc' || lang === 'zh-CN'
  const isEn = lang === 'en' || lang === 'en-US'
  return {
    id: article.id,
    title: isEn ? article.title_en : isSc ? article.title_sc : article.title,
    slug: article.slug,
    content: isEn ? article.content_en : isSc ? article.content_sc : article.content,
    publish_date: article.publish_date,
    author: article.author,
    cover_image: article.cover_image,
    status: article.status,
    category: article.category,
    category_slug: article.category_slug,
    parent_route: article.parent_route,
  }
}

function datasetRow(periodCode: string, date: string, values: number[], extraValue: number) {
  return {
    period_code: periodCode,
    released_at: Date.parse(`${date}T00:00:00+08:00`),
    values,
    extra_value: extraValue,
  }
}

/** 固定期次结果，与公开后端契约保持一致。 */
export const MOCK_LATEST = {
  ...datasetRow('2026090', '2026-09-16', [3, 12, 18, 27, 33, 41], 7),
  next_release: {
    period_code: '2026091',
    scheduled_at: Date.parse('2026-09-20T00:00:00+08:00'),
  },
}

export const MOCK_HISTORY = [
  datasetRow('2026090', '2026-09-16', [3, 12, 18, 27, 33, 41], 7),
  datasetRow('2026089', '2026-09-13', [5, 9, 21, 28, 36, 44], 15),
  datasetRow('2026088', '2026-09-11', [1, 14, 22, 30, 38, 49], 2),
  datasetRow('2026087', '2026-09-09', [6, 11, 19, 25, 34, 47], 29),
  datasetRow('2026086', '2026-09-06', [8, 16, 23, 31, 37, 45], 40),
  datasetRow('2026085', '2026-09-04', [4, 10, 17, 26, 35, 42], 19),
  datasetRow('2026084', '2026-09-02', [2, 13, 20, 24, 39, 48], 33),
  datasetRow('2026083', '2026-08-30', [7, 15, 18, 32, 41, 46], 11),
  ...Array.from({ length: 112 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 7, 27 - i * 3)).toISOString().slice(0, 10)
    const values = Array.from({ length: 7 }, (_, j) => ((i * 13 + Math.floor(i / 7) * 3 + j * 8) % 49) + 1)
    return datasetRow(String(2026082 - i), date, values.slice(0, 6), values[6]!)
  }),

]

export const MOCK_AI_PREDICTION = {
  recommendations: [
    { numbers: [3, 12, 18, 27, 33, 41], reason: '近期频次与区间均衡（Mock 演示）', tags: ['demo'] },
    { numbers: [5, 9, 21, 28, 36, 44], reason: '高低频搭配示例（Mock 演示）', tags: ['demo'] },
    { numbers: [1, 14, 22, 30, 38, 49], reason: '间隔补位示例（Mock 演示）', tags: ['demo'] },
    { numbers: [6, 11, 19, 25, 34, 47], reason: '相邻与分散组合示例（Mock 演示）', tags: ['demo'] },
    { numbers: [2, 13, 20, 24, 39, 48], reason: '随机对照组合（Mock 演示）', tags: ['demo'] },
  ],
}

export const MOCK_LUCKY_NUMBER = {
  numbers: [11, 21, 29, 32, 35, 49],
  tags: ['高频项', '区间均衡', '连号补位'],
  reason: '演示推荐：基于固定 Mock 频次分布生成，仅供作品展示，非真实预测。',
}

export const MOCK_API_INFO = {
  message: 'ContentPulse Mock API v0.1',
  version: '0.1.0-mock',
  endpoints: {
    latest: '/latest - 最新期次数据',
    history: '/history - 历史记录',
    analysis: '/analysis - 频次分布',
    advanced_stats: '/advanced-stats - 进阶统计',
    demo_combinations: '/demo-combinations - 固定演示组合',
    articles: '/articles - 文章内容',
    number_miss: '/number-miss - 间隔指标',
    recent_articles: '/articles - 最近文章',
  },
}

export const MOCK_PROSE = {
  content: 'ContentPulse demo prose — placeholder for layout testing.',
}
