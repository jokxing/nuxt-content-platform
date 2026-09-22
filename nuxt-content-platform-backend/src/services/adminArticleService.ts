import { ArticleStatus, Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import type {
  AdminArticleStatus,
  ArticleUpdateInput,
  ArticleWriteInput,
} from '../lib/adminArticleValidation.js'
import { LOCALES } from '../lib/domainConstants.js'
import {
  adminArticleNotFound,
  dataIntegrityError,
  invalidArgument,
  uniqueConflict,
  versionConflict,
} from '../lib/errors.js'
import { CONTENT_LIMIT, sanitizeArticleHtml } from '../lib/htmlSanitize.js'
import { toUnixMillis } from '../lib/time.js'

export type AdminCategoryBrief = {
  id: number
  slug: string
  name: string
  parent_route: string
}

export type AdminTranslationDto = {
  title: string
  content: string
}

export type AdminTranslationsDto = {
  'zh-CN': AdminTranslationDto
  'zh-HK': AdminTranslationDto
  'en-US': AdminTranslationDto
}

export type AdminArticleSummaryDto = {
  id: number
  slug: string
  title: string
  author: string
  cover_image: string
  category: AdminCategoryBrief
  status: AdminArticleStatus
  published_at: number | null
  created_at: number
  updated_at: number
  version: number
}

export type AdminArticleDto = AdminArticleSummaryDto & {
  translations: AdminTranslationsDto
}

export type AdminArticlePage = {
  items: AdminArticleSummaryDto[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

type ArticleFullRow = Prisma.ArticleGetPayload<{
  include: {
    translations: true
    category: { include: { translations: true } }
  }
}>

const articleFullInclude = {
  translations: true,
  category: {
    include: {
      translations: true,
    },
  },
} as const

function categoryBrief(row: ArticleFullRow): AdminCategoryBrief {
  const name = row.category.translations.find(item => item.locale === 'zh-CN')?.name?.trim()
  if (!name)
    throw dataIntegrityError('分类数据不完整')
  return {
    id: row.category.id,
    slug: row.category.slug,
    name,
    parent_route: row.category.parentRoute,
  }
}

function translationsDto(row: ArticleFullRow): AdminTranslationsDto {
  const byLocale = new Map(row.translations.map(item => [item.locale, item]))
  const build = (locale: (typeof LOCALES)[number]): AdminTranslationDto => {
    const item = byLocale.get(locale)
    if (!item)
      throw dataIntegrityError('翻译数据不完整')
    return {
      title: item.title,
      content: item.content,
    }
  }
  return {
    'zh-CN': build('zh-CN'),
    'zh-HK': build('zh-HK'),
    'en-US': build('en-US'),
  }
}

function toSummary(row: ArticleFullRow): AdminArticleSummaryDto {
  const zhTitle = row.translations.find(item => item.locale === 'zh-CN')?.title ?? ''
  return {
    id: row.id,
    slug: row.slug,
    title: zhTitle,
    author: row.author,
    cover_image: row.coverImage,
    category: categoryBrief(row),
    status: row.status,
    published_at: row.publishedAt ? toUnixMillis(row.publishedAt) : null,
    created_at: toUnixMillis(row.createdAt),
    updated_at: toUnixMillis(row.updatedAt),
    version: row.version,
  }
}

function toDetail(row: ArticleFullRow): AdminArticleDto {
  return {
    ...toSummary(row),
    translations: translationsDto(row),
  }
}

async function loadArticle(
  client: Prisma.TransactionClient | typeof prisma,
  id: number,
): Promise<AdminArticleDto> {
  const row = await client.article.findUnique({
    where: { id },
    include: articleFullInclude,
  })
  if (!row)
    throw adminArticleNotFound()
  return toDetail(row)
}

function sanitizeTranslations(input: ArticleWriteInput['translations']): AdminTranslationsDto {
  const out = {} as AdminTranslationsDto
  for (const locale of LOCALES) {
    const item = input[locale]
    const content = sanitizeArticleHtml(item.content)
    if (content.length > CONTENT_LIMIT)
      throw invalidArgument('正文不合法')
    if (item.title.length > 200)
      throw invalidArgument('标题不合法')
    out[locale] = {
      title: item.title,
      content,
    }
  }
  return out
}

async function assertCategoryExists(categoryId: number): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category)
    throw invalidArgument('分类不存在')
}

function isUniqueSlugError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === 'P2002'
  )
}

export async function listAdminArticles(options: {
  status?: AdminArticleStatus
  categorySlug?: string
  q?: string
  page: number
  pageSize: number
}): Promise<AdminArticlePage> {
  const where: Prisma.ArticleWhereInput = {}
  if (options.status)
    where.status = options.status
  if (options.categorySlug)
    where.category = { slug: options.categorySlug }
  if (options.q) {
    where.OR = [
      { slug: { contains: options.q } },
      { author: { contains: options.q } },
      { translations: { some: { title: { contains: options.q } } } },
    ]
  }

  return prisma.$transaction(async (tx) => {
    const total = await tx.article.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / options.pageSize))
    const rows = await tx.article.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
      include: articleFullInclude,
    })
    return {
      items: rows.map(toSummary),
      total,
      page: options.page,
      page_size: options.pageSize,
      total_pages: totalPages,
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  })
}

export async function getAdminArticle(id: number): Promise<AdminArticleDto> {
  return loadArticle(prisma, id)
}

export async function createAdminArticle(input: ArticleWriteInput): Promise<AdminArticleDto> {
  await assertCategoryExists(input.category_id)
  const translations = sanitizeTranslations(input.translations)

  const slugTaken = await prisma.article.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  })
  if (slugTaken)
    throw uniqueConflict('文章 slug 已存在')

  try {
    const created = await prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          slug: input.slug,
          author: input.author,
          coverImage: input.cover_image,
          categoryId: input.category_id,
          status: ArticleStatus.DRAFT,
          publishedAt: null,
          version: 1,
          translations: {
            create: LOCALES.map(locale => ({
              locale,
              title: translations[locale].title,
              content: translations[locale].content,
            })),
          },
        },
      })
      return loadArticle(tx, article.id)
    })
    return created
  }
  catch (error) {
    if (isUniqueSlugError(error))
      throw uniqueConflict('文章 slug 已存在')
    throw error
  }
}

export async function updateAdminArticle(
  id: number,
  input: ArticleUpdateInput,
): Promise<AdminArticleDto> {
  await assertCategoryExists(input.category_id)
  const translations = sanitizeTranslations(input.translations)

  try {
    return await prisma.$transaction(async (tx) => {
      const result = await tx.article.updateMany({
        where: { id, version: input.version },
        data: {
          slug: input.slug,
          author: input.author,
          coverImage: input.cover_image,
          categoryId: input.category_id,
          version: { increment: 1 },
        },
      })

      if (result.count === 0) {
        const existing = await tx.article.findUnique({ where: { id } })
        if (!existing)
          throw adminArticleNotFound()
        throw versionConflict()
      }

      for (const locale of LOCALES) {
        await tx.articleTranslation.upsert({
          where: { articleId_locale: { articleId: id, locale } },
          create: {
            articleId: id,
            locale,
            title: translations[locale].title,
            content: translations[locale].content,
          },
          update: {
            title: translations[locale].title,
            content: translations[locale].content,
          },
        })
      }

      return loadArticle(tx, id)
    })
  }
  catch (error) {
    if (isUniqueSlugError(error))
      throw uniqueConflict('文章 slug 已存在')
    throw error
  }
}
