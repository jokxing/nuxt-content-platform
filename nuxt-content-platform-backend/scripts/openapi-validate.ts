/**
 * 校验 docs/backend/openapi.json 为可解析的 OpenAPI 3.0 文档（含 $ref）。
 * 不启动服务、不连库、不打印凭据。
 */
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import SwaggerParser from '@apidevtools/swagger-parser'

const openapiPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/backend/openapi.json',
)

const api = await SwaggerParser.validate(openapiPath) as {
  openapi?: string
  paths?: Record<string, unknown>
  components?: { schemas?: Record<string, { properties?: Record<string, unknown>, enum?: number[] }> }
}

assert.ok(typeof api.openapi === 'string' && api.openapi.startsWith('3.0'), `expected OpenAPI 3.0.x, got ${api.openapi}`)

const requiredPaths = [
  '/health',
  '/api/categories',
  '/api/articles',
  '/api/articles/{id}',
  '/api/content-directory',
]
for (const path of requiredPaths) {
  assert.ok(api.paths?.[path], `missing path ${path}`)
}

const errorEnvelope = api.components?.schemas?.ErrorEnvelope
assert.ok(errorEnvelope, 'missing ErrorEnvelope schema')
const codeEnum = (errorEnvelope as { properties?: { code?: { enum?: number[] } } }).properties?.code?.enum
assert.ok(Array.isArray(codeEnum), 'ErrorEnvelope.code must declare enum')
for (const code of [40000, 40400, 40401, 50000, 50001, 50300, 50301]) {
  assert.ok(codeEnum.includes(code), `ErrorEnvelope.code missing ${code}`)
}

console.log(`openapi:validate OK — ${openapiPath} (${requiredPaths.length} paths)`)
