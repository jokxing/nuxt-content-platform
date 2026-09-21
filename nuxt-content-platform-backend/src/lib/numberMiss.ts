export type NumberMissItem = {
  number: number
  current_miss: number
  max_miss: number
  avg_miss: number
  most_freq_miss: number
  max_streak: number
}

export type NumberMissResult = {
  period: number
  requested_period: number
  number_stats: NumberMissItem[]
}

/** 最新到最旧的命中序列。遗漏段含首尾截断，以及连续命中之间的 0。 */
export function missStats(hits: readonly boolean[]): Omit<NumberMissItem, 'number'> {
  const first = hits.indexOf(true)
  const gaps: number[] = []
  let gap = 0
  let streak = 0
  let maxStreak = 0

  for (const hit of hits) {
    if (hit) {
      gaps.push(gap)
      gap = 0
      streak += 1
      maxStreak = Math.max(maxStreak, streak)
    }
    else {
      gap += 1
      streak = 0
    }
  }
  if (gap > 0) {
    gaps.push(gap)
  }

  const counts = new Map<number, number>()
  for (const value of gaps) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  const most = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]

  const sum = gaps.reduce((total, value) => total + value, 0)
  return {
    current_miss: first < 0 ? hits.length : first,
    max_miss: gaps.length === 0 ? 0 : Math.max(...gaps),
    avg_miss: gaps.length === 0 ? 0 : Number((sum / gaps.length).toFixed(2)),
    most_freq_miss: most?.[0] ?? 0,
    max_streak: maxStreak,
  }
}

/**
 * 无样本时 number_stats 为空；有样本时固定 1～49，按 number 升序。
 */
export function analyzeNumberMiss(
  rows: readonly (readonly number[])[],
  requestedPeriod: number,
): NumberMissResult {
  if (rows.length === 0) {
    return {
      period: 0,
      requested_period: requestedPeriod,
      number_stats: [],
    }
  }

  const number_stats = Array.from({ length: 49 }, (_, index) => {
    const number = index + 1
    const hits = rows.map(row => row.includes(number))
    return { number, ...missStats(hits) }
  })

  return {
    period: rows.length,
    requested_period: requestedPeriod,
    number_stats,
  }
}
