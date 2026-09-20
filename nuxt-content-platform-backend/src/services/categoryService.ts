import { prisma } from '../db/prisma.js'
import {
  CATEGORY_DEFINITIONS,
  EXPECTED_CATEGORY_COUNT,
  PARENT_ORDER,
  isCategorySlug,
  isParentRoute,
} from '../lib/domainConstants.js'
import { dataIntegrityError } from '../lib/errors.js'
import type { Locale } from '../lib/lang.js'

export type CategoryDto = {
  slug: string
  name: string
  parent_route: string
}

/**
 * 返回请求语言下的全部分类。缺任一分类的该语言名称、或条数≠9 → 50001，禁止静默少返回。
 */
export async function listCategories(locale: Locale): Promise<CategoryDto[]> {
  const rows = await prisma.category.findMany({
    include: {
      translations: {
        where: { locale },
        take: 1,
      },
    },
  })

  if (rows.length !== EXPECTED_CATEGORY_COUNT) {
    throw dataIntegrityError('分类数据不完整')
  }

  const mapped = rows.map((row) => {
    const translation = row.translations[0]
    const name = translation?.name?.trim()
    if (!name) {
      throw dataIntegrityError('分类数据不完整')
    }
    if (!isCategorySlug(row.slug) || !isParentRoute(row.parentRoute)) {
      throw dataIntegrityError('分类数据不完整')
    }
    const expected = CATEGORY_DEFINITIONS[row.slug]
    if (expected.parentRoute !== row.parentRoute || expected.sortOrder !== row.sortOrder) {
      throw dataIntegrityError('分类数据不完整')
    }
    const parentRoute = row.parentRoute
    return {
      slug: row.slug,
      name,
      parent_route: row.parentRoute,
      parentRank: PARENT_ORDER[parentRoute] ?? Number.MAX_SAFE_INTEGER,
      sortOrder: row.sortOrder,
    }
  })

  mapped.sort((a, b) => {
    if (a.parentRank !== b.parentRank) {
      return a.parentRank - b.parentRank
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }
    return a.slug.localeCompare(b.slug)
  })

  return mapped.map(({ slug, name, parent_route }) => ({ slug, name, parent_route }))
}
