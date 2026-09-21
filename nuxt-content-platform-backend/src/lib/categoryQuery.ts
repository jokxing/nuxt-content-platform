import {
  CATEGORY_SLUG_SET,
  PARENT_ROUTE_SET,
} from './domainConstants.js'
import { invalidArgument } from './errors.js'

export type CategoryFilter =
  | { kind: 'all' }
  | { kind: 'parent', parentRoute: string }
  | { kind: 'slug', slug: string }

/** 接受父分类或子分类 slug；未知值返回 400。 */
export function parseCategoryFilter(raw: string | undefined): CategoryFilter {
  if (raw === undefined) {
    return { kind: 'all' }
  }
  if (PARENT_ROUTE_SET.has(raw)) {
    return { kind: 'parent', parentRoute: raw }
  }
  if (CATEGORY_SLUG_SET.has(raw)) {
    return { kind: 'slug', slug: raw }
  }
  throw invalidArgument('参数不合法')
}
