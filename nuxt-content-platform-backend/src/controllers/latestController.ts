import type { Request, Response } from 'express'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery } from '../middleware/queryGuard.js'
import { getLatestDataset } from '../services/latestService.js'

export async function getLatestHandler(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  const data = await getLatestDataset()
  res.status(200).json(okResponse(data))
}
