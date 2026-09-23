import { adminApiRequest } from '~/api/adminClient'
import type {
  AdminArticle,
  AdminArticlePage,
  AdminCategory,
  ArticleMutationResult,
  ArticleStatus,
  ArticleUpdatePayload,
  ArticleWritePayload,
} from '~/types/admin'

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const data = await adminApiRequest<{ items: AdminCategory[] }>('/api/admin/categories', {
    method: 'GET',
  })
  return data.items
}

export async function listAdminArticles(query: {
  status?: ArticleStatus | null
  category?: string | null
  q?: string | null
  page?: number
  pageSize?: number
}): Promise<AdminArticlePage> {
  return adminApiRequest<AdminArticlePage>('/api/admin/articles', {
    method: 'GET',
    query: {
      status: query.status || undefined,
      category: query.category || undefined,
      q: query.q || undefined,
      page: query.page,
      page_size: query.pageSize,
    },
  })
}

export async function getAdminArticle(id: number): Promise<AdminArticle> {
  return adminApiRequest<AdminArticle>(`/api/admin/articles/${id}`, {
    method: 'GET',
  })
}

export async function createAdminArticle(
  body: ArticleWritePayload,
  csrfToken: string,
): Promise<AdminArticle> {
  return adminApiRequest<AdminArticle>('/api/admin/articles', {
    method: 'POST',
    body,
    csrfToken,
  })
}

export async function updateAdminArticle(
  id: number,
  body: ArticleUpdatePayload,
  csrfToken: string,
): Promise<AdminArticle> {
  return adminApiRequest<AdminArticle>(`/api/admin/articles/${id}`, {
    method: 'PUT',
    body,
    csrfToken,
  })
}

export async function deleteAdminArticle(
  id: number,
  version: number,
  csrfToken: string,
): Promise<{ id: number, deleted: true }> {
  return adminApiRequest<{ id: number, deleted: true }>(`/api/admin/articles/${id}`, {
    method: 'DELETE',
    body: { version },
    csrfToken,
  })
}

export async function publishAdminArticle(
  id: number,
  version: number,
  csrfToken: string,
): Promise<ArticleMutationResult> {
  return adminApiRequest<ArticleMutationResult>(`/api/admin/articles/${id}/publish`, {
    method: 'POST',
    body: { version },
    csrfToken,
  })
}

export async function unpublishAdminArticle(
  id: number,
  version: number,
  csrfToken: string,
): Promise<ArticleMutationResult> {
  return adminApiRequest<ArticleMutationResult>(`/api/admin/articles/${id}/unpublish`, {
    method: 'POST',
    body: { version },
    csrfToken,
  })
}
