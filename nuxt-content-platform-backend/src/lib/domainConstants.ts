/**
 * 资讯领域常量：locale / parent_route / 九个子类 slug。
 * seed、query、service 共用，避免多处硬编码漂移。不依赖前端文件。
 */

export const LOCALES = ['zh-HK', 'zh-CN', 'en-US'] as const
export type Locale = (typeof LOCALES)[number]

/** 契约接受的 lang 别名 → 规范 Locale */
export const LANG_ALIASES = {
  'zh-HK': 'zh-HK',
  'zh-CN': 'zh-CN',
  'en-US': 'en-US',
  tc: 'zh-HK',
  sc: 'zh-CN',
  en: 'en-US',
} as const satisfies Record<string, Locale>

export const PARENT_ROUTES = ['education', 'analysis', 'story'] as const
export type ParentRoute = (typeof PARENT_ROUTES)[number]

/** 父类固定展示顺序（分类列表排序） */
export const PARENT_ORDER: Record<ParentRoute, number> = {
  education: 0,
  analysis: 1,
  story: 2,
}

export const CATEGORY_SLUGS = [
  'getting-started',
  'skills',
  'feature-notes',
  'current-insights',
  'last-review',
  'metric-rules',
  'platform-updates',
  'user-stories',
  'activity-news',
] as const
export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export const EXPECTED_CATEGORY_COUNT = CATEGORY_SLUGS.length

/** 分类固定归属及顺序；用于校验数据库没有“数量正确但内容错误”。 */
export const CATEGORY_DEFINITIONS = {
  'getting-started': { parentRoute: 'education', sortOrder: 1 },
  'skills': { parentRoute: 'education', sortOrder: 2 },
  'feature-notes': { parentRoute: 'education', sortOrder: 3 },
  'current-insights': { parentRoute: 'analysis', sortOrder: 1 },
  'last-review': { parentRoute: 'analysis', sortOrder: 2 },
  'metric-rules': { parentRoute: 'analysis', sortOrder: 3 },
  'platform-updates': { parentRoute: 'story', sortOrder: 1 },
  'user-stories': { parentRoute: 'story', sortOrder: 2 },
  'activity-news': { parentRoute: 'story', sortOrder: 3 },
} as const satisfies Record<CategorySlug, { parentRoute: ParentRoute, sortOrder: number }>

export const PARENT_ROUTE_SET: ReadonlySet<string> = new Set(PARENT_ROUTES)
export const CATEGORY_SLUG_SET: ReadonlySet<string> = new Set(CATEGORY_SLUGS)

export function isParentRoute(value: string): value is ParentRoute {
  return PARENT_ROUTE_SET.has(value)
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUG_SET.has(value)
}
