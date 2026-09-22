export type AdminProfile = {
  id: number
  username: string
  display_name: string
}

/** 会话 DTO：csrf_token 仅存内存，不进 localStorage。 */
export type AdminSessionData = {
  admin: AdminProfile
  csrf_token: string
  idle_expires_at: number
  absolute_expires_at: number
}

export type AdminApiErrorBody = {
  code: number
  msg: string
  data: null
  requestId?: string
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/** 构建/部署状态占位；数据库发布 ≠ 线上已部署。 */
export type DeploymentStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'SKIPPED'

export type ArticleFormMode = 'create' | 'edit'

export type ArticleLocale = 'zh-HK' | 'zh-CN' | 'en-US'

export type AdminCategory = {
  id: number
  slug: string
  name: string
  parent_route: 'education' | 'analysis' | 'story' | string
}

export type ArticleTranslation = {
  title: string
  content: string
}

export type ArticleTranslations = Record<ArticleLocale, ArticleTranslation>

export type AdminArticleSummary = {
  id: number
  slug: string
  title: string
  author: string
  cover_image: string
  category: AdminCategory
  status: ArticleStatus
  published_at: number | null
  created_at: number
  updated_at: number
  version: number
}

export type AdminArticle = AdminArticleSummary & {
  translations: ArticleTranslations
}

export type AdminArticlePage = {
  items: AdminArticleSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type ArticleWritePayload = {
  slug: string
  author: string
  cover_image: string
  category_id: number
  translations: ArticleTranslations
}

export type ArticleUpdatePayload = ArticleWritePayload & {
  version: number
}

export interface ArticleTranslationDraft {
  title: string
  content: string
}

/** 新建/编辑弹窗草稿；与后端 ArticleWriteInput 字段对齐。 */
export interface ArticleFormDraft {
  id: number | null
  version: number | null
  slug: string
  author: string
  coverUrl: string
  categoryId: number | null
  translations: Record<ArticleLocale, ArticleTranslationDraft>
}

export interface ArticleFormModalExpose {
  openCreate: () => void
  openEdit: (articleId: number) => void
}

export const ARTICLE_STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ARCHIVED: '已下线',
}

export function createEmptyArticleFormDraft(): ArticleFormDraft {
  return {
    id: null,
    version: null,
    slug: '',
    author: '',
    coverUrl: '/logo.svg',
    categoryId: null,
    translations: {
      'zh-HK': { title: '', content: '' },
      'zh-CN': { title: '', content: '' },
      'en-US': { title: '', content: '' },
    },
  }
}

export function cloneArticleFormDraft(source: ArticleFormDraft): ArticleFormDraft {
  return {
    id: source.id,
    version: source.version,
    slug: source.slug,
    author: source.author,
    coverUrl: source.coverUrl,
    categoryId: source.categoryId,
    translations: {
      'zh-HK': { ...source.translations['zh-HK'] },
      'zh-CN': { ...source.translations['zh-CN'] },
      'en-US': { ...source.translations['en-US'] },
    },
  }
}

export function articleToFormDraft(article: AdminArticle): ArticleFormDraft {
  return {
    id: article.id,
    version: article.version,
    slug: article.slug,
    author: article.author,
    coverUrl: article.cover_image,
    categoryId: article.category.id,
    translations: {
      'zh-CN': { ...article.translations['zh-CN'] },
      'zh-HK': { ...article.translations['zh-HK'] },
      'en-US': { ...article.translations['en-US'] },
    },
  }
}

/** 封面：仅 /logo.svg 或 /images/ 下无 .. 的相对路径。 */
export function isValidCoverImage(value: string): boolean {
  if (value === '/logo.svg')
    return true
  return (
    value.startsWith('/images/')
    && !value.includes('..')
    && !value.includes('\\')
    && !value.includes('//')
    && value.length <= 500
  )
}

export function formatAdminMillis(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value))
    return '—'
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value))
  }
  catch {
    return '—'
  }
}
