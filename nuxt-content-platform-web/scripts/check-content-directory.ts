import assert from 'node:assert/strict'
import { MOCK_ARTICLES } from '../app/mock/data/catalog'
import { createContentDirectory } from './content-directory'
import { renderSitemap } from './sitemap-content'

const original = createContentDirectory(MOCK_ARTICLES)
assert.equal(original.length, 75)
assert.equal(new Set(original.map(route => route.path)).size, 75)
assert.equal(original.filter(route => route.sitemap).length, 66)
const added = { ...MOCK_ARTICLES[0]!, id: 106, parent_route: 'story' }
const expanded = createContentDirectory([...MOCK_ARTICLES, added])
assert.equal(expanded.length, original.length + 3)
const xml = renderSitemap(expanded, 'https://example.test/')
for (const prefix of ['', '/zh-CN', '/en-US']) {
  assert.ok(xml.includes(`<loc>https://example.test${prefix}/news/story/article/106</loc>`))
  assert.ok(expanded.some(route => route.path === `${prefix}/news/story/article/106`))
}
assert.ok(!xml.includes('/news/detail/'))
assert.ok(xml.includes('/news/story/type/1'))
assert.ok(xml.includes('<lastmod>2026-09-10</lastmod>'))
assert.deepEqual(createContentDirectory([...MOCK_ARTICLES, { ...added, status: 0 }]), original)
assert.throws(() => createContentDirectory([...MOCK_ARTICLES, MOCK_ARTICLES[0]!]), /duplicate/)
assert.throws(() => createContentDirectory([{ ...added, parent_route: '../invalid' }]), /category/)
assert.throws(() => createContentDirectory([{ ...added, publish_date: '2026-02-30' }]), /date/)
assert.throws(() => createContentDirectory([{ ...added, publish_date: 123 }]), /timestamp|date/)
assert.ok(createContentDirectory([{ ...added, id: 107, publish_date: 1789005600000 }]).some(route => route.lastmod === '2026-09-10'))
for (const url of ['ftp://example.test', 'https://user:secret@example.test', 'https://example.test/sub', 'https://example.test/?q=1'])
  assert.throws(() => renderSitemap(original, url))
assert.throws(() => renderSitemap([...original, original[0]!], 'https://example.test'), /Duplicate/)
assert.ok(renderSitemap([{ path: '/a&b', sitemap: true }], 'https://example.test').includes('/a&amp;b'))
assert.equal(renderSitemap(original, 'https://example.test'), renderSitemap(original, 'https://example.test/'))
console.log('PASS: shared routes, three-language article additions, drafts, validation, XML escaping and deterministic output')
