import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import process from 'node:process'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.DEMO_CHECK_URL || 'http://127.0.0.1:4375'
const origin = process.env.SEO_SITE_URL || 'http://localhost:3666'
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
const ssrResults = []
const errors = []
const page = await browser.newPage()
page.on('pageerror', e => errors.push(e.message))
page.on('console', (msg) => {
  if (/hydration|\[intlify\].*Not found/i.test(msg.text()))
    errors.push(msg.text())
})
const translations = {}
for (const lang of ['zh-HK', 'zh-CN', 'en-US'])
  translations[lang] = JSON.parse(await fs.readFile(`i18n/locales/${lang}.json`, 'utf8'))
async function verify(path, locale, key, articleTitle) {
  await page.waitForTimeout(400)
  const head = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    lang: document.documentElement.lang,
    canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(el => el.href),
    alternates: [...document.querySelectorAll('link[hreflang]')].map(el => [el.hreflang, el.href]),
    og: document.querySelector('meta[property="og:url"]')?.content,
    ogLocale: document.querySelector('meta[property="og:locale"]')?.content,
    robots: document.querySelector('meta[name="robots"]')?.content,
    schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map(el => JSON.parse(el.textContent)),
    marker: window.seoNavigationMarker,
  }))
  assert.deepEqual(head.canonical, [origin + path], path)
  assert.equal(head.lang, locale)
  assert.equal(head.og, origin + path)
  assert.equal(head.ogLocale, locale.replace('-', '_'))
  assert.ok(head.robots.includes('noindex'))
  assert.equal(head.marker, 'same-document')
  const bare = path.replace(/^\/(zh-CN|en-US)(?=\/|$)/, '') || '/'
  assert.equal(head.alternates.length, 4)
  for (const lang of ['zh-HK', 'zh-CN', 'en-US']) {
    const expected = origin + (lang === 'zh-HK' ? bare : `/${lang}${bare === '/' ? '' : bare}`)
    assert.ok(head.alternates.some(([code, url]) => code === lang && url === expected))
  }
  if (key) {
    assert.equal(head.title, translations[locale].seo[key].title)
    assert.equal(head.description, translations[locale].seo[key].description)
  }
  const articles = head.schemas.filter(schema => schema['@type'] === 'Article')
  if (articleTitle) {
    assert.equal(articles.length, 1)
    assert.equal(articles[0].headline, articleTitle)
    assert.equal(articles[0].mainEntityOfPage['@id'], origin + path)
    assert.ok(head.title.startsWith(articleTitle))
  }
  else {
    assert.equal(articles.length, 0, 'Stale article schema')
  }
  for (const schema of head.schemas.filter(s => ['CollectionPage', 'WebPage'].includes(s['@type'])))
    assert.equal(schema.url, origin + path)
  results.push({ path, title: head.title, schemaTypes: head.schemas.map(s => s['@type']) })
}
try {
  await page.goto(base)
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    window.seoNavigationMarker = 'same-document'
  })
  for (const locale of ['zh-HK', 'zh-CN', 'en-US']) {
    const prefix = locale === 'zh-HK' ? '' : `/${locale}`
    for (const [suffix, key, title] of [
      ['/', 'home'],
      ['/news/education', 'news-education'],
      ['/news/analysis', 'news-analysis'],
      ['/news/education/type/1', 'news-education-beginner'],
      ['/news/education/article/101', null, locale === 'en-US' ? 'How to read the data dashboard' : locale === 'zh-CN' ? '如何阅读数据面板' : '如何閱讀數據面板'],
      ['/news/education/article/102', null, locale === 'en-US' ? 'Filtering and comparison tips' : locale === 'zh-CN' ? '筛选与对比技巧' : '篩選與對比技巧'],
      ['/statistics/type/1', 'statistics-hot-cold'],
      ['/statistics/type/2', 'statistics-history'],
      ['/pick', 'ai-pick'],
    ]) {
      const path = `${prefix}${suffix === '/' && prefix ? '' : suffix}`
      await page.evaluate(path => document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$router.push(path), path)
      await verify(path, locale, key, title)
    }
  }
  // Use the visible language picker as well as router-driven same-document transitions.
  await page.locator('.van-nav-bar__left').click()
  await page.locator('.van-cell').filter({ hasText: 'English' }).click()
  await page.locator('.van-picker-column__item').filter({ hasText: '简体中文' }).click()
  await page.locator('.van-picker__confirm').click()
  await page.waitForURL('**/zh-CN/pick')
  await verify('/zh-CN/pick', 'zh-CN', 'ai-pick')
  for (const locale of ['zh-HK', 'zh-CN', 'en-US']) {
    const prefix = locale === 'zh-HK' ? '' : `/${locale}`
    const ssr = await browser.newPage({ javaScriptEnabled: false })
    for (const path of [`${prefix || '/'}`, `${prefix}/news/education/article/101`]) {
      const response = await ssr.goto(base + path)
      assert.equal(response.status(), 200)
      assert.equal(await ssr.locator('link[rel="canonical"]').getAttribute('href'), origin + path)
      assert.equal(await ssr.locator('html').getAttribute('lang'), locale)
      assert.equal(await ssr.locator('link[hreflang]').count(), 4)
      ssrResults.push(path)
    }
    await ssr.close()
  }
}
finally {
  await browser.close()
  await fs.writeFile('../docs/browser-review/seo-report.json', JSON.stringify({ results, ssrResults, errors }, null, 2))
}
assert.equal(errors.length, 0, JSON.stringify(errors))
console.log(`PASS: ${results.length} same-document SEO transitions, ${ssrResults.length} SSR pages, no runtime/hydration warnings`)
