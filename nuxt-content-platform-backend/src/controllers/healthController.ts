import type { Request, Response } from 'express'
import { assertAllowedQuery } from '../middleware/queryGuard.js'
import { okResponse } from '../lib/response.js'
import { checkHealth } from '../services/healthService.js'

export async function getHealth(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  const data = await checkHealth()
  res.status(200).json(okResponse(data))
}
