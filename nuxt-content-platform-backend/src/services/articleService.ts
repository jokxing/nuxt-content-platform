import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import type { CategoryFilter } from '../lib/categoryQuery.js'
import { articleNotFound } from '../lib/errors.js'
import { normalizeCoverImage, sanitizeArticleHtml } from '../lib/htmlSanitize.js'
import type { Locale } from '../lib/lang.js'
import { toUnixMillis } from '../lib/time.js'
import { visibleArticleWhere } from './articleVisibility.js'

export type ArticleDto = {
  id: number
  title: string
  slug: string
  content: string
  publish_date: number
  author: string
  cover_image: string
  status: 1
  category: string
  category_slug: string
  parent_route: string
}

export type ArticlePage = {
  items: ArticleDto[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

type ArticleRow = Prisma.ArticleGetPayload<{
  include: {
    translations: true
    category: { include: { translations: true } }
  }
}>

function toDto(row: ArticleRow, locale: Locale): ArticleDto | null {
  const translation = row.translations.find(item => item.locale === locale)
  const categoryName = row.category.translations.find(item => item.locale === locale)?.name
  if (!translation || !row.publishedAt || !categoryName) {
    return null
  }
  return {
    id: row.id,
    title: translation.title,
    slug: row.slug,
    content: sanitizeArticleHtml(translation.content),
    publish_date: toUnixMillis(row.publishedAt),
    author: row.author,
    cover_image: normalizeCoverImage(row.coverImage),
    status: 1,
    category: categoryName,
    category_slug: row.category.slug,
    parent_route: row.category.parentRoute,
  }
}

function articleInclude(locale: Locale) {
  return {
    translations: { where: { locale } },
    category: {
      include: {
        translations: { where: { locale } },
      },
    },
  } as const
}

/** 列表与 total 放在同一可重复读事务，避免分页窗口内读到不一致快照。 */
export async function listArticles(
  locale: Locale,
  category: CategoryFilter,
  page: number,
  pageSize: number,
  now = new Date(),
): Promise<ArticlePage> {
  const where = visibleArticleWhere(now, locale, category)

  return prisma.$transaction(async (tx) => {
    const total = await tx.article.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const rows = await tx.article.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: articleInclude(locale),
    })
    const items = rows.flatMap((row) => {
      const dto = toDto(row, locale)
      return dto ? [dto] : []
    })
    return {
      items,
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  })
}

/** 不可见与不存在统一 40401，避免泄露草稿/定时发布等内部状态。 */
export async function getArticleById(
  id: number,
  locale: Locale,
  now = new Date(),
): Promise<ArticleDto> {
  const row = await prisma.article.findFirst({
    where: {
      id,
      ...visibleArticleWhere(now, locale, { kind: 'all' }),
    },
    include: articleInclude(locale),
  })
  const dto = row ? toDto(row, locale) : null
  if (!dto) {
    throw articleNotFound()
  }
  return dto
}
