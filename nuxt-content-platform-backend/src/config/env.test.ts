import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadEnv, shouldMountDebugRoutes } from '../config/env.js'

describe('debug route gating', () => {
  it('allows both local admin loopback origins by default', () => {
    const env = loadEnv({ NODE_ENV: 'development' })
    assert.equal(
      env.ADMIN_ALLOWED_ORIGINS,
      'http://localhost:3670,http://127.0.0.1:3670',
    )
  })

  it('mounts only for test env or explicit ENABLE_DEBUG_ROUTES', () => {
    assert.equal(shouldMountDebugRoutes(loadEnv({ NODE_ENV: 'test' })), true)
    assert.equal(shouldMountDebugRoutes(loadEnv({ NODE_ENV: 'development' })), false)
    assert.equal(
      shouldMountDebugRoutes(loadEnv({ NODE_ENV: 'development', ENABLE_DEBUG_ROUTES: 'true' })),
      true,
    )
    assert.equal(shouldMountDebugRoutes(loadEnv({ NODE_ENV: 'production' })), false)
  })

  it('rejects ENABLE_DEBUG_ROUTES in production', () => {
    assert.throws(
      () => loadEnv({ NODE_ENV: 'production', ENABLE_DEBUG_ROUTES: 'true' }),
      /ENABLE_DEBUG_ROUTES/,
    )
  })

  it('rejects ADMIN_ALLOW_MISSING_ORIGIN in production', () => {
    assert.throws(
      () => loadEnv({ NODE_ENV: 'production', ADMIN_ALLOW_MISSING_ORIGIN: 'true' }),
      /ADMIN_ALLOW_MISSING_ORIGIN/,
    )
  })
})
