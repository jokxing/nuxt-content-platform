import type { Request, Response } from 'express'
import {
  parseOptionalBoundedInt,
  parseOptionalDrawNumber,
  parsePositiveInt,
} from '../lib/pagination.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import { listDatasetHistory } from '../services/historyService.js'

export async function getHistoryHandler(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['page', 'page_size', 'year', 'period_code', 'number', 'periods'])

  const page = parsePositiveInt(getOptionalQueryString(req, 'page'), 1, 1_000_000)
  const pageSize = parsePositiveInt(getOptionalQueryString(req, 'page_size'), 20, 100)
  const year = parseOptionalBoundedInt(getOptionalQueryString(req, 'year'), 2000, 2100)
  const periodCode = parseOptionalDrawNumber(getOptionalQueryString(req, 'period_code'))
  const number = parseOptionalBoundedInt(getOptionalQueryString(req, 'number'), 1, 49)
  const periods = parseOptionalBoundedInt(getOptionalQueryString(req, 'periods'), 1, 120)

  const data = await listDatasetHistory({
    page,
    pageSize,
    ...(year !== undefined ? { year } : {}),
    ...(periodCode !== undefined ? { periodCode } : {}),
    ...(number !== undefined ? { number } : {}),
    ...(periods !== undefined ? { periods } : {}),
  })
  res.status(200).json(okResponse(data))
}
