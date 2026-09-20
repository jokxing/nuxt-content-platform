import type { Request, Response } from 'express'
import { resolveLang } from '../lib/lang.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import { listCategories } from '../services/categoryService.js'

export async function getCategories(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['lang'])
  const locale = resolveLang(getOptionalQueryString(req, 'lang'))
  const data = await listCategories(locale)
  res.status(200).json(okResponse(data))
}
