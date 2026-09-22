import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { prisma } from './db/prisma.js'
import { DEFAULT_MEDIA_PUBLIC_BASE_URL } from './config/mediaConfig.js'
import { hashPassword } from './lib/password.js'
import {
  apiGet,
  apiSend,
  asObject,
  assertErrorEnvelope,
  assertSuccessEnvelope,
  readSetCookie,
  startTestServer,
  type TestServer,
} from './test/httpHarness.js'

const ORIGIN = 'http://localhost:3670'
const PROBE_PREFIX = 'a53_media_probe_'
const MEDIA_BASE = process.env.MEDIA_PUBLIC_BASE_URL || DEFAULT_MEDIA_PUBLIC_BASE_URL

function probeUsername(suffix: string): string {
  return `${PROBE_PREFIX}${suffix}`
}

async function deleteProbes(): Promise<void> {
  await prisma.mediaAsset.deleteMany({
    where: { adminUser: { username: { startsWith: PROBE_PREFIX } } },
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
      displayName: 'A53 媒体探针',
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

async function makeJpeg(width = 32, height = 32): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 20, g: 120, b: 200 },
    },
  }).jpeg().toBuffer()
}

function multipartBody(file: Buffer, filename: string, mime: string, field = 'file') {
  const boundary = `----cpBoundary${randomBytes(8).toString('hex')}`
  const head = Buffer.from(
    `--${boundary}\r\n`
    + `Content-Disposition: form-data; name="${field}"; filename="${filename}"\r\n`
    + `Content-Type: ${mime}\r\n\r\n`,
  )
  const mid = Buffer.from('\r\n')
  const tail = Buffer.from(`--${boundary}--\r\n`)
  return {
    body: Buffer.concat([head, file, mid, tail]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

async function upload(
  server: TestServer,
  auth: { cookie: string, csrf: string },
  file: Buffer,
  filename: string,
  mime: string,
) {
  const part = multipartBody(file, filename, mime)
  return apiSend(server.baseUrl, '/api/admin/media/images', {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      Cookie: auth.cookie,
      'X-CSRF-Token': auth.csrf,
      'Content-Type': part.contentType,
    },
    body: part.body,
  })
}

describe('A5.3 admin media upload integration', () => {
  let server: TestServer
  let auth: { cookie: string, csrf: string }

  before(async () => {
    await deleteProbes()
    server = await startTestServer()
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
    await prisma.mediaAsset.deleteMany({
      where: { adminUser: { username: { startsWith: PROBE_PREFIX } } },
    })
  })

  it('rejects unauthenticated upload with 40100', async () => {
    const jpeg = await makeJpeg()
    const part = multipartBody(jpeg, 'a.jpg', 'image/jpeg')
    const res = await apiSend(server.baseUrl, '/api/admin/media/images', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        'Content-Type': part.contentType,
      },
      body: part.body,
    })
    assert.equal(res.status, 401)
    assertErrorEnvelope(res.body, 40100)
  })

  it('rejects upload without CSRF with 40301', async () => {
    const jpeg = await makeJpeg()
    const part = multipartBody(jpeg, 'a.jpg', 'image/jpeg')
    const res = await apiSend(server.baseUrl, '/api/admin/media/images', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: auth.cookie,
        'Content-Type': part.contentType,
      },
      body: part.body,
    })
    assert.equal(res.status, 403)
    assertErrorEnvelope(res.body, 40301)
  })

  it('uploads jpeg and returns webp media asset (201)', async () => {
    const jpeg = await makeJpeg(64, 48)
    const res = await upload(server, auth, jpeg, 'cover.jpg', 'image/jpeg')
    assert.equal(res.status, 201)
    assertSuccessEnvelope(res.body)
    const data = asObject(res.body.data, 'data')
    assert.equal(data.mime_type, 'image/webp')
    assert.equal(typeof data.id, 'number')
    assert.ok(String(data.key).startsWith('covers/'))
    assert.ok(String(data.url).startsWith(`${MEDIA_BASE}/covers/`))
    assert.ok(Number(data.width) > 0)
    assert.ok(Number(data.height) > 0)
    assert.ok(Number(data.size) > 0)

    const served = await apiGet(server.baseUrl, `/media/${String(data.key)}`, { expectJson: false })
    assert.equal(served.status, 200)
    assert.ok((served.rawBody?.length || 0) > 20)
  })

  it('rejects svg disguised as jpeg', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>')
    const res = await upload(server, auth, svg, 'x.jpg', 'image/jpeg')
    assert.equal(res.status, 400)
    assertErrorEnvelope(res.body, 40000)
  })

  it('rejects oversize payload with 41300', async () => {
    const jpegHead = await makeJpeg()
    const padded = Buffer.concat([jpegHead, Buffer.alloc(5 * 1024 * 1024)])
    const res = await upload(server, auth, padded, 'big.jpg', 'image/jpeg')
    assert.equal(res.status, 413)
    assertErrorEnvelope(res.body, 41300)
  })

  it('rejects path traversal on public media route', async () => {
    const res = await apiGet(server.baseUrl, '/media/covers/../../package.json', { expectJson: false })
    assert.equal(res.status, 404)
  })
})
