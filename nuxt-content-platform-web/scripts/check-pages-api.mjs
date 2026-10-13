import assert from 'node:assert/strict'
import process from 'node:process'

// 先启动 wrangler pages dev .output/public 并绑定真实上游，再验证实际 Worker 路由。
const base = process.env.PAGES_CHECK_URL || 'http://127.0.0.1:4371'
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Use a local Pages preview')

for (const path of [
  '/api/latest',
  '/api/history?page=1&page_size=10',
  '/api/analysis?period=10',
  '/api/number-miss?period=10',
  '/api/advanced-stats?period=10',
  '/api/demo-combinations?lang=tc',
  '/api/articles?category=education&lang=tc&page=1&page_size=10',
  '/api/articles/101?lang=sc',
]) {
  const response = await fetch(`${base}${path}`)
  assert.equal(response.status, 200, path)
  assert.match(response.headers.get('content-type') || '', /application\/json/, path)
  const json = await response.json()
  assert.equal(json.code, 0, path)
  assert.ok(json.data && typeof json.data === 'object', path)
  console.log(`PASS JSON ${path}`)
}

for (const [path, method, status] of [
  ['/api/admin/articles', 'GET', 404],
  ['/api/latest?url=https://example.com', 'GET', 400],
  ['/api/history?page=1&page=2', 'GET', 400],
  ['/api/history?page=', 'GET', 400],
  ['/api/latest', 'POST', 405],
]) {
  const response = await fetch(`${base}${path}`, { method })
  assert.equal(response.status, status, `${method} ${path}`)
  assert.match(response.headers.get('content-type') || '', /application\/json/)
  assert.equal((await response.json()).code, status)
  console.log(`PASS reject ${method} ${path}: ${status}`)
}
