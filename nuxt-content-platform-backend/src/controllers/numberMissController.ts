import type { Request, Response } from 'express'
import { parseStatisticsPeriod } from '../lib/statisticsPeriod.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import { getNumberMiss } from '../services/numberMissService.js'

export async function getNumberMissHandler(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['period'])
  const requestedPeriod = parseStatisticsPeriod(getOptionalQueryString(req, 'period'))
  const data = await getNumberMiss(requestedPeriod)
  res.status(200).json(okResponse(data))
}
