/**
 * 校验 docs/admin/admin-openapi.json 为可解析的 OpenAPI 3.0 文档。
 * 不启动服务、不连库、不打印凭据。
 */
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import SwaggerParser from '@apidevtools/swagger-parser'

const openapiPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/admin/admin-openapi.json',
)

const api = await SwaggerParser.validate(openapiPath) as {
  openapi?: string
  paths?: Record<string, unknown>
}

assert.ok(typeof api.openapi === 'string' && api.openapi.startsWith('3.0'), `expected OpenAPI 3.0.x, got ${api.openapi}`)

const requiredAuthPaths = [
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
  '/api/admin/auth/session',
]
for (const path of requiredAuthPaths) {
  assert.ok(api.paths?.[path], `missing path ${path}`)
}

const allPaths = Object.keys(api.paths || {})
assert.equal(allPaths.length, 11, `expected 11 admin path keys, got ${allPaths.length}`)

let operationCount = 0
for (const pathItem of Object.values(api.paths || {})) {
  if (!pathItem || typeof pathItem !== 'object')
    continue
  for (const method of Object.keys(pathItem as Record<string, unknown>)) {
    if (['get', 'post', 'put', 'patch', 'delete'].includes(method))
      operationCount += 1
  }
}
assert.equal(operationCount, 14, `expected 14 admin operations, got ${operationCount}`)

console.log(`admin-openapi:validate OK — ${openapiPath} (${allPaths.length} paths, ${operationCount} operations; auth+articles+media design ready)`)
