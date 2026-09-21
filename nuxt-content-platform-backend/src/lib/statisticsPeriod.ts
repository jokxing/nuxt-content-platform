import { invalidArgument } from './errors.js'

export const STATISTICS_PERIOD_DEFAULT = 10
export const STATISTICS_PERIOD_MAX = 120

const POSITIVE_DECIMAL = /^[1-9]\d*$/

/**
 * 统计窗口期数：缺省 10；仅接受 1～120 的十进制正整数。
 * 超过上限不截断，直接 40000。
 */
export function parseStatisticsPeriod(raw: string | undefined): number {
  if (raw === undefined) {
    return STATISTICS_PERIOD_DEFAULT
  }
  if (!POSITIVE_DECIMAL.test(raw)) {
    throw invalidArgument('参数不合法')
  }
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value > STATISTICS_PERIOD_MAX) {
    throw invalidArgument('参数不合法')
  }
  return value
}
