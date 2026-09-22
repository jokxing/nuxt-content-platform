import type { Response } from 'express'

export const ADMIN_SESSION_COOKIE = 'cp_admin_session'

export function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader)
    return null
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed)
      continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0)
      continue
    const key = trimmed.slice(0, eq).trim()
    if (key !== name)
      continue
    return decodeURIComponent(trimmed.slice(eq + 1).trim())
  }
  return null
}

export function setAdminSessionCookie(
  res: Response,
  token: string,
  options: { secure: boolean, maxAgeSeconds: number },
): void {
  const segments = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(1, Math.floor(options.maxAgeSeconds))}`,
  ]
  if (options.secure)
    segments.push('Secure')
  res.append('Set-Cookie', segments.join('; '))
}

export function clearAdminSessionCookie(res: Response, secure: boolean): void {
  const segments = [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (secure)
    segments.push('Secure')
  res.append('Set-Cookie', segments.join('; '))
}
