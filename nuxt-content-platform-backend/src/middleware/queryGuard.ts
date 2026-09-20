import type { Request } from 'express'
import { invalidArgument } from '../lib/errors.js'

/**
 * 契约：query 只允许白名单参数；未知、重复（数组）、空值一律 40000。
 */
export function assertAllowedQuery(req: Request, allowed: readonly string[]): void {
  const allowedSet = new Set(allowed)
  for (const [key, value] of Object.entries(req.query)) {
    if (!allowedSet.has(key)) {
      throw invalidArgument('参数不合法')
    }
    if (value === undefined || value === null || value === '') {
      throw invalidArgument('参数不合法')
    }
    if (Array.isArray(value)) {
      throw invalidArgument('参数不合法')
    }
  }
}

/** 在 assertAllowedQuery 之后读取可选的单值 query。 */
export function getOptionalQueryString(req: Request, key: string): string | undefined {
  const value = req.query[key]
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string') {
    throw invalidArgument('参数不合法')
  }
  return value
}
