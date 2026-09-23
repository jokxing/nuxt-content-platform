import { ArticleStatus, BuildEventReason, BuildEventType, Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import type {
  AdminArticleStatus,
  ArticleUpdateInput,
  ArticleWriteInput,
} from '../lib/adminArticleValidation.js'
import {
  enqueueBuildEvent,
  toBuildEventBrief,
  writeAuditLog,
  type AuditActorContext,
  type BuildEventBriefDto,
} from '../lib/adminAudit.js'
import { LOCALES } from '../lib/domainConstants.js'
import {
  adminArticleNotFound,
  articleStateConflict,
  dataIntegrityError,
  invalidArgument,
  publishValidationFailed,
  uniqueConflict,
  versionConflict,
} from '../lib/errors.js'
import { getMediaConfig } from '../config/mediaConfig.js'
import {
  CONTENT_LIMIT,
  isValidCoverImage,
  sanitizeArticleHtml,
} from '../lib/htmlSanitize.js'
import { toUnixMillis } from '../lib/time.js'

export type AdminCategoryBrief = {
  id: number
  slug: string
  name: string
  parent_route: string
}

export type AdminArticleDeleteResult = {
  id: number
  deleted: true
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

export type ArticleMutationResultDto = {
  article: AdminArticleDto
  build_event: BuildEventBriefDto
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

const LOCALE_LABEL: Record<(typeof LOCALES)[number], string> = {
  'zh-CN': '简体中文',
  'zh-HK': '繁体中文',
  'en-US': '英文',
}

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

function htmlHasText(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0
}

function assertReadyToPublish(row: ArticleFullRow): void {
  if (!row.author.trim())
    throw publishValidationFailed('作者不能为空')
  if (!isValidCoverImage(row.coverImage, getMediaConfig().publicBaseUrl))
    throw publishValidationFailed('封面路径不合法')
  if (!row.categoryId)
    throw publishValidationFailed('分类不存在')

  const byLocale = new Map(row.translations.map(item => [item.locale, item]))
  for (const locale of LOCALES) {
    const item = byLocale.get(locale)
    const label = LOCALE_LABEL[locale]
    if (!item)
      throw publishValidationFailed(`${label}翻译缺失`)
    if (!item.title.trim())
      throw publishValidationFailed(`${label}标题不能为空`)
    const cleaned = sanitizeArticleHtml(item.content)
    if (!htmlHasText(cleaned))
      throw publishValidationFailed(`${label}正文不能为空`)
  }
}

/** 已发布文章保存后仍必须满足公开可见条件，避免状态与公开接口结果不一致。 */
function assertPublishedUpdateReady(
  input: ArticleUpdateInput,
  translations: AdminTranslationsDto,
): void {
  if (!input.author.trim())
    throw publishValidationFailed('作者不能为空')
  if (!isValidCoverImage(input.cover_image, getMediaConfig().publicBaseUrl))
    throw publishValidationFailed('封面路径不合法')

  for (const locale of LOCALES) {
    const item = translations[locale]
    const label = LOCALE_LABEL[locale]
    if (!item.title.trim())
      throw publishValidationFailed(`${label}标题不能为空`)
    if (!htmlHasText(item.content))
      throw publishValidationFailed(`${label}正文不能为空`)
  }
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
  actor?: AuditActorContext,
): Promise<AdminArticleDto> {
  await assertCategoryExists(input.category_id)
  const translations = sanitizeTranslations(input.translations)

  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.article.findUnique({ where: { id } })
      if (!before)
        throw adminArticleNotFound()
      if (before.version !== input.version)
        throw versionConflict()
      if (before.status === ArticleStatus.PUBLISHED)
        assertPublishedUpdateReady(input, translations)

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

      const nextVersion = input.version + 1
      if (before.status === ArticleStatus.PUBLISHED && actor) {
        await enqueueBuildEvent(tx, {
          eventType: BuildEventType.ARTICLE_UPDATED,
          reason: BuildEventReason.article_updated,
          articleId: id,
          articleVersion: nextVersion,
        })
        await writeAuditLog(tx, {
          actor,
          action: 'ARTICLE_UPDATED',
          entityType: 'article',
          entityId: id,
          entityVersion: nextVersion,
          metadata: {
            status: before.status,
            slug: input.slug,
            category_id: input.category_id,
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

/**
 * 受限硬删除：仅 DRAFT / ARCHIVED。
 * 写 AuditLog，不写 BuildEvent。
 */
export async function deleteAdminArticle(
  id: number,
  version: number,
  actor?: AuditActorContext,
): Promise<AdminArticleDeleteResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.article.findUnique({ where: { id } })
    if (!existing)
      throw adminArticleNotFound()
    if (existing.version !== version)
      throw versionConflict()
    if (existing.status === ArticleStatus.PUBLISHED)
      throw articleStateConflict('已发布文章请先下线后再删除')
    if (
      existing.status !== ArticleStatus.DRAFT
      && existing.status !== ArticleStatus.ARCHIVED
    ) {
      throw articleStateConflict('当前状态不允许该操作')
    }

    const result = await tx.article.deleteMany({
      where: {
        id,
        version,
        status: { in: [ArticleStatus.DRAFT, ArticleStatus.ARCHIVED] },
      },
    })

    if (result.count !== 1)
      throw versionConflict()

    if (actor) {
      await writeAuditLog(tx, {
        actor,
        action: 'ARTICLE_DELETED',
        entityType: 'article',
        entityId: id,
        entityVersion: version,
        metadata: {
          status: existing.status,
          slug: existing.slug,
        },
      })
    }

    return { id, deleted: true as const }
  })
}

export async function publishAdminArticle(
  id: number,
  version: number,
  actor: AuditActorContext,
): Promise<ArticleMutationResultDto> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.article.findUnique({
      where: { id },
      include: articleFullInclude,
    })
    if (!existing)
      throw adminArticleNotFound()
    if (existing.version !== version)
      throw versionConflict()
    if (existing.status === ArticleStatus.PUBLISHED)
      throw articleStateConflict('文章已是发布状态')
    if (
      existing.status !== ArticleStatus.DRAFT
      && existing.status !== ArticleStatus.ARCHIVED
    ) {
      throw articleStateConflict('当前状态不允许发布')
    }

    assertReadyToPublish(existing)

    const now = new Date()
    const result = await tx.article.updateMany({
      where: {
        id,
        version,
        status: { in: [ArticleStatus.DRAFT, ArticleStatus.ARCHIVED] },
      },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: now,
        version: { increment: 1 },
      },
    })
    if (result.count !== 1)
      throw versionConflict()

    const nextVersion = version + 1
    const buildEvent = await enqueueBuildEvent(tx, {
      eventType: BuildEventType.ARTICLE_PUBLISHED,
      reason: BuildEventReason.article_published,
      articleId: id,
      articleVersion: nextVersion,
    })
    await writeAuditLog(tx, {
      actor,
      action: 'ARTICLE_PUBLISHED',
      entityType: 'article',
      entityId: id,
      entityVersion: nextVersion,
      metadata: {
        from_status: existing.status,
        to_status: ArticleStatus.PUBLISHED,
        slug: existing.slug,
        category_id: existing.categoryId,
      },
    })

    return {
      article: await loadArticle(tx, id),
      build_event: toBuildEventBrief(buildEvent),
    }
  })
}

export async function unpublishAdminArticle(
  id: number,
  version: number,
  actor: AuditActorContext,
): Promise<ArticleMutationResultDto> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.article.findUnique({ where: { id } })
    if (!existing)
      throw adminArticleNotFound()
    if (existing.version !== version)
      throw versionConflict()
    if (existing.status !== ArticleStatus.PUBLISHED)
      throw articleStateConflict('仅已发布文章可下线')

    const result = await tx.article.updateMany({
      where: {
        id,
        version,
        status: ArticleStatus.PUBLISHED,
      },
      data: {
        status: ArticleStatus.ARCHIVED,
        version: { increment: 1 },
      },
    })
    if (result.count !== 1)
      throw versionConflict()

    const nextVersion = version + 1
    const buildEvent = await enqueueBuildEvent(tx, {
      eventType: BuildEventType.ARTICLE_UNPUBLISHED,
      reason: BuildEventReason.article_unpublished,
      articleId: id,
      articleVersion: nextVersion,
    })
    await writeAuditLog(tx, {
      actor,
      action: 'ARTICLE_UNPUBLISHED',
      entityType: 'article',
      entityId: id,
      entityVersion: nextVersion,
      metadata: {
        from_status: ArticleStatus.PUBLISHED,
        to_status: ArticleStatus.ARCHIVED,
        slug: existing.slug,
        category_id: existing.categoryId,
      },
    })

    return {
      article: await loadArticle(tx, id),
      build_event: toBuildEventBrief(buildEvent),
    }
  })
}
