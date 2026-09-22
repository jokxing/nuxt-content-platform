import type { Request } from 'express'
import { getAuthConfig } from '../config/authConfig.js'
import { csrfInvalid } from './errors.js'

export function readClientIp(req: Request): string {
  return req.socket.remoteAddress || '0.0.0.0'
}

/**
 * 校验 Origin 是否在允许列表。
 * 缺少 Origin 时仅当配置允许（本地/测试）才通过。
 */
export function assertAllowedOrigin(req: Request): void {
  const originHeader = req.get('origin')
  const config = getAuthConfig()
  if (!originHeader) {
    if (config.allowMissingOrigin)
      return
    throw csrfInvalid()
  }
  if (!config.allowedOrigins.includes(originHeader))
    throw csrfInvalid()
}

export function readCsrfHeader(req: Request): string | null {
  const value = req.get('x-csrf-token')
  if (!value)
    return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
