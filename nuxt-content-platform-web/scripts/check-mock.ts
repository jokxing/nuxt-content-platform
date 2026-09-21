import assert from 'node:assert/strict'
import { mockGetHistory, mockGetArticles, mockGetAnalysis, mockGetAdvancedStats, mockGetNumberMiss, mockGetDemoCombinations, mockGetLatest } from '../app/mock/index'
import { MOCK_HISTORY } from '../app/mock/data/catalog'

function unwrap<T extends Record<string, any>>(envelope: { code: number, msg: string, data: T }) {
  assert.equal(envelope.code, 0)
  assert.equal(envelope.msg, 'ok')
  return envelope.data
}

assert.equal(MOCK_HISTORY.length, 120)
assert.equal(new Set(MOCK_HISTORY.map(r => r.period_code)).size, 120)
const latest = unwrap(await mockGetLatest())
assert.equal(typeof latest.period_code, 'string')
assert.equal(typeof latest.released_at, 'number')
assert.equal(latest.values.length, 6)

const one = unwrap(await mockGetAnalysis({ period: 1 }))
assert.deepEqual(one.hot_numbers, [3, 7, 12, 18, 27].map(number => ({ number, frequency: 1 })))
const miss = unwrap(await mockGetNumberMiss({ period: 1 }))
assert.equal(miss.number_stats.find((n: { number: number }) => n.number === 3)?.current_miss, 0)
assert.equal(miss.number_stats.find((n: { number: number }) => n.number === 49)?.current_miss, 1)
let previous = ''
for (const period of [10, 20, 30, 50, 100]) {
  const result = unwrap(await mockGetAdvancedStats({ period }))
  assert.equal(Object.values(result.tail_distribution).reduce((a: number, b: number) => a + b, 0), period * 7)
  assert.equal(Object.values(result.group_distribution).reduce((a: number, b: number) => a + b, 0), period * 7)
  assert.equal(result.odd_even_ratio.odd_count + result.odd_even_ratio.even_count, period * 7)
  const history = unwrap(await mockGetHistory({ periods: period, page_size: 100 }))
  assert.equal(history.total, period)
  assert.ok(history.filter_options.period_codes.length > 0)
  const expectedOdd = history.items.flatMap((r: { values: number[], extra_value: number }) => [...r.values, r.extra_value]).filter((n: number) => n % 2).length
  assert.equal(result.odd_even_ratio.odd_count, expectedOdd)
  const current = JSON.stringify(result.tail_distribution)
  assert.notEqual(current, previous)
  previous = current
  const stats = unwrap(await mockGetNumberMiss({ period }))
  assert.equal(stats.number_stats.length, 49)
  assert.ok(stats.number_stats.every((n: { current_miss: number, max_miss: number, max_streak: number }) => n.current_miss <= n.max_miss && n.max_miss <= period && n.max_streak <= period))
}
await assert.rejects(() => mockGetAdvancedStats({ period: 999 }), { statusCode: 400 })
for (const fn of [mockGetHistory, mockGetArticles]) {
  for (const field of ['page', 'page_size', 'limit']) {
    for (const value of [0, -1, 1.5, Number.NaN, Infinity, '', 'abc', '1e3', ' 2 ', [], ['1', '2'], null, true, {}, Number.MAX_SAFE_INTEGER]) {
      await assert.rejects(() => fn({ [field]: value }), { statusCode: 400 })
    }
  }
  const beyond = unwrap(await fn({ page: 999999 }) as { code: number, msg: string, data: { items: unknown[], total_pages: number, page_size: number } })
  assert.deepEqual(beyond.items, [])
  assert.ok(Number.isFinite(beyond.total_pages))
  const capped = unwrap(await fn({ page_size: 10000 }) as { code: number, msg: string, data: { page_size: number, items: unknown[] } })
  assert.ok(capped.page_size <= 100)
  const a = unwrap(await fn({ page: 1, page_size: 2 }) as { code: number, msg: string, data: { items: unknown[] } })
  const b = unwrap(await fn({ page: 2, page_size: 2 }) as { code: number, msg: string, data: { items: unknown[] } })
  assert.notDeepEqual(a.items, b.items)
}
const empty = unwrap(await mockGetHistory({ year: 1900 }))
assert.equal(empty.total, 0)
assert.deepEqual(empty.items, [])
for (const fn of [mockGetAnalysis, mockGetAdvancedStats, mockGetNumberMiss]) {
  await assert.rejects(() => fn({ period: 0 }), { statusCode: 400 })
  await assert.rejects(() => fn({ period: ['10', '20'] }), { statusCode: 400 })
}
for (const lang of ['tc', 'sc', 'en']) {
  const demo = unwrap(await mockGetDemoCombinations(lang))
  assert.equal(demo.source, 'fixed_demo')
  assert.equal(demo.is_generated, false)
  assert.equal(demo.items.length, 5)
  assert.equal(demo.featured.numbers.length, 6)
}
console.log('PASS: statistical invariants, envelopes, 120 fixtures, five windows, missing intervals and invalid pagination cases.')
