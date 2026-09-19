import assert from 'node:assert/strict'
import { mockGetHistory, mockGetArticles, mockGetAnalysis, mockGetAdvancedStats, mockGetNumberMiss } from '../app/mock/index'
import { MOCK_HISTORY } from '../app/mock/data/catalog'

assert.equal(MOCK_HISTORY.length, 120)
assert.equal(new Set(MOCK_HISTORY.map(r => r.draw_number)).size, 120)
const one = await mockGetAnalysis({ period: 1 })
assert.deepEqual(one.hot_numbers, [3, 7, 12, 18, 27].map(number => ({ number, frequency: 1 })))
const miss = await mockGetNumberMiss({ period: 1 })
assert.equal(miss.number_stats.find(n => n.number === 3)?.current_miss, 0)
assert.equal(miss.number_stats.find(n => n.number === 49)?.current_miss, 1)
let previous = ''
for (const period of [10, 20, 30, 50, 100]) {
  const result = await mockGetAdvancedStats({ period })
  assert.equal(Object.values(result.tail_distribution).reduce((a, b) => a + b, 0), period * 7)
  assert.equal(Object.values(result.zodiac_distribution).reduce((a, b) => a + b, 0), period * 7)
  assert.equal(result.odd_even_ratio.odd_count + result.odd_even_ratio.even_count, period * 7)
  const history = await mockGetHistory({ periods: period, page_size: 100 })
  assert.equal(history.total, period)
  const expectedOdd = history.data.flatMap(r => [r.num1, r.num2, r.num3, r.num4, r.num5, r.num6, r.special_number]).filter(n => n % 2).length
  assert.equal(result.odd_even_ratio.odd_count, expectedOdd)
  const current = JSON.stringify(result.tail_distribution)
  assert.notEqual(current, previous)
  previous = current
  const stats = await mockGetNumberMiss({ period })
  assert.equal(stats.number_stats.length, 49)
  assert.ok(stats.number_stats.every(n => n.current_miss <= n.max_miss && n.max_miss <= period && n.max_streak <= period))
}
assert.equal((await mockGetAdvancedStats({ period: 999 })).period, 120)
for (const fn of [mockGetHistory, mockGetArticles]) {
  for (const field of ['page', 'page_size', 'limit']) {
    for (const value of [0, -1, 1.5, Number.NaN, Infinity, '', 'abc', '1e3', ' 2 ', [], ['1', '2'], null, true, {}, Number.MAX_SAFE_INTEGER]) {
      await assert.rejects(() => fn({ [field]: value }), { statusCode: 400 })
    }
  }
  const beyond = await fn({ page: 999999 })
  assert.deepEqual(beyond.data, [])
  assert.ok(Number.isFinite(beyond.total_pages))
  const capped = await fn({ page_size: 10000 })
  assert.ok(capped.page_size <= 100)
  const a = await fn({ page: 1, page_size: 2 })
  const b = await fn({ page: 2, page_size: 2 })
  assert.notDeepEqual(a.data, b.data)
}
const empty = await mockGetHistory({ year: 1900 })
assert.equal(empty.total, 0)
assert.deepEqual(empty.data, [])
for (const fn of [mockGetAnalysis, mockGetAdvancedStats, mockGetNumberMiss]) {
  await assert.rejects(() => fn({ period: 0 }), { statusCode: 400 })
  await assert.rejects(() => fn({ period: ['10', '20'] }), { statusCode: 400 })
}
console.log('PASS: statistical invariants, 120 fixtures, five windows, missing intervals and 90 invalid pagination cases.')
