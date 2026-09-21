import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { adjacentPairs, analyzeFrequency } from './analysisStats.js'

const rowA = [1, 2, 3, 4, 5, 6, 7] as const
const rowB = [1, 11, 21, 2, 12, 3, 13] as const

describe('adjacentPairs', () => {
  it('returns sorted unique neighbors only', () => {
    assert.deepEqual(adjacentPairs([7, 1, 3, 2, 2]), [[1, 2], [2, 3]])
    assert.deepEqual(adjacentPairs([10, 12, 49]), [])
  })
})

describe('analyzeFrequency', () => {
  it('returns five empty arrays when the window is empty', () => {
    assert.deepEqual(analyzeFrequency([], 0), {
      period: 0,
      requested_period: 0,
      hot_numbers: [],
      cold_numbers: [],
      rising_numbers: [],
      duplicate_numbers: [],
      consecutive_numbers: [],
    })
    assert.deepEqual(analyzeFrequency([], 10).hot_numbers, [])
    assert.equal(analyzeFrequency([], 10).period, 0)
    assert.equal(analyzeFrequency([], 10).requested_period, 10)
  })

  it('ranks all seven values with stable ties', () => {
    const result = analyzeFrequency([rowA], 1)
    assert.equal(result.period, 1)
    assert.deepEqual(result.hot_numbers.map(item => item.number), [1, 2, 3, 4, 5])
    assert.deepEqual(result.cold_numbers.map(item => item.number), [8, 9, 10, 11, 12])
    assert.deepEqual(result.rising_numbers.map(item => item.number), [1, 2, 3, 4, 5, 6, 7])
    assert.deepEqual(result.duplicate_numbers, [])
    assert.deepEqual(
      result.consecutive_numbers.map(item => item.consecutive_pair),
      [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
    )
  })

  it('counts same-tail periods, rising streak and adjacent pairs from newest', () => {
    const result = analyzeFrequency([rowB, rowA], 2)
    assert.equal(result.period, 2)
    const freq = (number: number) => result.hot_numbers.find(item => item.number === number)?.frequency
    assert.equal(freq(1), 2)
    assert.equal(result.rising_numbers.find(item => item.number === 7), undefined)
    assert.equal(result.rising_numbers.find(item => item.number === 1)?.frequency, 2)
    assert.deepEqual(
      result.duplicate_numbers.map(item => [item.duplicate_tail, item.frequency, item.combination_type]),
      [[1, 1, 'same_tail'], [2, 1, 'same_tail'], [3, 1, 'same_tail']],
    )
    const pair = result.consecutive_numbers.find(item => item.consecutive_pair[0] === 1 && item.consecutive_pair[1] === 2)
    assert.equal(pair?.frequency, 2)
    assert.equal(pair?.combination_type, 'adjacent')
  })
})
