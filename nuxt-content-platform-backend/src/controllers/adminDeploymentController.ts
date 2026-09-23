import type { Request, Response } from 'express'
import { BuildEventReason, BuildEventStatus } from '@prisma/client'
import { actorFromRequest } from '../lib/auditActor.js'
import { ADMIN_SESSION_COOKIE, readCookie } from '../lib/adminCookies.js'
import { assertAllowedOrigin, readCsrfHeader } from '../lib/adminRequest.js'
import { invalidArgument } from '../lib/errors.js'
import { parsePositiveInt } from '../lib/pagination.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery, getOptionalQueryString } from '../middleware/queryGuard.js'
import { requireAdminSession, requireAdminWriteSession } from '../services/adminAuthService.js'
import { getDeployment, listDeployments, retryDeployment } from '../services/adminDeploymentService.js'

function parseId(req: Request): number {
  const raw = req.params.id
  if (typeof raw !== 'string')
    throw invalidArgument('参数不合法')
  return parsePositiveInt(raw, 0, 2_147_483_647)
}

export async function getAdminDeployments(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, ['status', 'reason', 'page', 'page_size'])
  await requireAdminSession(readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE))
  const page = parsePositiveInt(getOptionalQueryString(req, 'page'), 1, 1_000_000)
  const pageSize = parsePositiveInt(getOptionalQueryString(req, 'page_size'), 20, 50)
  const rawStatus = getOptionalQueryString(req, 'status')
  const rawReason = getOptionalQueryString(req, 'reason')
  if (rawStatus && !Object.values(BuildEventStatus).includes(rawStatus as BuildEventStatus))
    throw invalidArgument('status 参数不合法')
  if (rawReason && !Object.values(BuildEventReason).includes(rawReason as BuildEventReason))
    throw invalidArgument('reason 参数不合法')
  res.status(200).json(okResponse(await listDeployments({
    ...(rawStatus ? { status: rawStatus as BuildEventStatus } : {}),
    ...(rawReason ? { reason: rawReason as BuildEventReason } : {}),
    page,
    pageSize,
  })))
}

export async function getAdminDeployment(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  await requireAdminSession(readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE))
  res.status(200).json(okResponse(await getDeployment(parseId(req))))
}

export async function postAdminDeploymentRetry(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)
  const session = await requireAdminWriteSession(
    readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE),
    readCsrfHeader(req),
  )
  res.status(200).json(okResponse(await retryDeployment(
    parseId(req),
    actorFromRequest(req, res, session.adminUserId),
  )))
}
