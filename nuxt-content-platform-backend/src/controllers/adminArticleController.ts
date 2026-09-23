import type { Request, Response } from 'express'
import {
  ADMIN_SESSION_COOKIE,
  readCookie,
} from '../lib/adminCookies.js'
import {
  parseAdminArticleStatus,
  parseAdminCategorySlug,
  parseAdminKeyword,
  parseArticleDeleteInput,
  parseArticleUpdateInput,
  parseArticleVersionCommand,
  parseArticleWriteInput,
} from '../lib/adminArticleValidation.js'
import { actorFromRequest } from '../lib/auditActor.js'
import { assertAllowedOrigin, readCsrfHeader } from '../lib/adminRequest.js'
import { invalidArgument } from '../lib/errors.js'
import { parseArticleId, parsePositiveInt } from '../lib/pagination.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import {
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticle,
  listAdminArticles,
  publishAdminArticle,
  unpublishAdminArticle,
  updateAdminArticle,
} from '../services/adminArticleService.js'
import {
  requireAdminSession,
  requireAdminWriteSession,
} from '../services/adminAuthService.js'
import { listAdminCategories } from '../services/adminCategoryService.js'

function assertJsonContentType(req: Request): void {
  const contentType = req.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json'))
    throw invalidArgument('Content-Type 必须为 application/json')
}

export async function getAdminCategories(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  await requireAdminSession(token)
  const data = await listAdminCategories()
  res.status(200).json(okResponse(data))
}

export async function getAdminArticles(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['status', 'category', 'q', 'page', 'page_size'])
  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  await requireAdminSession(token)

  const status = parseAdminArticleStatus(getOptionalQueryString(req, 'status'))
  const categorySlug = parseAdminCategorySlug(getOptionalQueryString(req, 'category'))
  const q = parseAdminKeyword(getOptionalQueryString(req, 'q'))
  const page = parsePositiveInt(getOptionalQueryString(req, 'page'), 1, 1_000_000)
  const pageSize = parsePositiveInt(getOptionalQueryString(req, 'page_size'), 10, 50)

  const data = await listAdminArticles({
    ...(status !== undefined ? { status } : {}),
    ...(categorySlug !== undefined ? { categorySlug } : {}),
    ...(q !== undefined ? { q } : {}),
    page,
    pageSize,
  })
  res.status(200).json(okResponse(data))
}

export async function getAdminArticleById(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  await requireAdminSession(token)

  const rawId = req.params.id
  if (typeof rawId !== 'string')
    throw invalidArgument('参数不合法')
  const id = parseArticleId(rawId)
  const data = await getAdminArticle(id)
  res.status(200).json(okResponse(data))
}

export async function postAdminArticle(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)
  assertJsonContentType(req)

  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  await requireAdminWriteSession(token, readCsrfHeader(req))

  const input = parseArticleWriteInput(req.body)
  const data = await createAdminArticle(input)
  res.status(201).json(okResponse(data))
}

export async function putAdminArticle(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)
  assertJsonContentType(req)

  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  const session = await requireAdminWriteSession(token, readCsrfHeader(req))

  const rawId = req.params.id
  if (typeof rawId !== 'string')
    throw invalidArgument('参数不合法')
  const id = parseArticleId(rawId)
  const input = parseArticleUpdateInput(req.body)
  const data = await updateAdminArticle(id, input, actorFromRequest(req, res, session.adminUserId))
  res.status(200).json(okResponse(data))
}

export async function deleteAdminArticleById(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)
  assertJsonContentType(req)

  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  const session = await requireAdminWriteSession(token, readCsrfHeader(req))

  const rawId = req.params.id
  if (typeof rawId !== 'string')
    throw invalidArgument('参数不合法')
  const id = parseArticleId(rawId)
  const input = parseArticleDeleteInput(req.body)
  const data = await deleteAdminArticle(id, input.version, actorFromRequest(req, res, session.adminUserId))
  res.status(200).json(okResponse(data))
}

export async function postAdminArticlePublish(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)
  assertJsonContentType(req)

  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  const session = await requireAdminWriteSession(token, readCsrfHeader(req))

  const rawId = req.params.id
  if (typeof rawId !== 'string')
    throw invalidArgument('参数不合法')
  const id = parseArticleId(rawId)
  const input = parseArticleVersionCommand(req.body)
  const data = await publishAdminArticle(id, input.version, actorFromRequest(req, res, session.adminUserId))
  res.status(200).json(okResponse(data))
}

export async function postAdminArticleUnpublish(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)
  assertJsonContentType(req)

  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  const session = await requireAdminWriteSession(token, readCsrfHeader(req))

  const rawId = req.params.id
  if (typeof rawId !== 'string')
    throw invalidArgument('参数不合法')
  const id = parseArticleId(rawId)
  const input = parseArticleVersionCommand(req.body)
  const data = await unpublishAdminArticle(id, input.version, actorFromRequest(req, res, session.adminUserId))
  res.status(200).json(okResponse(data))
}
