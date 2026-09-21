import { adjacentPairs } from './analysisStats.js'

export type AdvancedStatsResult = {
  period: number
  requested_period: number
  tail_distribution: Record<string, number>
  group_distribution: Record<string, number>
  odd_even_ratio: {
    odd_count: number
    even_count: number
    odd_ratio: number
    even_ratio: number
  }
  consecutive_analysis: {
    consecutive_count: number
    consecutive_ratio: number
    total_draws: number
    consecutive_combinations: Array<{
      combination: [number, number]
      frequency: number
      combination_type: 'adjacent'
    }>
  }
  top_combinations: Array<{
    combination: number[]
    frequency: number
    combination_type: 'frequent'
  }>
}

function emptyTail(): Record<string, number> {
  return Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i), 0]))
}

function emptyGroups(): Record<string, number> {
  return Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [`G${String(i + 1).padStart(2, '0')}`, 0]),
  )
}

function percent(count: number, denominator: number): number {
  if (denominator === 0) {
    return 0
  }
  return Number(((count / denominator) * 100).toFixed(2))
}

function compareCombination(a: readonly number[], b: readonly number[]): number {
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i += 1) {
    if (a[i]! !== b[i]!) {
      return a[i]! - b[i]!
    }
  }
  return a.length - b.length
}

/**
 * 纯函数：rows 最新到最旧。
 * period=0 / 无样本时分布键完整且为 0，组合数组为空。
 * top_combinations 仅用前 6 个普通值的完整组合，不算子集。
 */
export function analyzeAdvancedStats(
  rows: readonly (readonly number[])[],
  requestedPeriod: number,
): AdvancedStatsResult {
  const tail_distribution = emptyTail()
  const group_distribution = emptyGroups()

  if (rows.length === 0) {
    return {
      period: 0,
      requested_period: requestedPeriod,
      tail_distribution,
      group_distribution,
      odd_even_ratio: {
        odd_count: 0,
        even_count: 0,
        odd_ratio: 0,
        even_ratio: 0,
      },
      consecutive_analysis: {
        consecutive_count: 0,
        consecutive_ratio: 0,
        total_draws: 0,
        consecutive_combinations: [],
      },
      top_combinations: [],
    }
  }

  let odd = 0
  let consecutiveCount = 0
  const adjacent = new Map<string, { combination: [number, number], frequency: number, combination_type: 'adjacent' }>()
  const combinations = new Map<string, { combination: number[], frequency: number, combination_type: 'frequent' }>()

  for (const row of rows) {
    for (const value of row) {
      tail_distribution[String(value % 10)]! += 1
      const group = ((value - 1) % 12) + 1
      group_distribution[`G${String(group).padStart(2, '0')}`]! += 1
      if (value % 2 === 1) {
        odd += 1
      }
    }

    const pairs = adjacentPairs(row)
    if (pairs.length > 0) {
      consecutiveCount += 1
    }
    for (const pair of pairs) {
      const key = `${pair[0]}-${pair[1]}`
      const existing = adjacent.get(key)
      if (existing) {
        existing.frequency += 1
      }
      else {
        adjacent.set(key, {
          combination: pair,
          frequency: 1,
          combination_type: 'adjacent',
        })
      }
    }

    const combination = [...row.slice(0, 6)].sort((a, b) => a - b)
    const comboKey = combination.join('-')
    const comboExisting = combinations.get(comboKey)
    if (comboExisting) {
      comboExisting.frequency += 1
    }
    else {
      combinations.set(comboKey, {
        combination,
        frequency: 1,
        combination_type: 'frequent',
      })
    }
  }

  const totalValues = rows.length * 7
  const consecutive_combinations = [...adjacent.values()]
    .sort((a, b) => b.frequency - a.frequency || compareCombination(a.combination, b.combination))

  const top_combinations = [...combinations.values()]
    .sort((a, b) => b.frequency - a.frequency || compareCombination(a.combination, b.combination))
    .slice(0, 5)

  return {
    period: rows.length,
    requested_period: requestedPeriod,
    tail_distribution,
    group_distribution,
    odd_even_ratio: {
      odd_count: odd,
      even_count: totalValues - odd,
      odd_ratio: percent(odd, totalValues),
      even_ratio: percent(totalValues - odd, totalValues),
    },
    consecutive_analysis: {
      consecutive_count: consecutiveCount,
      consecutive_ratio: percent(consecutiveCount, rows.length),
      total_draws: rows.length,
      consecutive_combinations,
    },
    top_combinations,
  }
}
