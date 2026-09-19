// 星期常量
export const WEEK_DAYS = {
  MON: 'MON',
  TUE: 'TUE',
  WED: 'WED',
  THU: 'THU',
  FRI: 'FRI',
  SAT: 'SAT',
  SUN: 'SUN',
} as const

// 波色类型
export const WAVE_TYPES = {
  RED: 'RED',
  BLUE: 'BLUE',
  GREEN: 'GREEN',
} as const

// 号码类型
export const NUMBER_TYPES = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
  COMPOSITE: 'COMPOSITE',
} as const

/**
 * 从HTML内容中提取第一张图片
 * @param content HTML内容
 * @returns 图片URL或null
 */
export function extractFirstImageFromContent(content: string): string | null {
  if (!content)
    return null

  // 匹配img标签的正则表达式
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i
  const match = content.match(imgRegex)

  if (match && match[1]) {
    return match[1]
  }

  return null
}

/**
 * 获取文章封面图片
 * @param article 文章对象
 * @param defaultImage 默认图片路径
 * @param useDefault 是否使用默认图片，如果为false且没有图片则返回null
 * @returns 图片URL或null
 */
export function getArticleCoverImage(article: any, defaultImage: string = '/logo.svg', useDefault: boolean = true): string | null {
  // 优先使用API返回的cover_image
  if (article.cover_image) {
    return article.cover_image
  }

  // 如果没有cover_image，从content中提取第一张图片
  if (article.content) {
    const firstImage = extractFirstImageFromContent(article.content)
    if (firstImage) {
      return firstImage
    }
  }

  // 如果都没有，根据useDefault参数决定是否返回默认图片
  return useDefault ? defaultImage : null
}
