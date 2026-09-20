import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isSafeHref, normalizeCoverImage, sanitizeArticleHtml } from './htmlSanitize.js'

describe('sanitizeArticleHtml', () => {
  it('keeps allowed tags from seed-like content', () => {
    const html = '<p>本篇介绍讯览演示站的数据面板结构、<strong>筛选</strong>与图例含义。</p>'
    assert.equal(sanitizeArticleHtml(html), html)
  })

  it('strips script tags regardless of case', () => {
    const out = sanitizeArticleHtml('<p>ok</p><ScRiPt>alert(1)</sCrIpT><p>end</p>')
    assert.equal(out, '<p>ok</p><p>end</p>')
    assert.ok(!/script/i.test(out))
  })

  it('strips event attributes', () => {
    const out = sanitizeArticleHtml('<p onclick="alert(1)" onmouseover="x()">hi</p>')
    assert.equal(out, '<p>hi</p>')
  })

  it('rejects javascript and data URLs on anchors', () => {
    assert.equal(
      sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>'),
      '<a>x</a>',
    )
    assert.equal(
      sanitizeArticleHtml('<a href="JAVASCRIPT:alert(1)">x</a>'),
      '<a>x</a>',
    )
    assert.equal(
      sanitizeArticleHtml('<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>'),
      '<a>x</a>',
    )
  })

  it('rejects protocol-relative and path-traversal hrefs', () => {
    assert.equal(sanitizeArticleHtml('<a href="//evil.example/x">x</a>'), '<a>x</a>')
    assert.equal(sanitizeArticleHtml('<a href="/images/../../etc/passwd">x</a>'), '<a>x</a>')
  })

  it('keeps safe relative, https and mailto links', () => {
    assert.equal(
      sanitizeArticleHtml('<a href="/news/education">go</a>'),
      '<a href="/news/education">go</a>',
    )
    assert.equal(
      sanitizeArticleHtml('<a href="https://example.com/a">go</a>'),
      '<a href="https://example.com/a">go</a>',
    )
    assert.equal(
      sanitizeArticleHtml('<a href="mailto:demo@example.com">mail</a>'),
      '<a href="mailto:demo@example.com">mail</a>',
    )
  })

  it('strips nested dangerous tags and SVG/MathML', () => {
    const out = sanitizeArticleHtml(
      '<p>safe<svg onload="alert(1)"><script>1</script></svg><math><mi>x</mi></math></p>',
    )
    assert.ok(!/<svg|<math|<script|<mi/i.test(out))
    assert.ok(out.includes('safe'))
  })

  it('handles entity-encoded and incomplete tags without reintroducing script', () => {
    const encoded = sanitizeArticleHtml('<p>&#60;script&#62;alert(1)&#60;/script&#62;</p>')
    assert.ok(!/<script/i.test(encoded))
    const incomplete = sanitizeArticleHtml('<p>a<script src=x>evil</script><b>b</b></p>')
    assert.ok(!/<script/i.test(incomplete))
    assert.ok(!/evil/i.test(incomplete))
    assert.ok(incomplete.includes('<b>b</b>'))
  })

  it('strips iframe/object/style/meta and disallowed tags', () => {
    const out = sanitizeArticleHtml(
      '<p>x</p><iframe src="https://x"></iframe><object data="x"></object><style>body{}</style><h1>no</h1>',
    )
    assert.equal(out, '<p>x</p>no')
  })

  it('does not cut sanitized HTML in the middle of a tag', () => {
    const huge = `<p>${'a'.repeat(100_050)}</p>`
    const out = sanitizeArticleHtml(huge)
    assert.ok(out.endsWith('</p>'))
    assert.equal(out, huge)
  })
})

describe('isSafeHref', () => {
  it('accepts expected safe forms only', () => {
    assert.equal(isSafeHref('/images/a.png'), true)
    assert.equal(isSafeHref('https://a.test'), true)
    assert.equal(isSafeHref('http://a.test'), true)
    assert.equal(isSafeHref('mailto:a@b.c'), true)
    assert.equal(isSafeHref('javascript:alert(1)'), false)
    assert.equal(isSafeHref('//evil'), false)
    assert.equal(isSafeHref('/a/../b'), false)
  })
})

describe('normalizeCoverImage', () => {
  it('keeps logo and /images paths, falls back otherwise', () => {
    assert.equal(normalizeCoverImage('/logo.svg'), '/logo.svg')
    assert.equal(normalizeCoverImage('/images/cover.png'), '/images/cover.png')
    assert.equal(normalizeCoverImage('/images/../x.png'), '/logo.svg')
    assert.equal(normalizeCoverImage('https://evil/x.png'), '/logo.svg')
    assert.equal(normalizeCoverImage('/other/x.png'), '/logo.svg')
  })
})
