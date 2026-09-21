/**
 * 接口集成测试：使用开发库，仅插入高位探测文章/期次并在 after 删除，不清空种子。
 */
import assert from 'node:assert/strict'
import { after, afterEach, before, beforeEach, describe, it } from 'node:test'
import { Prisma } from '@prisma/client'
import { prisma } from './db/prisma.js'
import { EXPECTED_CATEGORY_COUNT, LOCALES } from './lib/domainConstants.js'
import { getFrequencyAnalysis } from './services/analysisService.js'
import { getContentDirectory } from './services/contentDirectoryService.js'
import { getLatestDataset } from './services/latestService.js'
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
const DATASET_PROBE_CODES = [
  '9908201', '9908202', '9908203', '9908204',
  '9908301', '9908302', '9908303', '9908304', '9908305', '9908306',
  '9908401', '9908402', '9908403',
] as const
const SCHEDULE_PROBE_CODES = ['9908291', '9908292'] as const

async function deleteProbes() {
  await prisma.article.deleteMany({
    where: { id: { in: [...PROBE_IDS] } },
  })
  await prisma.datasetPeriod.deleteMany({
    where: { periodCode: { in: [...DATASET_PROBE_CODES] } },
  })
  await prisma.datasetSchedule.deleteMany({
    where: { periodCode: { in: [...SCHEDULE_PROBE_CODES] } },
  })
}

