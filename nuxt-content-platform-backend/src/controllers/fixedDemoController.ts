import type { Request, Response } from 'express'
import { resolveLang } from '../lib/lang.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import { getDemoCombinations } from '../services/fixedDemoService.js'

export async function getDemoCombinationsHandler(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['lang'])
  const locale = resolveLang(getOptionalQueryString(req, 'lang'))
  res.status(200).json(okResponse(getDemoCombinations(locale)))
}
