const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = 'https://contentpulse-web.pages.dev';
const out = process.env.REVIEW_OUTPUT || path.resolve('../docs/browser-live-review');
async function main() {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { timestamp: new Date().toISOString(), base, readOnly: true, pages: [], api: [], errors: [], checks: [] };
  try {
    for (const width of [393, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 852 } });
      page.on('pageerror', e => report.errors.push(e.message));
      page.on('response', r => {
        if (r.url().startsWith(base + '/api/')) report.api.push({ url: r.url(), status: r.status(), type: r.headers()['content-type'] });
      });
      for (const route of ['/', '/zh-CN/news/education/article/101/', '/en-US/news/education/article/101/', '/statistics/type/1/']) {
        const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 });
        assert.equal(response.status(), 200, route);
        const body = await page.locator('body').innerText();
        assert.ok(body.length > 100, 'Empty page ' + route);
        assert.ok(!/Invalid .*data structure/.test(body), 'Invalid data ' + route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
        report.pages.push({ width, route, status: response.status(), overflow });
        assert.ok(!overflow, 'Horizontal overflow ' + route);
        if (route.includes('/zh-CN/')) {
          assert.ok(body.includes('阅读时先确认数据更新时间，再结合筛选条件比较各项指标。'), 'Published v3 text missing');
          const image = page.locator('img[src*="r2.dev/covers/"]').first();
          await image.waitFor({ state: 'visible' });
          assert.ok(await image.evaluate(i => i.complete && i.naturalWidth > 0), 'R2 cover not decoded');
          report.checks.push({ width, check: 'published-v3-text-and-r2-cover', result: 'pass' });
          await page.reload({ waitUntil: 'networkidle' });
          assert.ok(await image.evaluate(i => i.complete && i.naturalWidth > 0), 'Cover after refresh');
        }
      }
      await page.goto(base, { waitUntil: 'networkidle' });
      let documents = 0;
      page.on('request', r => { if (r.isNavigationRequest() && r.resourceType() === 'document') documents++; });
      for (const [index, route] of [[3, '/news/education'], [1, '/statistics/type/1'], [0, '/']]) {
        const link = page.locator('.van-tabbar-item').nth(index);
        await link.click();
        await page.waitForURL(u => u.pathname.replace(/\/$/, '') === route.replace(/\/$/, ''));
        await page.waitForLoadState('networkidle');
        assert.ok(!/Invalid .*data structure/.test(await page.locator('body').innerText()));
      }
      assert.equal(documents, 0, 'Client navigation performed full page requests');
      report.checks.push({ width, check: 'client-navigation-home-news-statistics-home', documentRequests: documents, result: 'pass' });
      await page.screenshot({ path: path.join(out, `home-${width}.png`), fullPage: true });
      await page.close();
    }
    assert.ok(report.api.length > 0, 'No browser API requests observed');
    assert.ok(report.api.every(r => r.status === 200 && /application\/json/.test(r.type || '')), 'API not 200 JSON');
    assert.equal(report.errors.length, 0, 'Browser errors');
    report.result = 'pass';
  } catch (e) { report.result = 'fail'; report.failure = e.message; throw e; }
  finally { await browser.close(); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
