import { MOCK_ARTICLE_IDS, MOCK_CLOCK_ISO } from '../brand'

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
    category_slug: 'how-to-play',
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
    category_slug: 'this-predict',
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
    category_slug: 'lottery-news',
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

/** 固定期次结果（字段名兼容旧接口，语义已映射为数据集发布） */
export const MOCK_LATEST = {
  draw_number: '2026090',
  draw_date: '2026-09-16',
  special_number: 7,
  num1: 3,
  num2: 12,
  num3: 18,
  num4: 27,
  num5: 33,
  num6: 41,
  total_sales: 1280000,
  first_prize_count: '1',
  first_prize_amount: '850000',
  second_prize_count: '4',
  second_prize_amount: '42000',
  third_prize_count: '62',
  third_prize_amount: '3200',
  next_draw_number: '2026091',
  next_draw_date: '2026-09-20',
  next_jackpot: 2100000,
  _mock_clock: MOCK_CLOCK_ISO,
}

export const MOCK_HISTORY = [
  { draw_number: '2026090', draw_date: '2026-09-16', special_number: 7, num1: 3, num2: 12, num3: 18, num4: 27, num5: 33, num6: 41 },
  { draw_number: '2026089', draw_date: '2026-09-13', special_number: 15, num1: 5, num2: 9, num3: 21, num4: 28, num5: 36, num6: 44 },
  { draw_number: '2026088', draw_date: '2026-09-11', special_number: 2, num1: 1, num2: 14, num3: 22, num4: 30, num5: 38, num6: 49 },
  { draw_number: '2026087', draw_date: '2026-09-09', special_number: 29, num1: 6, num2: 11, num3: 19, num4: 25, num5: 34, num6: 47 },
  { draw_number: '2026086', draw_date: '2026-09-06', special_number: 40, num1: 8, num2: 16, num3: 23, num4: 31, num5: 37, num6: 45 },
  { draw_number: '2026085', draw_date: '2026-09-04', special_number: 19, num1: 4, num2: 10, num3: 17, num4: 26, num5: 35, num6: 42 },
  { draw_number: '2026084', draw_date: '2026-09-02', special_number: 33, num1: 2, num2: 13, num3: 20, num4: 24, num5: 39, num6: 48 },
  { draw_number: '2026083', draw_date: '2026-08-30', special_number: 11, num1: 7, num2: 15, num3: 18, num4: 32, num5: 41, num6: 46 },
  ...Array.from({ length: 112 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 7, 27 - i * 3)).toISOString().slice(0, 10)
    const values = Array.from({ length: 7 }, (_, j) => ((i * 13 + Math.floor(i / 7) * 3 + j * 8) % 49) + 1)
    return { draw_number: String(2026082 - i), draw_date: date, num1: values[0]!, num2: values[1]!, num3: values[2]!, num4: values[3]!, num5: values[4]!, num6: values[5]!, special_number: values[6]! }
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
    ai_prediction: '/ai-prediction - 智能推荐组合',
    articles: '/articles - 文章内容',
    lucky_number: '/lucky-number - 推荐组合',
    number_miss: '/number-miss - 间隔指标',
    recent_articles: '/articles - 最近文章',
  },
}

export const MOCK_PROSE = {
  content: 'ContentPulse demo prose — placeholder for layout testing.',
}
