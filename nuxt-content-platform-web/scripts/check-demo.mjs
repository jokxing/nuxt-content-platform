import assert from 'node:assert/strict'
import process from 'node:process'

const base = process.env.DEMO_CHECK_URL || 'http://127.0.0.1:4366'
assert.ok(['localhost', '127.0.0.1', '::1'].includes(new URL(base).hostname), 'Only local demo servers may be checked')
let checked = 0
for (const prefix of ['', '/zh-CN', '/en-US']) {
  for (const route of ['/', '/news/education', '/news/analysis', '/news/story', '/news/education/type/1', '/news/education/article/101', '/statistics/type/1', '/statistics/type/2', '/statistics/type/3', '/pick']) {
    const response = await fetch(`${base}${prefix}${route}`)
    assert.equal(response.status, 200, `${prefix}${route}`)
    const html = await response.text()
    assert.ok(!/hkmark6|六合彩|Mark Six|googletagmanager/i.test(html), `Legacy content: ${prefix}${route}`)
    checked++
  }
  for (const route of ['/not-a-real-page', '/ga-test']) {
    assert.equal((await fetch(`${base}${prefix}${route}`)).status, 404)
    checked++
  }
  const oldDetail = await fetch(`${base}${prefix}/news/detail/101`, { redirect: 'manual' })
  const target = `${prefix}/news/education/article/101`
  if (oldDetail.status === 200) {
    // Nitro prerenders redirects as static HTML refresh pages.
    assert.ok((await oldDetail.text()).includes(`content="0; url=${target}"`))
  }
  else {
    assert.ok([301, 302, 307, 308].includes(oldDetail.status))
    assert.equal(oldDetail.headers.get('location'), target)
  }
  checked++
}
for (const locale of ['tc', 'sc', 'en']) {
  const response = await fetch(`${base}/api/articles?lang=${locale}`)
  assert.equal(response.status, 200)
  const list = await response.json()
  assert.equal(list.total, 5)
  for (const item of list.data) {
    const detail = await (await fetch(`${base}/api/articles/${item.id}?lang=${locale}`)).json()
    assert.equal(detail.id, item.id)
    assert.equal(detail.title, item.title)
  }
  checked++
}
assert.equal((await fetch(`${base}/api/articles/99999`)).status, 404)
checked++
console.log(`PASS: ${checked} route/API scenarios, including 15 list/detail consistency checks.`)
