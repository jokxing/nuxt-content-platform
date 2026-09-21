/** Asia/Hong_Kong 无夏令时；日历年边界转 UTC Instant。 */

export function hongKongYearUtcRange(year: number): { gte: Date, lt: Date } {
  return {
    gte: new Date(`${year}-01-01T00:00:00+08:00`),
    lt: new Date(`${year + 1}-01-01T00:00:00+08:00`),
  }
}

/** 从 UTC Instant 取 Asia/Hong_Kong 日历年。 */
export function hongKongCalendarYear(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
  }).formatToParts(date)
  const year = parts.find(part => part.type === 'year')?.value
  if (!year) {
    throw new Error('hong_kong_year_unavailable')
  }
  return Number(year)
}
