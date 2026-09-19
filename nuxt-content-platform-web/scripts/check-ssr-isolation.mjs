import assert from 'node:assert/strict'
import process from 'node:process'

const base = process.env.DEMO_CHECK_URL || 'http://127.0.0.1:4378'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const languages = [
  ['', '如何閱讀數據面板'],
  ['/zh-CN', '如何阅读数据面板'],
  ['/en-US', 'How to read the data dashboard'],
]
await Promise.all(Array.from({ length: 24 }, async (_, index) => {
  const [prefix, title] = languages[index % languages.length]
  // Leading-zero ID is valid in the adapter, but absent from the prerender directory.
  const response = await fetch(`${base}${prefix}/news/education/article/00101`, {
    headers: { cookie: `lang=${index % 2 ? 'en-US' : 'zh-CN'}; review_actor=actor-${index}` },
  })
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.ok(html.includes(`<title>${title}｜`), `${prefix}: wrong SSR language`)
  assert.ok(!html.includes('review_actor='), 'Request cookies leaked into rendered payload')
}))
console.log('PASS: 24 concurrent non-prerendered SSR article requests with independent language/cookie contexts')
for (const [prefix] of languages) {
  for (const id of ['abc', '999999']) {
    const response = await fetch(`${base}${prefix}/news/education/article/${id}`)
    assert.equal(response.status, 404, 'Invalid/missing articles must retain 404 after transport migration')
  }
}
console.log('PASS: six invalid/missing article SSR responses retain HTTP 404')
