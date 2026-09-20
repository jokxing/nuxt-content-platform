import { invalidArgument } from './errors.js'

const PARENT_ROUTES = new Set(['education', 'analysis', 'story'])

const PARENT_ALIASES: Record<string, string> = {
  'lottery-teach': 'education',
  'ai-predict': 'analysis',
  'news-story': 'story',
}

const CHILD_SLUGS = new Set([
  'how-to-play',
  'skills',
  'play-desc',
  'this-predict',
  'last-review',
  'tema-rule',
  'lottery-news',
  'win-story',
  'activity-news',
])

export type CategoryFilter =
  | { kind: 'all' }
  | { kind: 'parent', parentRoute: string }
  | { kind: 'slug', slug: string }

/** Parent route, child slug, or legacy parent alias. Unknown values are 400. */
export function parseCategoryFilter(raw: string | undefined): CategoryFilter {
  if (raw === undefined) {
    return { kind: 'all' }
  }
  if (PARENT_ROUTES.has(raw)) {
    return { kind: 'parent', parentRoute: raw }
  }
  const alias = PARENT_ALIASES[raw]
  if (alias) {
    return { kind: 'parent', parentRoute: alias }
  }
  if (CHILD_SLUGS.has(raw)) {
    return { kind: 'slug', slug: raw }
  }
  throw invalidArgument('参数不合法')
}
