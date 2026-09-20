import type { Request, Response } from 'express'
import { parseCategoryFilter } from '../lib/categoryQuery.js'
import { invalidArgument } from '../lib/errors.js'
import { resolveLang } from '../lib/lang.js'
import { parseArticleId, parsePositiveInt } from '../lib/pagination.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import { getArticleById, listArticles } from '../services/articleService.js'

export async function getArticles(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['lang', 'category', 'page', 'page_size'])
  const locale = resolveLang(getOptionalQueryString(req, 'lang'))
  const category = parseCategoryFilter(getOptionalQueryString(req, 'category'))
  const page = parsePositiveInt(getOptionalQueryString(req, 'page'), 1, 1_000_000)
  const pageSize = parsePositiveInt(getOptionalQueryString(req, 'page_size'), 10, 50)
  const data = await listArticles(locale, category, page, pageSize)
  res.status(200).json(okResponse(data))
}

export async function getArticle(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['lang'])
  const rawId = req.params.id
  if (typeof rawId !== 'string') {
    throw invalidArgument('参数不合法')
  }
  const id = parseArticleId(rawId)
  const locale = resolveLang(getOptionalQueryString(req, 'lang'))
  const data = await getArticleById(id, locale)
  res.status(200).json(okResponse(data))
}
