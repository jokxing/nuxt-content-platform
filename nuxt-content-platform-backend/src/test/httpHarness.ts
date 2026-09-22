import http from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Express } from 'express'
import { createApp } from '../app.js'
import { loadEnv } from '../config/env.js'
import { connectDatabase, disconnectDatabase } from '../db/prisma.js'

export type TestServer = {
  baseUrl: string
  close: () => Promise<void>
}

export type JsonObject = Record<string, unknown>

/** 启动可请求的临时 HTTP 服务（随机端口），不占用固定 4000。 */
export async function startTestServer(): Promise<TestServer> {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    ADMIN_ALLOWED_ORIGINS: process.env.ADMIN_ALLOWED_ORIGINS || 'http://localhost:3670',
    ADMIN_ALLOW_MISSING_ORIGIN: process.env.ADMIN_ALLOW_MISSING_ORIGIN || 'false',
    ADMIN_COOKIE_SECURE: process.env.ADMIN_COOKIE_SECURE || 'false',
  })
  await connectDatabase()
  const app: Express = createApp(env)
  const server = http.createServer(app)

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address() as AddressInfo
  const baseUrl = `http://127.0.0.1:${address.port}`

  return {
    baseUrl,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()))
      })
      await disconnectDatabase()
    },
  }
}

export async function apiGet(baseUrl: string, path: string, init?: {
  headers?: Record<string, string>
}): Promise<{
  status: number
  body: JsonObject
  text: string
  headers: Headers
}> {
  const response = await fetch(`${baseUrl}${path}`, init?.headers
    ? { headers: init.headers }
    : undefined)
  const text = await response.text()
  const parsed: unknown = text ? JSON.parse(text) : null
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`expected JSON object from ${path}`)
  }
  return {
    status: response.status,
    body: parsed as JsonObject,
    text,
    headers: response.headers,
  }
}

export async function apiSend(
  baseUrl: string,
  path: string,
  options: {
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    headers?: Record<string, string>
  },
): Promise<{
  status: number
  body: JsonObject
  text: string
  headers: Headers
}> {
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  }
  const init: RequestInit = {
    method: options.method,
    headers,
  }
  if (options.body !== undefined) {
    headers['content-type'] = headers['content-type'] || 'application/json'
    init.body = JSON.stringify(options.body)
  }
  const response = await fetch(`${baseUrl}${path}`, init)
  const text = await response.text()
  const parsed: unknown = text ? JSON.parse(text) : null
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`expected JSON object from ${path}`)
  }
  return {
    status: response.status,
    body: parsed as JsonObject,
    text,
    headers: response.headers,
  }
}

export function readSetCookie(headers: Headers, cookieName: string): string | null {
  const anyHeaders = headers as Headers & { getSetCookie?: () => string[] }
  const lines = typeof anyHeaders.getSetCookie === 'function'
    ? anyHeaders.getSetCookie()
    : [headers.get('set-cookie')].filter((value): value is string => Boolean(value))
  for (const line of lines) {
    const first = line.split(';', 1)[0] || ''
    const eq = first.indexOf('=')
    if (eq <= 0)
      continue
    const name = first.slice(0, eq).trim()
    if (name !== cookieName)
      continue
    return decodeURIComponent(first.slice(eq + 1))
  }
  return null
}

export function assertSuccessEnvelope(body: JsonObject) {
  if (body.code !== 0)
    throw new Error(`expected code 0, got ${String(body.code)}`)
  if (typeof body.msg !== 'string')
    throw new Error('expected msg string')
  if (!('data' in body))
    throw new Error('expected data')
  if ('requestId' in body && body.requestId != null)
    throw new Error('success envelope must not include requestId')
}

export function assertErrorEnvelope(body: JsonObject, code: number) {
  if (body.code !== code)
    throw new Error(`expected code ${code}, got ${String(body.code)}`)
  if (typeof body.msg !== 'string' || !body.msg)
    throw new Error('expected msg')
  if (body.data !== null)
    throw new Error('expected data null')
  if (typeof body.requestId !== 'string' || !body.requestId)
    throw new Error('expected requestId')
}

export function assertMillis(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1e12 || value > 1e14) {
    throw new Error(`${label} must be 13-digit unix millis, got ${String(value)}`)
  }
}

export function asObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label} must be object`)
  return value as JsonObject
}

export function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value))
    throw new Error(`${label} must be array`)
  return value
}
