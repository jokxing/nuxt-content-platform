import { MOCK_HISTORY } from './data/catalog'
import { positiveInteger } from './parameters'

type Row = typeof MOCK_HISTORY[number]
export function numbers(row: Row) {
  return [...row.values, row.extra_value]
}

// 统计从同一份历史样本计算，返回实际窗口大小，避免请求期数超过样本时产生误导。
function windowRows(params: Record<string, unknown>) {
  const requested = positiveInteger(params.period, 'period', 10)
  const rows = MOCK_HISTORY.slice(0, requested)
  return { rows, period: rows.length, requested_period: requested }
}

function pairs(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.slice(1).flatMap((n, i) => n - sorted[i]! === 1 ? [[sorted[i]!, n]] : [])
}

export function analysis(params: Record<string, unknown>) {
  const { rows, ...meta } = windowRows(params)
  const frequencies = Array.from({ length: 49 }, (_, i) => ({ number: i + 1, frequency: 0 }))
  const tails = Array.from({ length: 10 }, (_, i) => ({ duplicate_tail: i, frequency: 0, combination_type: 'same_tail' }))
  const adjacent = new Map<string, { consecutive_pair: number[], frequency: number, combination_type: string }>()
  for (const row of rows) {
    const values = numbers(row)
    for (const n of values) frequencies[n - 1]!.frequency++
    for (const tail of tails) {
      if (values.filter(n => n % 10 === tail.duplicate_tail).length >= 2)
        tail.frequency++
    }
    for (const pair of pairs(values)) {
      const key = pair.join('-')
      const entry = adjacent.get(key) || { consecutive_pair: pair, frequency: 0, combination_type: 'adjacent' }
      entry.frequency++
      adjacent.set(key, entry)
    }
  }
  const rising = frequencies.map(({ number }) => {
    let frequency = 0
    for (const row of rows) {
      if (!numbers(row).includes(number))
        break
      frequency++
    }
    return { number, frequency }
  }).filter(n => n.frequency > 0)
  return {
    ...meta,
    hot_numbers: [...frequencies].sort((a, b) => b.frequency - a.frequency || a.number - b.number).slice(0, 5),
    cold_numbers: [...frequencies].sort((a, b) => a.frequency - b.frequency || a.number - b.number).slice(0, 5),
    rising_numbers: rising.sort((a, b) => b.frequency - a.frequency || a.number - b.number),
    duplicate_numbers: tails.filter(t => t.frequency > 0).sort((a, b) => b.frequency - a.frequency),
    consecutive_numbers: [...adjacent.values()].sort((a, b) => b.frequency - a.frequency),
  }
}

export function advancedStats(params: Record<string, unknown>) {
  const { rows, ...meta } = windowRows(params)
  const tail: Record<string, number> = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i, 0]))
  const groups: Record<string, number> = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`G${String(i + 1).padStart(2, '0')}`, 0]))
  let odd = 0
  let consecutiveCount = 0
  const combinations = new Map<string, { combination: number[], frequency: number, combination_type: string }>()
  for (const row of rows) {
    const values = numbers(row)
    for (const n of values) {
      tail[n % 10]!++
      groups[`G${String((n - 1) % 12 + 1).padStart(2, '0')}`]!++
      if (n % 2)
        odd++
    }
    if (pairs(values).length)
      consecutiveCount++
    const combination = values.slice(0, 6).sort((a, b) => a - b)
    const key = combination.join('-')
    const entry = combinations.get(key) || { combination, frequency: 0, combination_type: 'frequent' }
    entry.frequency++
    combinations.set(key, entry)
  }
  const total = rows.length * 7
  const ratio = (n: number, denominator: number) => denominator ? Number((n / denominator * 100).toFixed(2)) : 0
  return {
    ...meta,
    tail_distribution: tail,
    group_distribution: groups,
    odd_even_ratio: { odd_count: odd, even_count: total - odd, odd_ratio: ratio(odd, total), even_ratio: ratio(total - odd, total) },
    consecutive_analysis: {
      consecutive_count: consecutiveCount,
      consecutive_ratio: ratio(consecutiveCount, rows.length),
      total_draws: rows.length,
      consecutive_combinations: analysis(params).consecutive_numbers.map(p => ({ combination: p.consecutive_pair, frequency: p.frequency, combination_type: p.combination_type })),
    },
    top_combinations: [...combinations.values()].sort((a, b) => b.frequency - a.frequency).slice(0, 5),
  }
}

export function numberMiss(params: Record<string, unknown>) {
  const { rows, ...meta } = windowRows(params)
  return {
    ...meta,
    number_stats: Array.from({ length: 49 }, (_, i) => {
      const number = i + 1
      const hits = rows.map(row => numbers(row).includes(number))
      const first = hits.indexOf(true)
      const gaps: number[] = []
      let gap = 0
      let streak = 0
      let maxStreak = 0
      for (const hit of hits) {
        if (hit) {
          // Include zero gaps between consecutive appearances; include censored edge runs.
          gaps.push(gap)
          gap = 0
          maxStreak = Math.max(maxStreak, ++streak)
        }
        else {
          gap++
          streak = 0
        }
      }
      if (gap)
        gaps.push(gap)
      const counts = new Map<number, number>()
      for (const g of gaps) counts.set(g, (counts.get(g) || 0) + 1)
      return {
        number,
        current_miss: first < 0 ? hits.length : first,
        max_miss: Math.max(0, ...gaps),
        avg_miss: gaps.length ? Number((gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2)) : 0,
        most_freq_miss: [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] || 0,
        max_streak: maxStreak,
      }
    }),
  }
}
