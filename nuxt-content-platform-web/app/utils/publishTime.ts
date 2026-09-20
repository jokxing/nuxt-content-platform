/**
 * 资讯发布时间：API 为 13 位 Unix 毫秒；Mock 目录仍可能是 "YYYY-MM-DD HH:mm:ss"。
 * 展示与 sitemap lastmod 均经此模块转换，禁止把毫秒数直接当日期字符串。
 */

const MOCK_LOCAL = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/

/** 统一转为毫秒时间戳（Asia/Hong_Kong 解读无时区的 Mock 本地时间）。 */
export function toPublishMillis(value: number | string): number {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 1e12 || value > 1e14)
      throw new Error('Invalid publish timestamp')
    return value
  }

  const trimmed = value.trim()
  const local = trimmed.match(MOCK_LOCAL)
  if (local) {
    const year = Number(local[1])
    const month = Number(local[2])
    const day = Number(local[3])
    const hour = Number(local[4])
    const minute = Number(local[5])
    const second = Number(local[6])
    // 按 HKT(UTC+8) 解释 Mock 本地墙钟时间
    return Date.UTC(year, month - 1, day, hour - 8, minute, second)
  }

  if (/^\d{13}$/.test(trimmed)) {
    const ms = Number(trimmed)
    if (Number.isSafeInteger(ms))
      return ms
  }

  const parsed = Date.parse(trimmed)
  if (Number.isNaN(parsed))
    throw new Error('Invalid publish date')
  return parsed
}

/** 列表/详情展示：按语言与 Asia/Hong_Kong 格式化。 */
export function formatPublishDateForDisplay(value: number | string, locale: string = 'zh-HK'): string {
  try {
    const ms = toPublishMillis(value)
    return new Date(ms).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Hong_Kong',
    })
  }
  catch {
    return String(value)
  }
}

/** JSON-LD 等需要的 ISO-8601（UTC）。 */
export function toPublishIso(value: number | string): string {
  return new Date(toPublishMillis(value)).toISOString()
}

/** sitemap lastmod：发布日（Asia/Hong_Kong，YYYY-MM-DD）。 */
export function toSitemapLastmod(value: number | string): string {
  const ms = toPublishMillis(value)
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms))
}
