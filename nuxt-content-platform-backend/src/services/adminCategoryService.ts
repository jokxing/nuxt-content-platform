import { prisma } from '../db/prisma.js'
import {
  CATEGORY_DEFINITIONS,
  EXPECTED_CATEGORY_COUNT,
  PARENT_ORDER,
  isCategorySlug,
  isParentRoute,
} from '../lib/domainConstants.js'
import { dataIntegrityError } from '../lib/errors.js'

export type AdminCategoryDto = {
  id: number
  slug: string
  name: string
  parent_route: string
}

/**
 * 管理端分类选项：固定 9 个，名称使用简体中文。
 */
export async function listAdminCategories(): Promise<{ items: AdminCategoryDto[] }> {
  const rows = await prisma.category.findMany({
    include: {
      translations: {
        where: { locale: 'zh-CN' },
        take: 1,
      },
    },
  })

  if (rows.length !== EXPECTED_CATEGORY_COUNT)
    throw dataIntegrityError('分类数据不完整')

  const mapped = rows.map((row) => {
    const name = row.translations[0]?.name?.trim()
    if (!name)
      throw dataIntegrityError('分类数据不完整')
    if (!isCategorySlug(row.slug) || !isParentRoute(row.parentRoute))
      throw dataIntegrityError('分类数据不完整')
    const expected = CATEGORY_DEFINITIONS[row.slug]
    if (expected.parentRoute !== row.parentRoute || expected.sortOrder !== row.sortOrder)
      throw dataIntegrityError('分类数据不完整')
    return {
      id: row.id,
      slug: row.slug,
      name,
      parent_route: row.parentRoute,
      parentRank: PARENT_ORDER[row.parentRoute] ?? Number.MAX_SAFE_INTEGER,
      sortOrder: row.sortOrder,
    }
  })

  mapped.sort((a, b) => {
    if (a.parentRank !== b.parentRank)
      return a.parentRank - b.parentRank
    if (a.sortOrder !== b.sortOrder)
      return a.sortOrder - b.sortOrder
    return a.slug.localeCompare(b.slug)
  })

  return {
    items: mapped.map(({ id, slug, name, parent_route }) => ({
      id,
      slug,
      name,
      parent_route,
    })),
  }
}
