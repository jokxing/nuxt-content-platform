import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analyzeAdvancedStats } from './advancedStats.js'

describe('analyzeAdvancedStats', () => {
  it('keeps zeroed distribution keys and empty combinations for empty windows', () => {
    const result = analyzeAdvancedStats([], 0)
    assert.equal(result.period, 0)
    assert.equal(result.requested_period, 0)
    assert.deepEqual(Object.keys(result.tail_distribution), [...'0123456789'])
    assert.deepEqual(
      Object.keys(result.group_distribution),
      Array.from({ length: 12 }, (_, i) => `G${String(i + 1).padStart(2, '0')}`),
    )
    assert.equal(result.odd_even_ratio.odd_count, 0)
    assert.equal(result.odd_even_ratio.even_ratio, 0)
    assert.equal(result.consecutive_analysis.total_draws, 0)
    assert.deepEqual(result.consecutive_analysis.consecutive_combinations, [])
    assert.deepEqual(result.top_combinations, [])
  })

  it('counts tails, neutral groups, odd/even and adjacent periods', () => {
    const result = analyzeAdvancedStats([
      [1, 2, 3, 4, 5, 6, 7],
      [1, 2, 3, 4, 5, 6, 8],
    ], 2)
    assert.equal(result.period, 2)
    assert.equal(result.tail_distribution['1'], 2)
    assert.equal(result.tail_distribution['7'], 1)
    assert.equal(result.group_distribution.G01, 2)
    assert.equal(result.odd_even_ratio.odd_count, 7)
    assert.equal(result.odd_even_ratio.even_count, 7)
    assert.equal(result.odd_even_ratio.odd_ratio, 50)
    assert.equal(result.odd_even_ratio.even_ratio, 50)
    assert.equal(result.consecutive_analysis.consecutive_count, 2)
    assert.equal(result.consecutive_analysis.consecutive_ratio, 100)
    assert.ok(result.consecutive_analysis.consecutive_combinations.some(item => (
      item.combination[0] === 1 && item.combination[1] === 2 && item.frequency === 2
    )))
  })

  it('ranks full six-value combinations with stable dictionary ties', () => {
    const result = analyzeAdvancedStats([
      [6, 5, 4, 3, 2, 1, 49],
      [1, 2, 3, 4, 5, 6, 48],
      [10, 11, 12, 13, 14, 15, 16],
    ], 3)
    assert.equal(result.top_combinations[0]?.frequency, 2)
    assert.deepEqual(result.top_combinations[0]?.combination, [1, 2, 3, 4, 5, 6])
    assert.equal(result.top_combinations[0]?.combination_type, 'frequent')
    assert.deepEqual(result.top_combinations[1]?.combination, [10, 11, 12, 13, 14, 15])
  })
})

