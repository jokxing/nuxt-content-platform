import { z } from 'zod'
import { isCategorySlug } from './domainConstants.js'
import { invalidArgument } from './errors.js'
import { getMediaConfig } from '../config/mediaConfig.js'
import { CONTENT_LIMIT, isValidCoverImage } from './htmlSanitize.js'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MYSQL_SIGNED_INT_MAX = 2_147_483_647

const translationSchema = z.object({
  title: z.string().max(200),
  content: z.string().max(CONTENT_LIMIT),
}).strict()

const translationsSchema = z.object({
  'zh-CN': translationSchema,
  'zh-HK': translationSchema,
  'en-US': translationSchema,
}).strict()

export const articleWriteInputSchema = z.object({
  slug: z.string().min(1).max(160).regex(SLUG_PATTERN),
  author: z.string().min(1).max(100),
  cover_image: z.string().min(1).max(500),
  category_id: z.number().int().min(1).max(MYSQL_SIGNED_INT_MAX),
  translations: translationsSchema,
}).strict()

export const articleUpdateInputSchema = articleWriteInputSchema.extend({
  version: z.number().int().min(1),
}).strict()

export const articleDeleteInputSchema = z.object({
  version: z.number().int().min(1),
}).strict()

export type ArticleWriteInput = z.infer<typeof articleWriteInputSchema>
export type ArticleUpdateInput = z.infer<typeof articleUpdateInputSchema>
export type ArticleDeleteInput = z.infer<typeof articleDeleteInputSchema>

function zodMessage(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue)
    return '参数不合法'
  const path = issue.path.map(String).join('.')
  if (path === 'slug')
    return 'slug 不合法'
  if (path === 'author')
    return '作者不合法'
  if (path === 'cover_image')
    return '封面路径不合法'
  if (path === 'category_id')
    return '分类不合法'
  if (path === 'version')
    return 'version 不合法'
  if (path.startsWith('translations')) {
    if (path.includes('title'))
      return '标题不合法'
    if (path.includes('content'))
      return '正文不合法'
    return '翻译不合法'
  }
  return '参数不合法'
}

export function parseArticleWriteInput(body: unknown): ArticleWriteInput {
  const parsed = articleWriteInputSchema.safeParse(body)
  if (!parsed.success)
    throw invalidArgument(zodMessage(parsed.error))
  const mediaBase = getMediaConfig().publicBaseUrl
  if (!isValidCoverImage(parsed.data.cover_image, mediaBase))
    throw invalidArgument('封面路径不合法')
  return parsed.data
}

export function parseArticleUpdateInput(body: unknown): ArticleUpdateInput {
  const parsed = articleUpdateInputSchema.safeParse(body)
  if (!parsed.success)
    throw invalidArgument(zodMessage(parsed.error))
  const mediaBase = getMediaConfig().publicBaseUrl
  if (!isValidCoverImage(parsed.data.cover_image, mediaBase))
    throw invalidArgument('封面路径不合法')
  return parsed.data
}

export function parseArticleDeleteInput(body: unknown): ArticleDeleteInput {
  const parsed = articleDeleteInputSchema.safeParse(body)
  if (!parsed.success)
    throw invalidArgument(zodMessage(parsed.error))
  return parsed.data
}

export type AdminArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export function parseAdminArticleStatus(raw: string | undefined): AdminArticleStatus | undefined {
  if (raw === undefined)
    return undefined
  if (raw === 'DRAFT' || raw === 'PUBLISHED' || raw === 'ARCHIVED')
    return raw
  throw invalidArgument('参数不合法')
}

/** 管理列表 category 仅接受九个子类 slug。 */
export function parseAdminCategorySlug(raw: string | undefined): string | undefined {
  if (raw === undefined)
    return undefined
  if (!isCategorySlug(raw))
    throw invalidArgument('参数不合法')
  return raw
}

export function parseAdminKeyword(raw: string | undefined): string | undefined {
  if (raw === undefined)
    return undefined
  const q = raw.trim()
  if (q.length < 1 || q.length > 100)
    throw invalidArgument('参数不合法')
  return q
}
