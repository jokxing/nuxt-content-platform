export type FrequencyItem = {
  number: number
  frequency: number
}

export type DuplicateTailItem = {
  duplicate_tail: number
  frequency: number
  combination_type: 'same_tail'
}

export type AdjacentPairItem = {
  consecutive_pair: [number, number]
  frequency: number
  combination_type: 'adjacent'
}

export type AnalysisResult = {
  period: number
  requested_period: number
  hot_numbers: FrequencyItem[]
  cold_numbers: FrequencyItem[]
  rising_numbers: FrequencyItem[]
  duplicate_numbers: DuplicateTailItem[]
  consecutive_numbers: AdjacentPairItem[]
}

const EMPTY: Omit<AnalysisResult, 'period' | 'requested_period'> = {
  hot_numbers: [],
  cold_numbers: [],
  rising_numbers: [],
  duplicate_numbers: [],
  consecutive_numbers: [],
}

/** 去重升序后，相差 1 的相邻对。供 analysis 与后续 advanced-stats 共用。 */
export function adjacentPairs(values: readonly number[]): [number, number][] {
  const sorted = [...new Set(values)].sort((a, b) => a - b)
  const pairs: [number, number][] = []
  for (let i = 1; i < sorted.length; i += 1) {
    const left = sorted[i - 1]!
    const right = sorted[i]!
    if (right - left === 1) {
      pairs.push([left, right])
    }
  }
  return pairs
}

function comparePair(a: [number, number], b: [number, number]): number {
  return a[0] - b[0] || a[1] - b[1]
}

/**
 * 纯函数：rows 必须已按最新到最旧排列。
 * 实际 period 为窗口行数；无样本或请求 0 时五个数组均为空。
 */
export function analyzeFrequency(
  rows: readonly (readonly number[])[],
  requestedPeriod: number,
): AnalysisResult {
  if (rows.length === 0) {
    return {
      period: 0,
      requested_period: requestedPeriod,
      ...EMPTY,
    }
  }

  const frequencies = Array.from({ length: 49 }, (_, index) => ({
    number: index + 1,
    frequency: 0,
  }))
  const tailCounts = Array.from({ length: 10 }, () => 0)
  const adjacent = new Map<string, AdjacentPairItem>()

  for (const row of rows) {
    for (const value of row) {
      frequencies[value - 1]!.frequency += 1
    }
    const tailHits = Array.from({ length: 10 }, () => 0)
    for (const value of row) {
      tailHits[value % 10]! += 1
    }
    for (let tail = 0; tail < 10; tail += 1) {
      if (tailHits[tail]! >= 2) {
        tailCounts[tail]! += 1
      }
    }
    for (const pair of adjacentPairs(row)) {
      const key = `${pair[0]}-${pair[1]}`
      const existing = adjacent.get(key)
      if (existing) {
        existing.frequency += 1
      }
      else {
        adjacent.set(key, {
          consecutive_pair: pair,
          frequency: 1,
          combination_type: 'adjacent',
        })
      }
    }
  }

  const rising = frequencies.flatMap((item) => {
    let frequency = 0
    for (const row of rows) {
      if (!row.includes(item.number)) {
        break
      }
      frequency += 1
    }
    return frequency > 0 ? [{ number: item.number, frequency }] : []
  })

  const hot_numbers = [...frequencies]
    .sort((a, b) => b.frequency - a.frequency || a.number - b.number)
    .slice(0, 5)

  const cold_numbers = [...frequencies]
    .sort((a, b) => a.frequency - b.frequency || a.number - b.number)
    .slice(0, 5)

  const rising_numbers = rising.sort((a, b) => b.frequency - a.frequency || a.number - b.number)

  const duplicate_numbers = tailCounts.flatMap((frequency, tail) => (
    frequency > 0
      ? [{ duplicate_tail: tail, frequency, combination_type: 'same_tail' as const }]
      : []
  )).sort((a, b) => b.frequency - a.frequency || a.duplicate_tail - b.duplicate_tail)

  const consecutive_numbers = [...adjacent.values()]
    .sort((a, b) => b.frequency - a.frequency || comparePair(a.consecutive_pair, b.consecutive_pair))

  return {
    period: rows.length,
    requested_period: requestedPeriod,
    hot_numbers,
    cold_numbers,
    rising_numbers,
    duplicate_numbers,
    consecutive_numbers,
  }
}
