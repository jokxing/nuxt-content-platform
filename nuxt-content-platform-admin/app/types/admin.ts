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

export type BuildEventBrief = {
  id: number
  status: DeploymentStatus
  reason: 'article_published' | 'article_updated' | 'article_unpublished' | string
}

export type ArticleMutationResult = {
  article: AdminArticle
  build_event: BuildEventBrief
}

export type Deployment = {
  id: number
  event_type: string
  reason: string
  status: DeploymentStatus
  article_id: number | null
  article_version: number | null
  attempts: number
  external_run_id: string | null
  external_run_url: string | null
  error_summary: string | null
  created_at: number
  started_at: number | null
  finished_at: number | null
  updated_at: number
}

export type DeploymentPage = {
  items: Deployment[]
  total: number
  page: number
  page_size: number
  total_pages: number
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

/** 封面：/logo.svg、/images/... 或可信 MEDIA_PUBLIC_BASE_URL 下 covers/...webp */
export function isValidCoverImage(value: string, mediaPublicBaseUrl?: string | null): boolean {
  if (!value || value.length > 500)
    return false
  if (value === '/logo.svg')
    return true
  if (
    value.startsWith('/images/')
    && !value.includes('..')
    && !value.includes('\\')
    && !value.includes('//')
  ) {
    return true
  }
  if (mediaPublicBaseUrl)
    return isTrustedMediaAssetUrl(value, mediaPublicBaseUrl)
  return false
}

export function isTrustedMediaAssetUrl(value: string, mediaPublicBaseUrl: string): boolean {
  if (!value || !mediaPublicBaseUrl || value.length > 500)
    return false
  if (value.includes('..') || value.includes('\\'))
    return false
  let candidate: URL
  let base: URL
  try {
    candidate = new URL(value)
    base = new URL(mediaPublicBaseUrl)
  }
  catch {
    return false
  }
  if (candidate.username || candidate.password)
    return false
  if (candidate.protocol !== base.protocol || candidate.origin !== base.origin)
    return false
  const basePath = base.pathname.replace(/\/+$/, '') || ''
  const path = candidate.pathname
  const prefix = basePath === '' ? '/covers/' : `${basePath}/covers/`
  if (!path.startsWith(prefix))
    return false
  return /^[0-9]{4}\/[0-9]{2}\/[A-Za-z0-9]+\.webp$/.test(path.slice(prefix.length))
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

/** 公开站文章预览路径；数据库已发布 ≠ Cloudflare 已部署。 */
export function buildPublicArticlePreviewUrl(
  publicSiteUrl: string,
  parentRoute: string,
  articleId: number,
): string {
  const base = publicSiteUrl.replace(/\/+$/, '')
  const route = parentRoute || 'education'
  return `${base}/news/${route}/article/${articleId}`
}
