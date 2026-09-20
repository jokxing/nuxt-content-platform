/**
 * 接口集成测试：使用开发库，仅插入高位探测文章并在 after 删除，不清空种子 101–105。
 */
import assert from 'node:assert/strict'
import { after, afterEach, before, beforeEach, describe, it } from 'node:test'
import { Prisma } from '@prisma/client'
import { prisma } from './db/prisma.js'
import { EXPECTED_CATEGORY_COUNT, LOCALES } from './lib/domainConstants.js'
import { getContentDirectory } from './services/contentDirectoryService.js'
import {
  apiGet,
  asArray,
  asObject,
  assertErrorEnvelope,
  assertMillis,
  assertSuccessEnvelope,
  startTestServer,
  type TestServer,
} from './test/httpHarness.js'

const PROBE_IDS = [990301, 990302, 990303, 990304] as const

async function deleteProbes() {
  await prisma.article.deleteMany({
    where: { id: { in: [...PROBE_IDS] } },
  })
}

async function categoryIdForSeedSlug(slug = 'how-to-play'): Promise<number> {
  const category = await prisma.category.findUnique({ where: { slug } })
  assert.ok(category, `seed category ${slug} required`)
  return category.id
}

async function createProbeArticle(opts: {
  id: number
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: Date | null
  locales: readonly string[]
  content?: string
}) {
  const categoryId = await categoryIdForSeedSlug()
  await prisma.article.create({
    data: {
      id: opts.id,
      slug: `b72-probe-${opts.id}`,
      categoryId,
      author: 'B72 Probe',
      coverImage: '/logo.svg',
      status: opts.status,
      publishedAt: opts.publishedAt,
      translations: {
        create: opts.locales.map(locale => ({
          locale,
          title: `Probe ${opts.id} ${locale}`,
          content: opts.content ?? `<p>probe ${opts.id} ${locale}</p>`,
        })),
      },
    },
  })
}