async function categoryIdForSeedSlug(slug = 'getting-started'): Promise<number> {
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
    const category = await prisma.category.findUnique({ where: { slug: 'getting-started' } })
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
    const category = await prisma.category.findUnique({ where: { slug: 'getting-started' } })
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

  it('latest returns newest visible period with millis and optional next', async () => {
    const now = new Date('2026-09-21T04:00:00.000Z')
    await prisma.datasetPeriod.create({
      data: {
        periodCode: '9908201',
        releasedAt: new Date('2026-09-20T15:00:00.000Z'),
        value1: 1,
        value2: 2,
        value3: 3,
        value4: 4,
        value5: 5,
        value6: 6,
        extraValue: 8,
        status: 'PUBLISHED',
      },
    })
    await prisma.datasetPeriod.create({
      data: {
        periodCode: '9908202',
        releasedAt: new Date('2026-09-20T14:00:00.000Z'),
        value1: 10,
        value2: 11,
        value3: 12,
        value4: 13,
        value5: 14,
        value6: 15,
        extraValue: 16,
        status: 'PUBLISHED',
      },
    })
    await prisma.datasetSchedule.create({
      data: {
        periodCode: '9908291',
        scheduledAt: new Date('2027-01-01T00:00:00.000Z'),
        status: 'SCHEDULED',
      },
    })
    await prisma.datasetSchedule.create({
      data: {
        periodCode: '9908292',
        scheduledAt: new Date('2027-02-01T00:00:00.000Z'),
        status: 'SCHEDULED',
      },
    })

    const dto = await getLatestDataset(now)
    assert.equal(dto.period_code, '9908201')
    assert.equal(dto.released_at, Date.parse('2026-09-20T15:00:00.000Z'))
    assert.deepEqual(dto.values, [1, 2, 3, 4, 5, 6])
    assert.equal(dto.extra_value, 8)
    assert.equal(dto.next_release?.period_code, '9908291')
    assert.equal(dto.next_release?.scheduled_at, Date.parse('2027-01-01T00:00:00.000Z'))
    assert.equal('_mock_clock' in dto, false)

    const { status, body } = await apiGet(server.baseUrl, '/api/latest')
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const data = asObject(body.data, 'latest.data')
    assert.equal(data.period_code, '9908201')
    assertMillis(data.released_at, 'latest.released_at')
    const nextRelease = asObject(data.next_release, 'latest.next_release')
    assert.equal(nextRelease.period_code, '9908291')
    assertMillis(nextRelease.scheduled_at, 'latest.next_release.scheduled_at')
    assert.equal('_mock_clock' in data, false)
  })

  it('latest ignores hidden periods and past schedules', async () => {
    const now = new Date('2026-09-21T04:00:00.000Z')
    await prisma.datasetPeriod.createMany({
      data: [
        {
          periodCode: '9908201',
          releasedAt: new Date('2026-09-21T03:30:00.000Z'),
          value1: 1,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 7,
          status: 'DRAFT',
        },
        {
          periodCode: '9908202',
          releasedAt: new Date('2026-09-22T00:00:00.000Z'),
          value1: 1,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 8,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908203',
          releasedAt: new Date('2026-09-21T03:45:00.000Z'),
          value1: 1,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 9,
          status: 'ARCHIVED',
        },
      ],
    })
    await prisma.datasetSchedule.create({
      data: {
        periodCode: '9908291',
        scheduledAt: new Date('2026-09-20T00:00:00.000Z'),
        status: 'SCHEDULED',
      },
    })

    const dto = await getLatestDataset(now)
    assert.notEqual(dto.period_code, '9908201')
    assert.notEqual(dto.period_code, '9908202')
    assert.notEqual(dto.period_code, '9908203')
    assert.equal(dto.next_release, null)
  })

  it('latest rejects unknown query with 40000', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/latest?foo=1')
    assert.equal(status, 400)
    assertErrorEnvelope(body, 40000)
  })

  it('latest returns 40402 when no visible period', async () => {
    const published = await prisma.datasetPeriod.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
    })
    const ids = published.map(row => row.id)
    await prisma.datasetPeriod.updateMany({
      where: { id: { in: ids } },
      data: { status: 'DRAFT' },
    })

    try {
      const { status, body } = await apiGet(server.baseUrl, '/api/latest')
      assert.equal(status, 404)
      assertErrorEnvelope(body, 40402)
      assert.equal(body.msg, '数据期次不存在')
    }
    finally {
      await prisma.datasetPeriod.updateMany({
        where: { id: { in: ids } },
        data: { status: 'PUBLISHED' },
      })
    }
  })

  it('latest database failure response does not leak connection details', async () => {
    const secret = 'mysql://probe_user:s3cretPASS@127.0.0.1:3306/content_platform_dev'
    const original = prisma.datasetPeriod.findFirst.bind(prisma.datasetPeriod)
    prisma.datasetPeriod.findFirst = (async () => {
      throw new Prisma.PrismaClientInitializationError(
        `Can't reach database server at \`${secret}\``,
        '6.19.3',
      )
    }) as typeof prisma.datasetPeriod.findFirst

    try {
      const { status, body, text } = await apiGet(server.baseUrl, '/api/latest')
      assert.equal(status, 503)
      assertErrorEnvelope(body, 50300)
      assert.ok(!text.includes(secret))
      assert.ok(!text.includes('s3cretPASS'))
      assert.ok(!/mysql:\/\//i.test(text))
    }
    finally {
      prisma.datasetPeriod.findFirst = original
    }
  })

  it('history returns page with filter_options independent of filters', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/history?page=1&page_size=5')
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const data = asObject(body.data, 'history.data')
    const items = asArray(data.items, 'history.items')
    assert.equal(items.length, 5)
    assert.equal(data.page, 1)
    assert.equal(data.page_size, 5)
    assert.ok(typeof data.total === 'number' && data.total >= 120)
    assert.ok(typeof data.total_pages === 'number' && data.total_pages >= 1)
    for (const item of items) {
      const row = asObject(item, 'history.item')
      assertMillis(row.released_at, 'history.released_at')
      assert.equal('total_sales' in row, false)
    }
    const filterOptions = asObject(data.filter_options, 'filter_options')
    const years = asArray(filterOptions.years, 'years') as number[]
    const periodCodes = asArray(filterOptions.period_codes, 'period_codes') as string[]
    assert.ok(years.includes(2026))
    assert.ok(years.includes(2025))
    assert.deepEqual(years, [...years].sort((a, b) => b - a))
    assert.ok(periodCodes.length <= 120)
    assert.ok(periodCodes.includes('2026090'))

    const filtered = await apiGet(server.baseUrl, '/api/history?period_code=2026090&page=1&page_size=5')
    assert.equal(filtered.status, 200)
    const filteredData = asObject(filtered.body.data, 'filtered')
    assert.equal(filteredData.total, 1)
    const filteredOpts = asObject(filteredData.filter_options, 'filteredOpts')
    assert.deepEqual(filteredOpts.years, filterOptions.years)
    assert.deepEqual(filteredOpts.period_codes, filterOptions.period_codes)
  })

  it('history filters by HK year boundary, number on any of 7 values, and stable sort', async () => {
    // 2025-12-31 23:59:59.999 HK = 2025-12-31T15:59:59.999Z → year 2025
    // 2026-01-01 00:00:00 HK = 2025-12-31T16:00:00.000Z → year 2026
    await prisma.datasetPeriod.createMany({
      data: [
        {
          periodCode: '9908301',
          releasedAt: new Date('2025-12-31T15:59:59.999Z'),
          value1: 47,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 7,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908302',
          releasedAt: new Date('2025-12-31T16:00:00.000Z'),
          value1: 1,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 47,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908303',
          releasedAt: new Date('2026-09-19T12:00:00.000Z'),
          value1: 8,
          value2: 9,
          value3: 10,
          value4: 11,
          value5: 12,
          value6: 13,
          extraValue: 14,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908304',
          releasedAt: new Date('2026-09-19T12:00:00.000Z'),
          value1: 15,
          value2: 16,
          value3: 17,
          value4: 18,
          value5: 19,
          value6: 20,
          extraValue: 21,
          status: 'PUBLISHED',
        },
      ],
    })

    const in2025 = await apiGet(server.baseUrl, '/api/history?year=2025&period_code=9908301')
    assert.equal(asObject(in2025.body.data, 'in2025').total, 1)
    const notIn2026 = await apiGet(server.baseUrl, '/api/history?year=2026&period_code=9908301')
    assert.equal(asObject(notIn2026.body.data, 'notIn2026').total, 0)

    const in2026 = await apiGet(server.baseUrl, '/api/history?year=2026&period_code=9908302')
    assert.equal(asObject(in2026.body.data, 'in2026').total, 1)
    const notIn2025 = await apiGet(server.baseUrl, '/api/history?year=2025&period_code=9908302')
    assert.equal(asObject(notIn2025.body.data, 'notIn2025').total, 0)

    // number matches ordinary slot or extraValue
    const byValue1 = await apiGet(server.baseUrl, '/api/history?number=47&period_code=9908301')
    assert.equal(asObject(byValue1.body.data, 'byValue1').total, 1)
    const byExtra = await apiGet(server.baseUrl, '/api/history?number=47&period_code=9908302')
    assert.equal(asObject(byExtra.body.data, 'byExtra').total, 1)
    const noMatch = await apiGet(server.baseUrl, '/api/history?number=47&period_code=9908303')
    assert.equal(asObject(noMatch.body.data, 'noMatch').total, 0)

    // same recent releasedAt: higher id first (9908304 created after 9908303)
    const sameTime = await apiGet(server.baseUrl, '/api/history?page=1&page_size=5')
    const sameItems = asArray(asObject(sameTime.body.data, 'same').items, 'same.items')
      .map(item => asObject(item, 'r').period_code as string)
    const idx3 = sameItems.indexOf('9908303')
    const idx4 = sameItems.indexOf('9908304')
    assert.ok(idx3 >= 0 && idx4 >= 0)
    assert.ok(idx4 < idx3, 'equal releasedAt sorts by id DESC')
  })

  it('history periods window then paginates; empty and over-page behave correctly', async () => {
    await prisma.datasetPeriod.createMany({
      data: [
        {
          periodCode: '9908301',
          releasedAt: new Date('2026-09-18T10:00:00.000Z'),
          value1: 48,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 7,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908302',
          releasedAt: new Date('2026-09-18T09:00:00.000Z'),
          value1: 48,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 8,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908303',
          releasedAt: new Date('2026-09-18T08:00:00.000Z'),
          value1: 48,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 9,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908304',
          releasedAt: new Date('2026-09-18T07:00:00.000Z'),
          value1: 48,
          value2: 2,
          value3: 3,
          value4: 4,
          value5: 5,
          value6: 6,
          extraValue: 10,
          status: 'PUBLISHED',
        },
      ],
    })

    const page1 = await apiGet(
      server.baseUrl,
      '/api/history?number=48&periods=3&page=1&page_size=2',
    )
    assert.equal(page1.status, 200)
    const p1 = asObject(page1.body.data, 'p1')
    assert.equal(p1.total, 3)
    assert.equal(p1.total_pages, 2)
    const p1Items = asArray(p1.items, 'p1.items').map(i => asObject(i, 'i').period_code)
    assert.deepEqual(p1Items, ['9908301', '9908302'])

    const page2 = await apiGet(
      server.baseUrl,
      '/api/history?number=48&periods=3&page=2&page_size=2',
    )
    const p2Items = asArray(asObject(page2.body.data, 'p2').items, 'p2.items')
      .map(i => asObject(i, 'i').period_code)
    assert.deepEqual(p2Items, ['9908303'])

    const over = await apiGet(
      server.baseUrl,
      '/api/history?number=48&periods=3&page=9&page_size=2',
    )
    const overData = asObject(over.body.data, 'over')
    assert.equal(overData.total, 3)
    assert.equal(asArray(overData.items, 'over.items').length, 0)
    assert.equal(overData.total_pages, 2)

    const empty = await apiGet(server.baseUrl, '/api/history?period_code=9999999')
    const emptyData = asObject(empty.body.data, 'empty')
    assert.equal(emptyData.total, 0)
    assert.equal(emptyData.total_pages, 1)
    assert.equal(asArray(emptyData.items, 'empty.items').length, 0)
  })

  it('history hides draft, future and archived periods', async () => {
    await prisma.datasetPeriod.createMany({
      data: [
        {
          periodCode: '9908301',
          releasedAt: new Date('2026-09-19T12:00:00.000Z'),
          value1: 21,
          value2: 22,
          value3: 23,
          value4: 24,
          value5: 25,
          value6: 26,
          extraValue: 27,
          status: 'DRAFT',
        },
        {
          periodCode: '9908302',
          releasedAt: new Date('2099-01-01T00:00:00.000Z'),
          value1: 21,
          value2: 22,
          value3: 23,
          value4: 24,
          value5: 25,
          value6: 26,
          extraValue: 28,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908303',
          releasedAt: new Date('2026-09-19T11:00:00.000Z'),
          value1: 21,
          value2: 22,
          value3: 23,
          value4: 24,
          value5: 25,
          value6: 26,
          extraValue: 29,
          status: 'ARCHIVED',
        },
      ],
    })

    const { status, body } = await apiGet(server.baseUrl, '/api/history?number=21&page_size=20')
    assert.equal(status, 200)
    const codes = asArray(asObject(body.data, 'vis').items, 'vis.items')
      .map(i => asObject(i, 'i').period_code)
    assert.equal(codes.includes('9908301'), false)
    assert.equal(codes.includes('9908302'), false)
    assert.equal(codes.includes('9908303'), false)
  })

  it('history rejects invalid queries with 40000', async () => {
    const cases = [
      '/api/history?page_size=101',
      '/api/history?year=1999',
      '/api/history?year=2101',
      '/api/history?number=50',
      '/api/history?number=0',
      '/api/history?periods=121',
      '/api/history?page=0',
      '/api/history?period_code=',
      '/api/history?period_code=abc',
      '/api/history?foo=1',
      '/api/history?page=01',
    ]
    for (const path of cases) {
      const { status, body } = await apiGet(server.baseUrl, path)
      assert.equal(status, 400, path)
      assertErrorEnvelope(body, 40000)
    }
  })

  it('analysis default window uses envelope and actual sample size', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/analysis')
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const data = asObject(body.data, 'analysis')
    assert.equal(data.requested_period, 10)
    assert.equal(data.period, 10)
    assert.equal(asArray(data.hot_numbers, 'hot').length, 5)
    assert.equal(asArray(data.cold_numbers, 'cold').length, 5)
  })

  it('analysis over-sample reports the real window', async () => {
    const published = await prisma.datasetPeriod.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
    })
    const ids = published.map(row => row.id)
    await prisma.datasetPeriod.updateMany({
      where: { id: { in: ids } },
      data: { status: 'DRAFT' },
    })
    try {
      await prisma.datasetPeriod.createMany({
        data: [
          {
            periodCode: '9908401',
            releasedAt: new Date('2026-09-19T10:00:00.000Z'),
            value1: 1, value2: 2, value3: 3, value4: 4, value5: 5, value6: 6, extraValue: 7,
            status: 'PUBLISHED',
          },
          {
            periodCode: '9908402',
            releasedAt: new Date('2026-09-19T09:00:00.000Z'),
            value1: 8, value2: 9, value3: 10, value4: 11, value5: 12, value6: 13, extraValue: 14,
            status: 'PUBLISHED',
          },
        ],
      })
      const over = await apiGet(server.baseUrl, '/api/analysis?period=10')
      const overData = asObject(over.body.data, 'over')
      assert.equal(overData.requested_period, 10)
      assert.equal(overData.period, 2)
    }
    finally {
      await prisma.datasetPeriod.deleteMany({
        where: { periodCode: { in: ['9908401', '9908402'] } },
      })
      await prisma.datasetPeriod.updateMany({
        where: { id: { in: ids } },
        data: { status: 'PUBLISHED' },
      })
    }
  })

  it('analysis ignores draft, future and archived rows', async () => {
    const now = new Date('2026-09-20T00:00:00.000Z')
    await prisma.datasetPeriod.createMany({
      data: [
        {
          periodCode: '9908401',
          releasedAt: new Date('2026-09-19T12:00:00.000Z'),
          value1: 41, value2: 42, value3: 43, value4: 44, value5: 45, value6: 46, extraValue: 47,
          status: 'PUBLISHED',
        },
        {
          periodCode: '9908402',
          releasedAt: new Date('2026-09-19T13:00:00.000Z'),
          value1: 31, value2: 32, value3: 33, value4: 34, value5: 35, value6: 36, extraValue: 37,
          status: 'DRAFT',
        },
        {
          periodCode: '9908403',
          releasedAt: new Date('2099-01-01T00:00:00.000Z'),
          value1: 21, value2: 22, value3: 23, value4: 24, value5: 25, value6: 26, extraValue: 27,
          status: 'PUBLISHED',
        },
      ],
    })
    const result = await getFrequencyAnalysis(1, now)
    assert.equal(result.period, 1)
    assert.deepEqual(result.hot_numbers.map(item => item.number), [41, 42, 43, 44, 45])
  })

  it('analysis rejects invalid period queries', async () => {
    for (const path of [
      '/api/analysis?period=121',
      '/api/analysis?period=01',
      '/api/analysis?period=-1',
      '/api/analysis?period=0',
      '/api/analysis?period=',
      '/api/analysis?foo=1',
    ]) {
      const { status, body } = await apiGet(server.baseUrl, path)
      assert.equal(status, 400, path)
      assertErrorEnvelope(body, 40000)
    }
  })

  it('advanced-stats returns full keys and reuses period window rules', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/advanced-stats')
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const data = asObject(body.data, 'advanced')
    assert.equal(data.requested_period, 10)
    assert.equal(data.period, 10)
    const tails = asObject(data.tail_distribution, 'tails')
    assert.deepEqual(Object.keys(tails).sort(), [...'0123456789'])
    const groups = asObject(data.group_distribution, 'groups')
    assert.equal(Object.keys(groups).length, 12)
    assert.ok('G01' in groups && 'G12' in groups)
    const ratio = asObject(data.odd_even_ratio, 'ratio')
    assert.equal(typeof ratio.odd_ratio, 'number')
    const consecutive = asObject(data.consecutive_analysis, 'consecutive')
    assert.equal(consecutive.total_draws, 10)
    assert.ok(Array.isArray(consecutive.consecutive_combinations))
    assert.ok(Array.isArray(data.top_combinations))
  })

  it('advanced-stats rejects invalid period queries', async () => {
    for (const path of [
      '/api/advanced-stats?period=121',
      '/api/advanced-stats?period=01',
      '/api/advanced-stats?period=0',
      '/api/advanced-stats?foo=1',
    ]) {
      const { status, body } = await apiGet(server.baseUrl, path)
      assert.equal(status, 400, path)
      assertErrorEnvelope(body, 40000)
    }
  })

  it('number-miss returns 49 ascending stats inside the success envelope', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/number-miss')
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const data = asObject(body.data, 'miss')
    assert.equal(data.requested_period, 10)
    assert.equal(data.period, 10)
    const stats = asArray(data.number_stats, 'stats')
    assert.equal(stats.length, 49)
    assert.equal(asObject(stats[0], 'first').number, 1)
    assert.equal(asObject(stats[48], 'last').number, 49)
  })

  it('number-miss rejects invalid period queries', async () => {
    for (const path of [
      '/api/number-miss?period=121',
      '/api/number-miss?period=01',
      '/api/number-miss?period=0',
      '/api/number-miss?foo=1',
    ]) {
      const { status, body } = await apiGet(server.baseUrl, path)
      assert.equal(status, 400, path)
      assertErrorEnvelope(body, 40000)
    }
  })

  it('demo combinations are stable, localized and explicitly fixed', async () => {
    const first = await apiGet(server.baseUrl, '/api/demo-combinations')
    const second = await apiGet(server.baseUrl, '/api/demo-combinations')
    assert.equal(first.status, 200)
    assertSuccessEnvelope(first.body)
    assert.deepEqual(first.body.data, second.body.data)

    const data = asObject(first.body.data, 'demo')
    assert.equal(data.source, 'fixed_demo')
    assert.equal(data.is_generated, false)
    assert.equal(data.generated_at, Date.parse('2026-09-17T12:00:00+08:00'))
    const featured = asObject(data.featured, 'featured')
    assert.deepEqual(featured.numbers, [11, 21, 29, 32, 35, 49])

    const items = asArray(data.items, 'items')
    assert.equal(items.length, 5)
    for (const item of items) {
      const row = asObject(item, 'item')
      const numbers = asArray(row.numbers, 'numbers') as number[]
      assert.equal(numbers.length, 6)
      assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b))
      assert.equal(new Set(numbers).size, 6)
      assert.equal(String(row.reason).includes('不是預測'), true)
    }

    const english = await apiGet(server.baseUrl, '/api/demo-combinations?lang=en')
    const englishItems = asArray(asObject(english.body.data, 'en').items, 'items')
    assert.equal(String(asObject(englishItems[0], 'item').reason).includes('not a prediction'), true)

    const simplified = await apiGet(server.baseUrl, '/api/demo-combinations?lang=sc')
    const simplifiedItems = asArray(asObject(simplified.body.data, 'sc').items, 'items')
    assert.equal(String(asObject(simplifiedItems[0], 'item').reason).includes('不是预测'), true)

    for (const path of [
      '/api/demo-combinations?lang=xx',
      '/api/demo-combinations?lang=',
      '/api/demo-combinations?foo=1',
    ]) {
      const invalid = await apiGet(server.baseUrl, path)
      assert.equal(invalid.status, 400, path)
      assertErrorEnvelope(invalid.body, 40000)
    }
  })
})
