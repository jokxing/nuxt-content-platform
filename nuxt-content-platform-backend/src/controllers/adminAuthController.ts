import type { Request, Response } from 'express'
import { getAuthConfig } from '../config/authConfig.js'
import {
  ADMIN_SESSION_COOKIE,
  clearAdminSessionCookie,
  readCookie,
  setAdminSessionCookie,
} from '../lib/adminCookies.js'
import { assertAllowedOrigin, readClientIp, readCsrfHeader } from '../lib/adminRequest.js'
import { invalidArgument } from '../lib/errors.js'
import { okResponse } from '../lib/response.js'
import { assertAllowedQuery } from '../middleware/queryGuard.js'
import {
  getAdminSessionFromToken,
  loginAdmin,
  logoutAdmin,
} from '../services/adminAuthService.js'

export async function postAdminLogin(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)

  const contentType = req.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json'))
    throw invalidArgument('Content-Type 必须为 application/json')

  const result = await loginAdmin(req.body, readClientIp(req))
  const config = getAuthConfig()
  setAdminSessionCookie(res, result.sessionToken, {
    secure: config.cookieSecure,
    maxAgeSeconds: result.maxAgeSeconds,
  })
  res.status(200).json(okResponse(result.session))
}

export async function postAdminLogout(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  assertAllowedOrigin(req)

  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  const csrf = readCsrfHeader(req)
  const data = await logoutAdmin(token, csrf)
  clearAdminSessionCookie(res, getAuthConfig().cookieSecure)
  res.status(200).json(okResponse(data))
}

export async function getAdminSession(req: Request, res: Response): Promise<void> {
  assertAllowedQuery(req, [])
  const token = readCookie(req.get('cookie'), ADMIN_SESSION_COOKIE)
  const data = await getAdminSessionFromToken(token)
  res.status(200).json(okResponse(data))
}
