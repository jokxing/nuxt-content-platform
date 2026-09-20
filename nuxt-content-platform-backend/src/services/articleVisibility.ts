import type { Prisma } from '@prisma/client'
import type { CategoryFilter } from '../lib/categoryQuery.js'
import { LOCALES, type Locale } from '../lib/domainConstants.js'

/**
 * 公开可见的基础条件：已发布、发布时间已到，且三语 title/content 均非空。
 * 目录接口不依赖某一语言的分类名，因此不在这里过滤 category translation。
 */
export function visiblePublishedWhere(now: Date): Prisma.ArticleWhereInput {
  return {
    status: 'PUBLISHED',
    publishedAt: { lte: now },
    AND: LOCALES.map(requiredLocale => ({
      translations: {
        some: {
          locale: requiredLocale,
          title: { not: '' },
          content: { not: '' },
        },
      },
    })),
  }
}

/**
 * 列表/详情可见性：在公开基础条件上，再要求请求语言存在非空分类名，保证 DTO 可构造。
 */
export function visibleArticleWhere(
  now: Date,
  locale: Locale,
  category: CategoryFilter,
): Prisma.ArticleWhereInput {
  const categoryWhere: Prisma.CategoryWhereInput = {
    translations: {
      some: {
        locale,
        name: { not: '' },
      },
    },
  }
  if (category.kind === 'parent') {
    categoryWhere.parentRoute = category.parentRoute
  }
  if (category.kind === 'slug') {
    categoryWhere.slug = category.slug
  }

  return {
    ...visiblePublishedWhere(now),
    category: categoryWhere,
  }
}
