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

export async function apiGet(baseUrl: string, path: string): Promise<{
  status: number
  body: JsonObject
  text: string
}> {
  const response = await fetch(`${baseUrl}${path}`)
  const text = await response.text()
  const parsed: unknown = text ? JSON.parse(text) : null
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`expected JSON object from ${path}`)
  }
  return { status: response.status, body: parsed as JsonObject, text }
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
