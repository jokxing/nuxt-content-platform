/**
 * 资讯分类 slug 映射（路由 education/analysis/story 保持兼容）
 * API category 字段名暂不改，语义见 mock/brand BUSINESS_MAPPING
 */
export const NEWS_CATEGORIES = {
  PARENT_CATEGORIES: {
    education: 'lottery-teach', // 指南（原教学）
    analysis: 'ai-predict', // 分析
    story: 'news-story', // 动态
  },

  SUB_CATEGORIES: {
    'education-1': 'how-to-play', // 新手指南
    'education-2': 'skills', // 进阶技巧
    'education-3': 'play-desc', // 功能说明

    'analysis-1': 'last-review', // 上期回顾
    'analysis-2': 'this-predict', // 本期观察
    'analysis-3': 'tema-rule', // 指标规律

    'story-1': 'lottery-news', // 平台动态
    'story-2': 'win-story', // 案例分享
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
