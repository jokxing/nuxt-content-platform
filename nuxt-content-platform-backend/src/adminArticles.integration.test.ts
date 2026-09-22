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
  await prisma.article.deleteMany({
    where: { slug: { startsWith: SLUG_PREFIX } },
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
})
