import assert from 'node:assert/strict'
import { createContentApi } from '../app/api/client'

const observations: unknown[] = []
function instance(owner: string) {
  return createContentApi(async (path, options) => {
    observations.push({ owner, path, ...options })
    await new Promise(resolve => setTimeout(resolve, owner === 'A' ? 5 : 1))
    return { owner, lang: options.query?.lang }
  })
}
const a = instance('A')
const b = instance('B')
assert.notEqual(a, b)
await Promise.all(Array.from({ length: 40 }, async (_, i) => {
  const owner = i % 2 ? 'A' : 'B'
  const lang = owner === 'A' ? 'sc' : 'en'
  const result = await (owner === 'A' ? a : b).get('/api/articles', { params: { lang } })
  assert.deepEqual(result, { owner, lang })
}))
const params = { lang: 'tc' }
await createContentApi(async (_path, options) => {
  assert.equal(options.retry, 0)
  assert.equal(options.timeout, 10000)
  assert.equal(options.method, 'GET')
  assert.ok(!('headers' in options))
  options.query!.lang = 'en'
  return {}
}).get('/api/articles', { params })
assert.equal(params.lang, 'tc', 'Transport must not mutate caller parameters')
const error = Object.assign(new Error('Not found'), { statusCode: 404 })
await assert.rejects(createContentApi(async () => {
  throw error
}).get('/api/articles/999'), value => value === error)
for (const path of ['https://example.test/api/articles', '//example.test/api/latest', '/api/articles?lang=en', '/api/../private', '/api/articles/abc'])
  await assert.rejects(a.get(path), /Unsupported/)
assert.equal(observations.length, 40, 'Invalid paths must never reach the transport')
console.log('PASS: 40 concurrent isolated client calls, query ownership, error preservation and rejected external/invalid paths')
