import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analyzeNumberMiss, missStats } from './numberMiss.js'

describe('missStats', () => {
  it('treats a number that never appears as a single censored miss', () => {
    assert.deepEqual(missStats([false, false, false]), {
      current_miss: 3,
      max_miss: 3,
      avg_miss: 3,
      most_freq_miss: 3,
      max_streak: 0,
    })
  })

  it('counts a latest hit as current miss 0 and keeps the opening zero gap', () => {
    assert.deepEqual(missStats([true, false, false]), {
      current_miss: 0,
      max_miss: 2,
      avg_miss: 1,
      most_freq_miss: 0,
      max_streak: 1,
    })
  })

  it('records zero gaps between consecutive hits', () => {
    assert.deepEqual(missStats([true, true, true]), {
      current_miss: 0,
      max_miss: 0,
      avg_miss: 0,
      most_freq_miss: 0,
      max_streak: 3,
    })
  })

  it('keeps leading and trailing censored misses', () => {
    assert.deepEqual(missStats([false, false, true, true, false]), {
      current_miss: 2,
      max_miss: 2,
      avg_miss: 1,
      most_freq_miss: 0,
      max_streak: 2,
    })
  })

  it('breaks mode ties by choosing the smaller gap', () => {
    assert.equal(missStats([true, false, true]).most_freq_miss, 0)
    assert.equal(
      missStats([false, false, true, false, true, false, false, true, false]).most_freq_miss,
      1,
    )
  })
})

describe('analyzeNumberMiss', () => {
  it('returns no stats for an empty window', () => {
    assert.deepEqual(analyzeNumberMiss([], 0), {
      period: 0,
      requested_period: 0,
      number_stats: [],
    })
  })

  it('returns exactly 49 ascending numbers when samples exist', () => {
    const result = analyzeNumberMiss([[1, 2, 3, 4, 5, 6, 7]], 1)
    assert.equal(result.number_stats.length, 49)
    assert.deepEqual(result.number_stats.map(item => item.number), Array.from({ length: 49 }, (_, i) => i + 1))
    assert.equal(result.number_stats[0]?.current_miss, 0)
    assert.equal(result.number_stats[0]?.max_streak, 1)
    assert.equal(result.number_stats[48]?.current_miss, 1)
  })
})
