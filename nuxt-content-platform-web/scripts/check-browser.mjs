import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import process from 'node:process'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.DEMO_CHECK_URL || 'http://127.0.0.1:4369'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const report = { pages: [], errors: [], externalRequests: [], interactions: [] }
const screenshots = '../docs/browser-review'
await fs.mkdir(screenshots, { recursive: true })
try {
  for (const width of [375, 390, 1280]) {
    for (const prefix of ['', '/zh-CN', '/en-US']) {
      const page = await browser.newPage({ viewport: { width, height: 844 } })
      page.on('pageerror', e => report.errors.push({ url: page.url(), message: e.message }))
      page.on('console', (m) => {
        if (/hydration|\[intlify\].*Not found/i.test(m.text()))
          report.errors.push({ url: page.url(), message: m.text().slice(0, 250) })
      })
      await page.route('**/*', (route) => {
        const url = new URL(route.request().url())
        if (url.protocol.startsWith('http') && url.origin !== new URL(base).origin) {
          report.externalRequests.push(url.href)
          return route.abort()
        }
        return route.continue()
      })
      for (const path of ['/', '/news/education', '/news/education/article/101', '/statistics/type/1', '/statistics/type/2', '/statistics/type/3', '/pick', '/missing-review-page']) {
        const response = await page.goto(`${base}${prefix}${path}`)
        await page.waitForTimeout(500)
        assert.equal(response.status(), path.includes('missing-review') ? 404 : 200, `${prefix}${path}`)
        assert.ok(page.url().includes(`${prefix}${path}`), `Locale URL changed: ${page.url()}`)
        if (path === '/') {
          const title = await page.locator('.group.cursor-pointer h3').first().textContent()
          assert.equal(title.trim(), prefix === '/en-US' ? 'How to read the data dashboard' : prefix === '/zh-CN' ? '如何阅读数据面板' : '如何閱讀數據面板')
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
        console.log(width, prefix + path)
        report.pages.push({ width, path: `${prefix}${path}`, status: response.status(), overflow })
        if (overflow)
          report.errors.push({ url: page.url(), message: `Horizontal overflow at ${width}px` })
        if (path === '/statistics/type/1') {
          await page.locator('canvas').waitFor({ state: 'visible' })
          const old = await page.locator('.freq_distribution').textContent()
          await page.locator('.period_selector .van-cell').first().click()
          await page.locator('.van-picker-column__item').filter({ hasText: '20' }).click()
          const fetched = page.waitForResponse(r => r.url().includes('/api/analysis?period=20'))
          await page.locator('.van-picker__confirm').click()
          assert.equal((await fetched).status(), 200)
          await page.waitForTimeout(200)
          assert.notEqual(await page.locator('.freq_distribution').textContent(), old)
          await page.locator('.chart_type_switch button').nth(1).click()
          await page.locator('.number_group_tabs button').last().click()
          await page.waitForTimeout(1200) // Let Chart.js finish its transition before visual evidence.
          await page.locator('canvas').screenshot({ path: `${screenshots}/${width}-${prefix.slice(1) || 'zh-HK'}-chart.png` })
          report.interactions.push(`${width}${prefix}: period 10→20, matrix, last group`)
        }
        if (path === '/' || path === '/statistics/type/3')
          await page.screenshot({ path: `${screenshots}/${width}-${prefix.slice(1) || 'zh-HK'}-${path === '/' ? 'home' : 'advanced'}.png`, fullPage: true })
      }
      await page.close()
    }
  }
}
finally {
  await browser.close()
  await fs.writeFile(`${screenshots}/report.json`, JSON.stringify(report, null, 2))
}
console.log(JSON.stringify({ pages: report.pages.length, interactions: report.interactions.length, errors: report.errors, externalRequests: report.externalRequests }, null, 2))
assert.equal(report.errors.length, 0)
assert.equal(report.externalRequests.length, 0)
