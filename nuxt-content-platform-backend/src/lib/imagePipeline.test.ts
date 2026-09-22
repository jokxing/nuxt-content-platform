import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import sharp from 'sharp'
import { DEFAULT_MEDIA_PUBLIC_BASE_URL } from '../config/mediaConfig.js'
import { isTrustedMediaAssetUrl, isValidCoverImage } from './htmlSanitize.js'
import { createObjectKey, processCoverImage, sniffImageMime } from './imagePipeline.js'

describe('imagePipeline', () => {
  it('sniffs jpeg/png/webp and rejects svg', async () => {
    const jpeg = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#336699' },
    }).jpeg().toBuffer()
    assert.equal(sniffImageMime(jpeg), 'image/jpeg')

    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#336699' },
    }).png().toBuffer()
    assert.equal(sniffImageMime(png), 'image/png')

    const webp = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#336699' },
    }).webp().toBuffer()
    assert.equal(sniffImageMime(webp), 'image/webp')

    assert.throws(
      () => sniffImageMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')),
      /SVG/,
    )
  })

  it('re-encodes to webp and creates covers/ key', async () => {
    const jpeg = await sharp({
      create: { width: 40, height: 20, channels: 3, background: '#112233' },
    }).jpeg().toBuffer()
    const out = await processCoverImage(jpeg)
    assert.equal(out.mimeType, 'image/webp')
    assert.equal(out.width, 40)
    assert.equal(out.height, 20)
    assert.ok(out.size > 0)
    assert.match(createObjectKey(), /^covers\/\d{4}\/\d{2}\/[a-f0-9]+\.webp$/)
  })
})

describe('trusted media cover urls', () => {
  const base = DEFAULT_MEDIA_PUBLIC_BASE_URL

  it('accepts relative and trusted media urls; rejects evil hosts', () => {
    assert.equal(isValidCoverImage('/logo.svg'), true)
    assert.equal(isValidCoverImage('/images/a.png'), true)
    assert.equal(
      isTrustedMediaAssetUrl(`${base}/covers/2026/09/abcdef0123456789.webp`, base),
      true,
    )
    assert.equal(
      isTrustedMediaAssetUrl('https://media.example.com.evil.test/covers/2026/09/a.webp', 'https://media.example.com'),
      false,
    )
    assert.equal(isValidCoverImage('https://evil.example/x.webp', base), false)
  })
})
