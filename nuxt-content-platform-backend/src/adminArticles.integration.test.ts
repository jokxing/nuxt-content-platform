import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { randomBytes } from 'node:crypto'
import { prisma } from './db/prisma.js'
import { hashPassword } from './lib/password.js'
import {
  apiGet,
  apiSend,
  asArray,
  asObject,
  assertErrorEnvelope,
  assertMillis,
  assertSuccessEnvelope,
  readSetCookie,
  startTestServer,
  type TestServer,
} from './test/httpHarness.js'

const ORIGIN = 'http://localhost:3670'
const PROBE_PREFIX = 'a4_article_probe_'
const SLUG_PREFIX = 'a4-probe-'

function probeUsername(suffix: string): string {
  return `${PROBE_PREFIX}${suffix}`
}

function probeSlug(suffix: string): string {
  return `${SLUG_PREFIX}${suffix}`
}

async function deleteProbes(): Promise<void> {
  await prisma.buildEvent.deleteMany({ where: { dedupeKey: { startsWith: 'a7-probe-' } } })
  await prisma.auditLog.deleteMany({
    where: { entityType: 'build_event', action: 'BUILD_RETRIED' },
  })
  const articles = await prisma.article.findMany({
    where: { slug: { startsWith: SLUG_PREFIX } },
    select: { id: true },
  })
  const ids = articles.map(row => row.id)
  if (ids.length > 0) {
    await prisma.buildEvent.deleteMany({ where: { articleId: { in: ids } } })
    await prisma.auditLog.deleteMany({
      where: { entityType: 'article', entityId: { in: ids } },
    })
  }
  await prisma.article.deleteMany({
    where: { slug: { startsWith: SLUG_PREFIX } },
  })
  // 测试库中清理已删文章残留的发布相关 outbox / 审计
  await prisma.buildEvent.deleteMany({
    where: {
      reason: { in: ['article_published', 'article_updated', 'article_unpublished'] },
    },
  })
  await prisma.auditLog.deleteMany({
    where: {
      entityType: 'article',
      action: { in: ['ARTICLE_PUBLISHED', 'ARTICLE_UPDATED', 'ARTICLE_UNPUBLISHED', 'ARTICLE_DELETED'] },
    },
  })
  await prisma.adminSession.deleteMany({
    where: { adminUser: { username: { startsWith: PROBE_PREFIX } } },
  })
  await prisma.adminUser.deleteMany({
    where: { username: { startsWith: PROBE_PREFIX } },
  })
}

async function createProbeAdmin(username: string, password: string) {
  return prisma.adminUser.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      displayName: 'A4 探针管理员',
      isActive: true,
    },
  })
}

async function login(server: TestServer, username: string, password: string) {
  const res = await apiSend(server.baseUrl, '/api/admin/auth/login', {
    method: 'POST',
    headers: { Origin: ORIGIN },
    body: { username, password },
  })
  assert.equal(res.status, 200)
  assertSuccessEnvelope(res.body)
  const data = asObject(res.body.data, 'data')
  const cookie = readSetCookie(res.headers, 'cp_admin_session')
  assert.ok(cookie)
  return {
    cookie: `cp_admin_session=${cookie}`,
    csrf: String(data.csrf_token),
  }
}

async function categoryId(slug = 'getting-started'): Promise<number> {
  const category = await prisma.category.findUnique({ where: { slug } })
  assert.ok(category, `seed category ${slug} required`)
  return category.id
}

function emptyTranslations() {
  return {
    'zh-CN': { title: '', content: '' },
    'zh-HK': { title: '', content: '' },
    'en-US': { title: '', content: '' },
  }
}

function fullTranslations() {
  return {
    'zh-CN': { title: '简体标题', content: '<p>简体正文</p>' },
    'zh-HK': { title: '繁體標題', content: '<p>繁體正文</p>' },
    'en-US': { title: 'English title', content: '<p>English body</p>' },
  }
}