describe('API integration', () => {
  let server: TestServer

  before(async () => {
    await deleteProbes()
    server = await startTestServer()
  })

  after(async () => {
    await deleteProbes()
    await server.close()
  })

  beforeEach(async () => {
    await deleteProbes()
  })

  afterEach(async () => {
    await deleteProbes()
  })

  it('health success envelope', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/health')
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const data = asObject(body.data, 'health.data')
    assert.equal(data.status, 'ok')
    assert.equal(data.database, 'up')
  })

  it('invalid query returns 40000 with requestId', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/articles?lang=xx')
    assert.equal(status, 400)
    assertErrorEnvelope(body, 40000)
  })

  it('unknown route returns 40400', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/not-a-real-route')
    assert.equal(status, 404)
    assertErrorEnvelope(body, 40400)
  })

  it('list and detail share DTO fields with millis publish_date', async () => {
    const list = await apiGet(server.baseUrl, '/api/articles?lang=zh-CN&page=1&page_size=50')
    assert.equal(list.status, 200)
    assertSuccessEnvelope(list.body)
    const listData = asObject(list.body.data, 'list.data')
    const items = asArray(listData.items, 'list.items')
    const seed = items
      .map(item => asObject(item, 'list.item'))
      .find(item => item.id === 101)
    assert.ok(seed, 'seed article 101 should be visible')

    const detail = await apiGet(server.baseUrl, '/api/articles/101?lang=zh-CN')
    assert.equal(detail.status, 200)
    assertSuccessEnvelope(detail.body)
    const detailData = asObject(detail.body.data, 'detail.data')

    const keys = [
      'id',
      'title',
      'slug',
      'content',
      'publish_date',
      'author',
      'cover_image',
      'status',
      'category',
      'category_slug',
      'parent_route',
    ] as const
    for (const key of keys) {
      assert.equal(detailData[key], seed[key], `mismatch on ${key}`)
    }
    assertMillis(seed.publish_date, 'list.publish_date')
    assertMillis(detailData.publish_date, 'detail.publish_date')
    assert.equal(detailData.publish_date, 1789005600000)
  })

  it('draft, future, and incomplete translations are invisible', async () => {
    const past = new Date('2020-01-01T00:00:00.000Z')
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await createProbeArticle({
      id: 990301,
      status: 'DRAFT',
      publishedAt: past,
      locales: LOCALES,
    })
    await createProbeArticle({
      id: 990302,
      status: 'PUBLISHED',
      publishedAt: future,
      locales: LOCALES,
    })
    await createProbeArticle({
      id: 990303,
      status: 'PUBLISHED',
      publishedAt: past,
      locales: ['zh-HK', 'zh-CN'],
    })
    await createProbeArticle({
      id: 990304,
      status: 'PUBLISHED',
      publishedAt: past,
      locales: LOCALES,
    })

    const list = await apiGet(server.baseUrl, '/api/articles?lang=zh-HK&page=1&page_size=50')
    assert.equal(list.status, 200)
    assertSuccessEnvelope(list.body)
    const listData = asObject(list.body.data, 'list.data')
    const ids = new Set(
      asArray(listData.items, 'list.items')
        .map(item => asObject(item, 'item').id),
    )
    assert.equal(ids.has(990301), false)
    assert.equal(ids.has(990302), false)
    assert.equal(ids.has(990303), false)
    assert.equal(ids.has(990304), true)

    for (const id of [990301, 990302, 990303]) {
      const res = await apiGet(server.baseUrl, `/api/articles/${id}?lang=zh-HK`)
      assert.equal(res.status, 404)
      assertErrorEnvelope(res.body, 40401)
    }

    const visible = await apiGet(server.baseUrl, '/api/articles/990304?lang=zh-HK')
    assert.equal(visible.status, 200)
    assertSuccessEnvelope(visible.body)

    const directory = await apiGet(server.baseUrl, '/api/content-directory')
    assert.equal(directory.status, 200)
    assertSuccessEnvelope(directory.body)
    const dirData = asObject(directory.body.data, 'directory.data')
    assertMillis(dirData.generated_at, 'generated_at')
    const dirItems = asArray(dirData.articles, 'directory.articles').map(item => asObject(item, 'dir.item'))
    const dirIds = dirItems.map(item => item.id as number)
    assert.deepEqual(dirIds, [...dirIds].sort((a, b) => a - b))
    assert.equal(dirIds.includes(990301), false)
    assert.equal(dirIds.includes(990302), false)
    assert.equal(dirIds.includes(990303), false)
    assert.equal(dirIds.includes(990304), true)
    for (const item of dirItems) {
      assertMillis(item.publish_date, `directory[${String(item.id)}].publish_date`)
      assert.equal(item.status, 1)
    }
  })

  it('content-directory limit exceeded returns 50301 via service hook', async () => {
    await assert.rejects(
      () => getContentDirectory(new Date(), { limit: 1 }),
      (err: unknown) => {
        if (!(err instanceof Error))
          return false
        const appErr = err as Error & { code?: number, statusCode?: number }
        return appErr.code === 50301 && appErr.statusCode === 503
      },
    )
  })

  it('categories returns exactly nine items for request locale', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/categories?lang=zh-CN')
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const items = asArray(body.data, 'categories')
    assert.equal(items.length, EXPECTED_CATEGORY_COUNT)
  })

  it('categories missing locale translation returns 50001 without silent omission', async () => {
    const category = await prisma.category.findUnique({ where: { slug: 'how-to-play' } })
    assert.ok(category)
    const existing = await prisma.categoryTranslation.findUnique({
      where: { categoryId_locale: { categoryId: category.id, locale: 'zh-CN' } },
    })
    assert.ok(existing)

    await prisma.categoryTranslation.delete({
      where: { categoryId_locale: { categoryId: category.id, locale: 'zh-CN' } },
    })

    try {
      const { status, body } = await apiGet(server.baseUrl, '/api/categories?lang=zh-CN')
      assert.equal(status, 500)
      assertErrorEnvelope(body, 50001)
      assert.equal(body.msg, '分类数据不完整')
      assert.ok(!Array.isArray(body.data))
    }
    finally {
      await prisma.categoryTranslation.create({
        data: {
          categoryId: category.id,
          locale: 'zh-CN',
          name: existing.name,
        },
      })
    }

    const restored = await apiGet(server.baseUrl, '/api/categories?lang=zh-CN')
    assert.equal(restored.status, 200)
    assertSuccessEnvelope(restored.body)
    assert.equal(asArray(restored.body.data, 'categories').length, EXPECTED_CATEGORY_COUNT)
  })

  it('categories with an invalid route mapping returns 50001', async () => {
    const category = await prisma.category.findUnique({ where: { slug: 'how-to-play' } })
    assert.ok(category)
    await prisma.category.update({
      where: { id: category.id },
      data: { parentRoute: 'story' },
    })

    try {
      const { status, body } = await apiGet(server.baseUrl, '/api/categories?lang=zh-CN')
      assert.equal(status, 500)
      assertErrorEnvelope(body, 50001)
    }
    finally {
      await prisma.category.update({
        where: { id: category.id },
        data: { parentRoute: category.parentRoute },
      })
    }
  })

  it('oversized article HTML returns 50001 instead of malformed markup', async () => {
    await createProbeArticle({
      id: 990304,
      status: 'PUBLISHED',
      publishedAt: new Date('2020-01-01T00:00:00.000Z'),
      locales: LOCALES,
      content: `<p>${'a'.repeat(100_001)}</p>`,
    })

    const { status, body } = await apiGet(server.baseUrl, '/api/articles/990304?lang=zh-CN')
    assert.equal(status, 500)
    assertErrorEnvelope(body, 50001)
  })

  it('database failure response does not leak connection details', async () => {
    const secret = 'mysql://probe_user:s3cretPASS@127.0.0.1:3306/content_platform_dev'
    const original = prisma.$queryRaw.bind(prisma)
    const brokenQueryRaw = (async () => {
      throw new Prisma.PrismaClientInitializationError(
        `Can't reach database server at \`${secret}\``,
        '6.19.3',
      )
    }) as typeof prisma.$queryRaw
    prisma.$queryRaw = brokenQueryRaw

    try {
      const { status, body, text } = await apiGet(server.baseUrl, '/health')
      assert.equal(status, 503)
      assertErrorEnvelope(body, 50300)
      assert.equal(body.msg, '服务暂不可用')
      assert.ok(!text.includes(secret))
      assert.ok(!text.includes('s3cretPASS'))
      assert.ok(!/mysql:\/\//i.test(text))
    }
    finally {
      prisma.$queryRaw = original
    }
  })
})
