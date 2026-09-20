import type { Request, Response } from 'express'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery } from '../middleware/queryGuard.js'
import { getContentDirectory } from '../services/contentDirectoryService.js'

export async function getContentDirectoryHandler(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  const data = await getContentDirectory()
  res.status(200).json(okResponse(data))
}
