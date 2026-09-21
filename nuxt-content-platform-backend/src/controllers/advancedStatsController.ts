import type { Request, Response } from 'express'
import { parseStatisticsPeriod } from '../lib/statisticsPeriod.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import { getAdvancedStats } from '../services/advancedStatsService.js'

export async function getAdvancedStatsHandler(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['period'])
  const requestedPeriod = parseStatisticsPeriod(getOptionalQueryString(req, 'period'))
  const data = await getAdvancedStats(requestedPeriod)
  res.status(200).json(okResponse(data))
}
