/** Desensitized seed payloads from frontend mock catalog (IDs 101–105 preserved). */

export type Locale = 'zh-HK' | 'zh-CN' | 'en-US'
export type ParentRoute = 'education' | 'analysis' | 'story'

export type CategorySeed = {
  slug: string
  parentRoute: ParentRoute
  sortOrder: number
  names: Record<Locale, string>
}

export type ArticleSeed = {
  id: number
  slug: string
  categorySlug: string
  author: string
  coverImage: string
  /** Asia/Shanghai wall time `YYYY-MM-DD HH:mm:ss` (converted to UTC on insert). */
  publishedAtShanghai: string
  titles: Record<Locale, string>
  contents: Record<Locale, string>
}

export const CATEGORY_SEEDS: CategorySeed[] = [
  {
    slug: 'how-to-play',
    parentRoute: 'education',
    sortOrder: 1,
    names: { 'zh-HK': '新手指南', 'zh-CN': '新手指南', 'en-US': 'Beginner Guide' },
  },
  {
    slug: 'skills',
    parentRoute: 'education',
    sortOrder: 2,
    names: { 'zh-HK': '進階技巧', 'zh-CN': '进阶技巧', 'en-US': 'Advanced Tips' },
  },
  {
    slug: 'play-desc',
    parentRoute: 'education',
    sortOrder: 3,
    names: { 'zh-HK': '功能說明', 'zh-CN': '功能说明', 'en-US': 'Feature Notes' },
  },
  {
    slug: 'this-predict',
    parentRoute: 'analysis',
    sortOrder: 1,
    names: { 'zh-HK': '本期分析', 'zh-CN': '本期分析', 'en-US': 'Current Analysis' },
  },
  {
    slug: 'last-review',
    parentRoute: 'analysis',
    sortOrder: 2,
    names: { 'zh-HK': '往期回顧', 'zh-CN': '往期回顾', 'en-US': 'Past Review' },
  },
  {
    slug: 'tema-rule',
    parentRoute: 'analysis',
    sortOrder: 3,
    names: { 'zh-HK': '指標規則', 'zh-CN': '指标规则', 'en-US': 'Metric Rules' },
  },
  {
    slug: 'lottery-news',
    parentRoute: 'story',
    sortOrder: 1,
    names: { 'zh-HK': '平台動態', 'zh-CN': '平台动态', 'en-US': 'Platform Updates' },
  },
  {
    slug: 'win-story',
    parentRoute: 'story',
    sortOrder: 2,
    names: { 'zh-HK': '用戶故事', 'zh-CN': '用户故事', 'en-US': 'User Stories' },
  },
  {
    slug: 'activity-news',
    parentRoute: 'story',
    sortOrder: 3,
    names: { 'zh-HK': '活動資訊', 'zh-CN': '活动资讯', 'en-US': 'Event News' },
  },
]

export const ARTICLE_SEEDS: ArticleSeed[] = [
  {
    id: 101,
    slug: 'how-to-read-dashboard',
    categorySlug: 'how-to-play',
    author: 'ContentPulse Editor',
    coverImage: '/logo.svg',
    publishedAtShanghai: '2026-09-10 10:00:00',
    titles: {
      'zh-HK': '如何閱讀數據面板',
      'zh-CN': '如何阅读数据面板',
      'en-US': 'How to read the data dashboard',
    },
    contents: {
      'zh-HK': '<p>本篇介紹訊覽演示站的數據面板結構、篩選與圖例含義，僅供作品展示。</p>',
      'zh-CN': '<p>本篇介绍讯览演示站的数据面板结构、筛选与图例含义，仅供作品展示。</p>',
      'en-US': '<p>This demo article explains the dashboard layout, filters, and legends. For portfolio use only.</p>',
    },
  },
  {
    id: 102,
    slug: 'filter-compare-tips',
    categorySlug: 'skills',
    author: 'ContentPulse Editor',
    coverImage: '/logo.svg',
    publishedAtShanghai: '2026-09-11 11:00:00',
    titles: {
      'zh-HK': '篩選與對比技巧',
      'zh-CN': '筛选与对比技巧',
      'en-US': 'Filtering and comparison tips',
    },
    contents: {
      'zh-HK': '<p>說明如何用期次範圍與指標對比閱讀歷史趨勢，數據為固定 Mock。</p>',
      'zh-CN': '<p>说明如何用期次范围与指标对比阅读历史趋势，数据为固定 Mock。</p>',
      'en-US': '<p>Tips for comparing period ranges and metrics. Data is fixed mock content.</p>',
    },
  },
  {
    id: 103,
    slug: 'last-period-review',
    categorySlug: 'last-review',
    author: 'Insights Desk',
    coverImage: '/logo.svg',
    publishedAtShanghai: '2026-09-12 12:00:00',
    titles: {
      'zh-HK': '上期數據回顧',
      'zh-CN': '上期数据回顾',
      'en-US': 'Previous period review',
    },
    contents: {
      'zh-HK': '<p>示範分析頁的回顧文案結構；數值與統計頁 Mock 保持一致。</p>',
      'zh-CN': '<p>示范分析页的回顾文案结构；数值与统计页 Mock 保持一致。</p>',
      'en-US': '<p>Sample review article aligned with statistics mock numbers.</p>',
    },
  },
  {
    id: 104,
    slug: 'current-period-notes',
    categorySlug: 'this-predict',
    author: 'Insights Desk',
    coverImage: '/logo.svg',
    publishedAtShanghai: '2026-09-13 13:00:00',
    titles: {
      'zh-HK': '本期指標觀察',
      'zh-CN': '本期指标观察',
      'en-US': 'Current period observations',
    },
    contents: {
      'zh-HK': '<p>示範「分析」分類下的觀察筆記，不含真實業務預測。</p>',
      'zh-CN': '<p>示范「分析」分类下的观察笔记，不含真实业务预测。</p>',
      'en-US': '<p>Sample insight notes under the analysis category. Not real forecasts.</p>',
    },
  },
  {
    id: 105,
    slug: 'platform-update-notes',
    categorySlug: 'lottery-news',
    author: 'News Desk',
    coverImage: '/logo.svg',
    publishedAtShanghai: '2026-09-14 14:00:00',
    titles: {
      'zh-HK': '平台更新動態',
      'zh-CN': '平台更新动态',
      'en-US': 'Platform update notes',
    },
    contents: {
      'zh-HK': '<p>訊覽演示站的版本與內容更新說明，用於動態分類展示。</p>',
      'zh-CN': '<p>讯览演示站的版本与内容更新说明，用于动态分类展示。</p>',
      'en-US': '<p>Release notes for the ContentPulse demo, used in the updates category.</p>',
    },
  },
]

/** Interpret a Shanghai wall-clock string as UTC Instant. */
export function shanghaiLocalToUtc(local: string): Date {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/.exec(local.trim())
  if (!match) {
    throw new Error(`Invalid Shanghai local datetime: ${local}`)
  }
  return new Date(`${match[1]}T${match[2]}+08:00`)
}
