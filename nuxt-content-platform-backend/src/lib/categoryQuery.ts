import {
  CATEGORY_SLUG_SET,
  PARENT_ALIASES,
  PARENT_ROUTE_SET,
} from './domainConstants.js'
import { invalidArgument } from './errors.js'

export type CategoryFilter =
  | { kind: 'all' }
  | { kind: 'parent', parentRoute: string }
  | { kind: 'slug', slug: string }

/** Parent route, child slug, or legacy parent alias. Unknown values are 400. */
export function parseCategoryFilter(raw: string | undefined): CategoryFilter {
  if (raw === undefined) {
    return { kind: 'all' }
  }
  if (PARENT_ROUTE_SET.has(raw)) {
    return { kind: 'parent', parentRoute: raw }
  }
  const alias = PARENT_ALIASES[raw as keyof typeof PARENT_ALIASES]
  if (alias) {
    return { kind: 'parent', parentRoute: alias }
  }
  if (CATEGORY_SLUG_SET.has(raw)) {
    return { kind: 'slug', slug: raw }
  }
  throw invalidArgument('参数不合法')
}
