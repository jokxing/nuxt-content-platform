/**
 * 页面路由与公开内容分类 slug 的唯一映射。
 */
export const NEWS_CATEGORIES = {
  PARENT_CATEGORIES: {
    education: 'education',
    analysis: 'analysis',
    story: 'story',
  },

  SUB_CATEGORIES: {
    'education-1': 'getting-started', // 新手指南
    'education-2': 'skills', // 进阶技巧
    'education-3': 'feature-notes', // 功能说明

    'analysis-1': 'last-review', // 上期回顾
    'analysis-2': 'current-insights', // 本期观察
    'analysis-3': 'metric-rules', // 指标规律

    'story-1': 'platform-updates', // 平台动态
    'story-2': 'user-stories', // 案例分享
    'story-3': 'activity-news', // 活动快讯
  },

  getCategory: (parentCategory: string, subCategoryId: number): string => {
    const key = `${parentCategory}-${subCategoryId}` as keyof typeof NEWS_CATEGORIES.SUB_CATEGORIES
    return NEWS_CATEGORIES.SUB_CATEGORIES[key] || ''
  },

  getParentCategory: (parentCategory: string): string => {
    return NEWS_CATEGORIES.PARENT_CATEGORIES[parentCategory as keyof typeof NEWS_CATEGORIES.PARENT_CATEGORIES] || ''
  },
}
