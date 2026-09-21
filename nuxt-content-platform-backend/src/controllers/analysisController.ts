import type { Request, Response } from 'express'
import { parseStatisticsPeriod } from '../lib/statisticsPeriod.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import { getFrequencyAnalysis } from '../services/analysisService.js'

export async function getAnalysisHandler(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['period'])
  const requestedPeriod = parseStatisticsPeriod(getOptionalQueryString(req, 'period'))
  const data = await getFrequencyAnalysis(requestedPeriod)
  res.status(200).json(okResponse(data))
}
