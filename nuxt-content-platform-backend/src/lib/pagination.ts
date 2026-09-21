import { invalidArgument } from './errors.js'

const DECIMAL_POSITIVE_INT = /^[1-9]\d*$/
const DECIMAL_DIGITS = /^\d{1,32}$/
const MYSQL_SIGNED_INT_MAX = 2_147_483_647

/** Accept only decimal positive integer strings; omit uses the default. */
export function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  max: number,
): number {
  if (raw === undefined) {
    return fallback
  }
  if (!DECIMAL_POSITIVE_INT.test(raw)) {
    throw invalidArgument('参数不合法')
  }
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value > max) {
    throw invalidArgument('参数不合法')
  }
  return value
}

/** Optional bounded positive int; omit → undefined. */
export function parseOptionalBoundedInt(
  raw: string | undefined,
  min: number,
  max: number,
): number | undefined {
  if (raw === undefined) {
    return undefined
  }
  if (!DECIMAL_POSITIVE_INT.test(raw)) {
    throw invalidArgument('参数不合法')
  }
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw invalidArgument('参数不合法')
  }
  return value
}

/** Optional periodCode: 1–32 digit string. */
export function parseOptionalDrawNumber(raw: string | undefined): string | undefined {
  if (raw === undefined) {
    return undefined
  }
  if (!DECIMAL_DIGITS.test(raw)) {
    throw invalidArgument('参数不合法')
  }
  return raw
}

/** Path article id: decimal 1..2147483647, no leading zeros. */
export function parseArticleId(raw: string): number {
  if (!DECIMAL_POSITIVE_INT.test(raw)) {
    throw invalidArgument('参数不合法')
  }
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value > MYSQL_SIGNED_INT_MAX) {
    throw invalidArgument('参数不合法')
  }
  return value
}