function writeBody(slug: string, category_id: number, overrides?: Record<string, unknown>) {
  return {
    slug,
    author: 'A4 Author',
    cover_image: '/logo.svg',
    category_id,
    translations: emptyTranslations(),
    ...overrides,
  }
}

describe('A4 admin articles integration', () => {
  let server: TestServer
  let auth: { cookie: string, csrf: string }
  let catId: number

  before(async () => {
    await deleteProbes()
    server = await startTestServer()
    catId = await categoryId()
    const username = probeUsername(`main_${randomBytes(3).toString('hex')}`)
    const password = `Pw_${randomBytes(6).toString('hex')}`
    await createProbeAdmin(username, password)
    auth = await login(server, username, password)
  })

  after(async () => {
    await deleteProbes()
    await server.close()
  })

  beforeEach(async () => {
    await prisma.article.deleteMany({
      where: { slug: { startsWith: SLUG_PREFIX } },
    })
  })

  it('unauthenticated admin article routes return 40100', async () => {
    const list = await apiGet(server.baseUrl, '/api/admin/articles')
    assert.equal(list.status, 401)
    assertErrorEnvelope(list.body, 40100)

    const categories = await apiGet(server.baseUrl, '/api/admin/categories')
    assert.equal(categories.status, 401)
    assertErrorEnvelope(categories.body, 40100)

    const create = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: { Origin: ORIGIN },
      body: writeBody(probeSlug('unauth'), catId),
    })
    assert.equal(create.status, 401)
    assertErrorEnvelope(create.body, 40100)
  })

  it('lists categories with id and zh-CN name', async () => {
    const { status, body } = await apiGet(server.baseUrl, '/api/admin/categories', {
      headers: { Cookie: auth.cookie },
    })
    assert.equal(status, 200)
    assertSuccessEnvelope(body)
    const data = asObject(body.data, 'data')
    const items = asArray(data.items, 'items')
    assert.equal(items.length, 9)
    const first = asObject(items[0], 'item0')
    assert.equal(typeof first.id, 'number')
    assert.equal(typeof first.slug, 'string')
    assert.equal(typeof first.name, 'string')
    assert.ok(['education', 'analysis', 'story'].includes(String(first.parent_route)))
  })

  it('creates draft with empty translations and does not leak to public API', async () => {
    const slug = probeSlug(`draft-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(created.status, 201)
    assertSuccessEnvelope(created.body)
    const article = asObject(created.body.data, 'data')
    assert.equal(article.slug, slug)
    assert.equal(article.status, 'DRAFT')
    assert.equal(article.version, 1)
    assert.equal(article.published_at, null)
    assert.equal(article.title, '')
    const translations = asObject(article.translations, 'translations')
    assert.equal(asObject(translations['zh-CN'], 'zh-CN').title, '')
    assertMillis(article.created_at, 'created_at')
    assertMillis(article.updated_at, 'updated_at')

    const publicDetail = await apiGet(server.baseUrl, `/api/articles/${article.id}?lang=zh-CN`)
    assert.equal(publicDetail.status, 404)
    assertErrorEnvelope(publicDetail.body, 40401)

    const publicList = await apiGet(server.baseUrl, '/api/articles?lang=zh-CN&page=1&page_size=50')
    assert.equal(publicList.status, 200)
    const listData = asObject(publicList.body.data, 'public.data')
    const items = asArray(listData.items, 'public.items').map(item => asObject(item, 'item'))
    assert.equal(items.some(item => item.id === article.id), false)
  })

  it('rejects write without CSRF and with bad cover/slug', async () => {
    const noCsrf = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
      },
      body: writeBody(probeSlug('nocsrf'), catId),
    })
    assert.equal(noCsrf.status, 403)
    assertErrorEnvelope(noCsrf.body, 40301)

    const badCover = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(probeSlug('badcover'), catId, {
        cover_image: 'https://evil.example/x.png',
      }),
    })
    assert.equal(badCover.status, 400)
    assertErrorEnvelope(badCover.body, 40000)

    const badSlug = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody('Bad_Slug', catId),
    })
    assert.equal(badSlug.status, 400)
    assertErrorEnvelope(badSlug.body, 40000)
  })

  it('rejects duplicate slug with 40902', async () => {
    const slug = probeSlug(`dup-${randomBytes(3).toString('hex')}`)
    const first = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(first.status, 201)

    const second = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(second.status, 409)
    assertErrorEnvelope(second.body, 40902)
  })

  it('optimistic concurrency: second saver gets 40900', async () => {
    const slug = probeSlug(`ver-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, {
        translations: {
          'zh-CN': { title: '初稿', content: '<p>a</p>' },
          'zh-HK': { title: '', content: '' },
          'en-US': { title: '', content: '' },
        },
      }),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const id = article.id
    assert.equal(article.version, 1)

    const firstUpdate = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: {
        ...writeBody(slug, catId, {
          translations: {
            'zh-CN': { title: '第一次保存', content: '<p>b</p>' },
            'zh-HK': { title: '', content: '' },
            'en-US': { title: '', content: '' },
          },
        }),
        version: 1,
      },
    })
    assert.equal(firstUpdate.status, 200)
    assertSuccessEnvelope(firstUpdate.body)
    const updated = asObject(firstUpdate.body.data, 'updated')
    assert.equal(updated.version, 2)
    assert.equal(updated.title, '第一次保存')

    const secondUpdate = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: {
        ...writeBody(slug, catId, {
          translations: {
            'zh-CN': { title: '冲突保存', content: '<p>c</p>' },
            'zh-HK': { title: '', content: '' },
            'en-US': { title: '', content: '' },
          },
        }),
        version: 1,
      },
    })
    assert.equal(secondUpdate.status, 409)
    assertErrorEnvelope(secondUpdate.body, 40900)

    const detail = await apiGet(server.baseUrl, `/api/admin/articles/${id}`, {
      headers: { Cookie: auth.cookie },
    })
    assert.equal(detail.status, 200)
    const latest = asObject(detail.body.data, 'latest')
    assert.equal(latest.version, 2)
    assert.equal(latest.title, '第一次保存')
  })

  it('lists and filters by status/category/q', async () => {
    const slugA = probeSlug(`list-a-${randomBytes(2).toString('hex')}`)
    const slugB = probeSlug(`list-b-${randomBytes(2).toString('hex')}`)
    const skillsId = await categoryId('skills')

    await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slugA, catId, {
        translations: {
          'zh-CN': { title: '过滤关键词甲', content: '' },
          'zh-HK': { title: '', content: '' },
          'en-US': { title: '', content: '' },
        },
      }),
    })
    await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slugB, skillsId, {
        author: 'Other Author',
        translations: {
          'zh-CN': { title: '另一篇', content: '' },
          'zh-HK': { title: '', content: '' },
          'en-US': { title: '', content: '' },
        },
      }),
    })

    const byStatus = await apiGet(
      server.baseUrl,
      '/api/admin/articles?status=DRAFT&page=1&page_size=50',
      { headers: { Cookie: auth.cookie } },
    )
    assert.equal(byStatus.status, 200)
    const statusItems = asArray(asObject(byStatus.body.data, 'd').items, 'items')
      .map(item => asObject(item, 'i'))
    assert.ok(statusItems.some(item => item.slug === slugA))
    assert.ok(statusItems.every(item => item.status === 'DRAFT'))

    const byCategory = await apiGet(
      server.baseUrl,
      '/api/admin/articles?category=skills&page=1&page_size=50',
      { headers: { Cookie: auth.cookie } },
    )
    assert.equal(byCategory.status, 200)
    const categoryItems = asArray(asObject(byCategory.body.data, 'd').items, 'items')
      .map(item => asObject(item, 'i'))
    assert.ok(categoryItems.some(item => item.slug === slugB))
    assert.equal(categoryItems.some(item => item.slug === slugA), false)

    const byQ = await apiGet(
      server.baseUrl,
      `/api/admin/articles?q=${encodeURIComponent('过滤关键词')}&page=1&page_size=50`,
      { headers: { Cookie: auth.cookie } },
    )
    assert.equal(byQ.status, 200)
    const qItems = asArray(asObject(byQ.body.data, 'd').items, 'items')
      .map(item => asObject(item, 'i'))
    assert.ok(qItems.some(item => item.slug === slugA))
    assert.equal(qItems.some(item => item.slug === slugB), false)
  })

  it('sanitizes dangerous HTML on write', async () => {
    const slug = probeSlug(`html-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, {
        translations: {
          'zh-CN': { title: '安全', content: '<p>ok</p><script>alert(1)</script>' },
          'zh-HK': { title: '', content: '' },
          'en-US': { title: '', content: '' },
        },
      }),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const zh = asObject(asObject(article.translations, 't')['zh-CN'], 'zh')
    assert.equal(zh.content, '<p>ok</p>')
    assert.ok(!/script/i.test(String(zh.content)))
  })

  it('missing article returns 40410', async () => {
    const res = await apiGet(server.baseUrl, '/api/admin/articles/2147483646', {
      headers: { Cookie: auth.cookie },
    })
    assert.equal(res.status, 404)
    assertErrorEnvelope(res.body, 40410)
  })

  it('rejects unauthenticated delete with 40100', async () => {
    const res = await apiSend(server.baseUrl, '/api/admin/articles/1', {
      method: 'DELETE',
      headers: { Origin: ORIGIN },
      body: { version: 1 },
    })
    assert.equal(res.status, 401)
    assertErrorEnvelope(res.body, 40100)
  })

  it('rejects delete without CSRF with 40301', async () => {
    const slug = probeSlug(`del-csrf-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)

    const res = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
      },
      body: { version: Number(article.version) },
    })
    assert.equal(res.status, 403)
    assertErrorEnvelope(res.body, 40301)
  })

  it('rejects illegal delete id and body', async () => {
    const badId = await apiSend(server.baseUrl, '/api/admin/articles/0', {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: 1 },
    })
    assert.equal(badId.status, 400)
    assertErrorEnvelope(badId.body, 40000)

    const slug = probeSlug(`del-body-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(created.status, 201)
    const id = Number(asObject(created.body.data, 'data').id)

    const badBody = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: 1, extra: true },
    })
    assert.equal(badBody.status, 400)
    assertErrorEnvelope(badBody.body, 40000)
  })

  it('delete missing article returns 40410', async () => {
    const res = await apiSend(server.baseUrl, '/api/admin/articles/2147483646', {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: 1 },
    })
    assert.equal(res.status, 404)
    assertErrorEnvelope(res.body, 40410)
  })

  it('delete stale version returns 40900', async () => {
    const slug = probeSlug(`del-ver-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)

    const res = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: Number(article.version) + 1 },
    })
    assert.equal(res.status, 409)
    assertErrorEnvelope(res.body, 40900)

    const still = await prisma.article.findUnique({ where: { id } })
    assert.ok(still)
  })

  it('rejects deleting published article with 40901', async () => {
    const slug = probeSlug(`del-pub-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)
    const version = Number(article.version)

    await prisma.article.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    const res = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version },
    })
    assert.equal(res.status, 409)
    assertErrorEnvelope(res.body, 40901)

    const still = await prisma.article.findUnique({ where: { id } })
    assert.ok(still)
    assert.equal(still.status, 'PUBLISHED')
  })

  it('deletes draft and cascades translations; public list unaffected', async () => {
    const slug = probeSlug(`del-draft-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, {
        translations: {
          'zh-CN': { title: '待删草稿', content: '<p>draft</p>' },
          'zh-HK': { title: '待刪', content: '' },
          'en-US': { title: 'to-delete', content: '' },
        },
      }),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)
    const version = Number(article.version)

    const beforeTranslations = await prisma.articleTranslation.count({ where: { articleId: id } })
    assert.equal(beforeTranslations, 3)

    const publicBefore = await apiGet(server.baseUrl, '/api/articles?lang=zh-CN&page=1&page_size=10')
    assert.equal(publicBefore.status, 200)
    const publicTotalBefore = Number(asObject(publicBefore.body.data, 'd').total)

    const deleted = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version },
    })
    assert.equal(deleted.status, 200)
    assertSuccessEnvelope(deleted.body)
    const data = asObject(deleted.body.data, 'data')
    assert.equal(data.id, id)
    assert.equal(data.deleted, true)

    assert.equal(await prisma.article.findUnique({ where: { id } }), null)
    assert.equal(await prisma.articleTranslation.count({ where: { articleId: id } }), 0)

    const publicAfter = await apiGet(server.baseUrl, '/api/articles?lang=zh-CN&page=1&page_size=10')
    assert.equal(publicAfter.status, 200)
    assert.equal(Number(asObject(publicAfter.body.data, 'd').total), publicTotalBefore)
  })

  it('deletes archived article', async () => {
    const slug = probeSlug(`del-arch-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)
    const version = Number(article.version)

    await prisma.article.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    const deleted = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version },
    })
    assert.equal(deleted.status, 200)
    assertSuccessEnvelope(deleted.body)
    assert.equal(await prisma.article.findUnique({ where: { id } }), null)
  })

  it('rejects incomplete publish with 42200 and writes nothing', async () => {
    const slug = probeSlug(`pub-empty-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)

    const res = await apiSend(server.baseUrl, `/api/admin/articles/${id}/publish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: Number(article.version) },
    })
    assert.equal(res.status, 422)
    assertErrorEnvelope(res.body, 42200)

    const still = await prisma.article.findUnique({ where: { id } })
    assert.ok(still)
    assert.equal(still.status, 'DRAFT')
    assert.equal(await prisma.buildEvent.count({ where: { articleId: id } }), 0)
    assert.equal(await prisma.auditLog.count({
      where: { entityType: 'article', entityId: id, action: 'ARTICLE_PUBLISHED' },
    }), 0)
  })

  it('publishes complete article, queues build event, visible on public API', async () => {
    const slug = probeSlug(`pub-ok-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, { translations: fullTranslations() }),
    })
    assert.equal(created.status, 201)
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)
    const version = Number(article.version)

    const publicBefore = await apiGet(server.baseUrl, `/api/articles/${id}?lang=zh-CN`)
    assert.equal(publicBefore.status, 404)

    const published = await apiSend(server.baseUrl, `/api/admin/articles/${id}/publish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version },
    })
    assert.equal(published.status, 200)
    assertSuccessEnvelope(published.body)
    const data = asObject(published.body.data, 'data')
    const outArticle = asObject(data.article, 'article')
    const buildEvent = asObject(data.build_event, 'build_event')
    assert.equal(outArticle.status, 'PUBLISHED')
    assert.equal(Number(outArticle.version), version + 1)
    assertMillis(outArticle.published_at, 'published_at')
    assert.equal(buildEvent.status, 'QUEUED')
    assert.equal(buildEvent.reason, 'article_published')

    const events = await prisma.buildEvent.findMany({ where: { articleId: id } })
    assert.equal(events.length, 1)
    assert.equal(events[0]!.dedupeKey, `article:${id}:version:${version + 1}:ARTICLE_PUBLISHED`)
    assert.equal(await prisma.auditLog.count({
      where: { entityType: 'article', entityId: id, action: 'ARTICLE_PUBLISHED' },
    }), 1)

    const publicAfter = await apiGet(server.baseUrl, `/api/articles/${id}?lang=zh-CN`)
    assert.equal(publicAfter.status, 200)
    assertSuccessEnvelope(publicAfter.body)

    const replay = await apiSend(server.baseUrl, `/api/admin/articles/${id}/publish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version },
    })
    assert.equal(replay.status, 409)
    assertErrorEnvelope(replay.body, 40900)

    const again = await apiSend(server.baseUrl, `/api/admin/articles/${id}/publish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: version + 1 },
    })
    assert.equal(again.status, 409)
    assertErrorEnvelope(again.body, 40901)
    assert.equal(await prisma.buildEvent.count({ where: { articleId: id } }), 1)
    assert.equal(await prisma.auditLog.count({
      where: { entityType: 'article', entityId: id, action: 'ARTICLE_PUBLISHED' },
    }), 1)
  })

  it('unpublishes published article and hides from public API', async () => {
    const slug = probeSlug(`unpub-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, { translations: fullTranslations() }),
    })
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)
    const version = Number(article.version)

    const published = await apiSend(server.baseUrl, `/api/admin/articles/${id}/publish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version },
    })
    assert.equal(published.status, 200)
    const pubData = asObject(published.body.data, 'data')
    const pubArticle = asObject(pubData.article, 'article')

    const unpublished = await apiSend(server.baseUrl, `/api/admin/articles/${id}/unpublish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: Number(pubArticle.version) },
    })
    assert.equal(unpublished.status, 200)
    assertSuccessEnvelope(unpublished.body)
    const data = asObject(unpublished.body.data, 'data')
    const outArticle = asObject(data.article, 'article')
    const buildEvent = asObject(data.build_event, 'build_event')
    assert.equal(outArticle.status, 'ARCHIVED')
    assert.equal(buildEvent.reason, 'article_unpublished')
    assert.equal(buildEvent.status, 'QUEUED')

    const publicAfter = await apiGet(server.baseUrl, `/api/articles/${id}?lang=zh-CN`)
    assert.equal(publicAfter.status, 404)

    const draftUnpub = await apiSend(server.baseUrl, `/api/admin/articles/${id}/unpublish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: Number(outArticle.version) },
    })
    assert.equal(draftUnpub.status, 409)
    assertErrorEnvelope(draftUnpub.body, 40901)
  })

  it('updating published article queues ARTICLE_UPDATED; delete writes audit only', async () => {
    const slug = probeSlug(`upd-pub-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, { translations: fullTranslations() }),
    })
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)

    const published = await apiSend(server.baseUrl, `/api/admin/articles/${id}/publish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: Number(article.version) },
    })
    const pubArticle = asObject(asObject(published.body.data, 'data').article, 'article')
    const pubVersion = Number(pubArticle.version)

    const updated = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, {
        version: pubVersion,
        translations: {
          ...fullTranslations(),
          'zh-CN': { title: '更新后标题', content: '<p>更新后正文</p>' },
        },
      }),
    })
    assert.equal(updated.status, 200)
    assert.equal(await prisma.buildEvent.count({
      where: { articleId: id, eventType: 'ARTICLE_UPDATED' },
    }), 1)

    const unpublished = await apiSend(server.baseUrl, `/api/admin/articles/${id}/unpublish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: Number(asObject(updated.body.data, 'data').version) },
    })
    assert.equal(unpublished.status, 200)
    const archived = asObject(asObject(unpublished.body.data, 'data').article, 'article')

    const deleted = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: Number(archived.version) },
    })
    assert.equal(deleted.status, 200)
    assert.equal(await prisma.auditLog.count({
      where: { entityType: 'article', entityId: id, action: 'ARTICLE_DELETED' },
    }), 1)
    // 删除不新增 BuildEvent（已有 publish/update/unpublish 事件仍可能残留）
    assert.equal(await prisma.buildEvent.count({
      where: { articleId: id, eventType: 'ARTICLE_UPDATED' },
    }), 1)
  })

  it('rejects incomplete update of published article without partial writes', async () => {
    const slug = probeSlug(`upd-pub-empty-${randomBytes(3).toString('hex')}`)
    const created = await apiSend(server.baseUrl, '/api/admin/articles', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, { translations: fullTranslations() }),
    })
    const article = asObject(created.body.data, 'data')
    const id = Number(article.id)

    const published = await apiSend(server.baseUrl, `/api/admin/articles/${id}/publish`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: { version: Number(article.version) },
    })
    const publishedArticle = asObject(asObject(published.body.data, 'data').article, 'article')
    const publishedVersion = Number(publishedArticle.version)
    const eventCountBefore = await prisma.buildEvent.count({ where: { articleId: id } })
    const auditCountBefore = await prisma.auditLog.count({
      where: { entityType: 'article', entityId: id },
    })

    const rejected = await apiSend(server.baseUrl, `/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
      body: writeBody(slug, catId, {
        version: publishedVersion,
        translations: {
          ...fullTranslations(),
          'en-US': { title: 'English title', content: '' },
        },
      }),
    })
    assert.equal(rejected.status, 422)
    assertErrorEnvelope(rejected.body, 42200)

    const unchanged = await prisma.article.findUnique({
      where: { id },
      include: { translations: true },
    })
    assert.ok(unchanged)
    assert.equal(unchanged.status, 'PUBLISHED')
    assert.equal(unchanged.version, publishedVersion)
    assert.equal(
      unchanged.translations.find(item => item.locale === 'en-US')?.content,
      '<p>English body</p>',
    )
    assert.equal(await prisma.buildEvent.count({ where: { articleId: id } }), eventCountBefore)
    assert.equal(await prisma.auditLog.count({
      where: { entityType: 'article', entityId: id },
    }), auditCountBefore)

    const publicAfter = await apiGet(server.baseUrl, `/api/articles/${id}?lang=en-US`)
    assert.equal(publicAfter.status, 200)
    assertSuccessEnvelope(publicAfter.body)
  })

  it('lists real deployment events and requeues only failed event', async () => {
    const failed = await prisma.buildEvent.create({
      data: {
        eventType: 'ARTICLE_UPDATED',
        reason: 'manual',
        status: 'FAILED',
        dedupeKey: `a7-probe-${randomBytes(6).toString('hex')}`,
        attempts: 1,
        errorSummary: 'github_actions_failure',
        finishedAt: new Date(),
      },
    })

    const unauthenticated = await apiGet(server.baseUrl, '/api/admin/deployments')
    assert.equal(unauthenticated.status, 401)
    assertErrorEnvelope(unauthenticated.body, 40100)

    const listed = await apiGet(
      server.baseUrl,
      '/api/admin/deployments?status=FAILED&reason=manual&page=1&page_size=20',
      { headers: { Cookie: auth.cookie } },
    )
    assert.equal(listed.status, 200)
    assertSuccessEnvelope(listed.body)
    const listData = asObject(listed.body.data, 'data')
    const listItems = asArray(listData.items, 'items').map(item => asObject(item, 'item'))
    assert.ok(listItems.some(item => item.id === failed.id && item.status === 'FAILED'))

    const retried = await apiSend(server.baseUrl, `/api/admin/deployments/${failed.id}/retry`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
    })
    assert.equal(retried.status, 200)
    assertSuccessEnvelope(retried.body)
    const retryData = asObject(retried.body.data, 'data')
    assert.equal(retryData.status, 'QUEUED')
    assert.equal(retryData.attempts, 1)
    assert.equal(retryData.error_summary, null)
    assert.equal(await prisma.buildEvent.count({ where: { id: failed.id } }), 1)
    assert.equal(await prisma.auditLog.count({
      where: { entityType: 'build_event', entityId: failed.id, action: 'BUILD_RETRIED' },
    }), 1)

    const repeated = await apiSend(server.baseUrl, `/api/admin/deployments/${failed.id}/retry`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'X-CSRF-Token': auth.csrf,
      },
    })
    assert.equal(repeated.status, 409)
    assertErrorEnvelope(repeated.body, 40901)
  })
})
