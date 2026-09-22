import type { Request, Response } from 'express'
import {
  ADMIN_SESSION_COOKIE,
  readCookie,
} from '../lib/adminCookies.js'
import { assertAllowedOrigin, readCsrfHeader } from '../lib/adminRequest.js'
import { parseSingleUploadFile } from '../lib/parseMultipartUpload.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery } from '../middleware/queryGuard.js'
import { requireAdminWriteSession } from '../services/adminAuthService.js'
import { uploadAdminMediaImage } from '../services/adminMediaService.js'

export async function postAdminMediaImage(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)

  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  const session = await requireAdminWriteSession(token, readCsrfHeader(req))
  const file = await parseSingleUploadFile(req)
  const data = await uploadAdminMediaImage(file.buffer, session.adminUserId)
  res.status(201).json(okResponse(data))
}
