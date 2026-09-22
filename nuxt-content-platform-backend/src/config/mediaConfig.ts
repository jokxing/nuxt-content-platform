import { join } from 'node:path'
import type { Env } from './env.js'

export type MediaStorageDriver = 'local' | 'r2'

export type MediaConfig = {
  publicBaseUrl: string
  driver: MediaStorageDriver
  localRoot: string
  r2: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    endpoint: string
  } | null
}

export const MEDIA_MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MEDIA_MAX_EDGE_PX = 2048
export const MEDIA_MAX_PIXELS = 8_388_608
export const MEDIA_WEBP_QUALITY = 80
export const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, immutable'
export const DEFAULT_MEDIA_PUBLIC_BASE_URL = 'http://127.0.0.1:4000/media'

let mediaConfig: MediaConfig | null = null

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '')
}

export function buildMediaConfig(env: Env): MediaConfig {
  const publicBaseUrl = normalizeBaseUrl(
    env.MEDIA_PUBLIC_BASE_URL || DEFAULT_MEDIA_PUBLIC_BASE_URL,
  )
  const driver = env.MEDIA_STORAGE_DRIVER || 'local'
  const localRoot = env.MEDIA_LOCAL_ROOT?.trim()
    || join(process.cwd(), '.data', 'media')

  let r2: MediaConfig['r2'] = null
  if (driver === 'r2') {
    const accountId = env.R2_ACCOUNT_ID?.trim() || ''
    const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() || ''
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() || ''
    const bucket = env.R2_BUCKET?.trim() || ''
    const endpoint = env.R2_ENDPOINT?.trim()
      || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
      throw new Error(
        'MEDIA_STORAGE_DRIVER=r2 requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (and optional R2_ENDPOINT)',
      )
    }
    r2 = { accountId, accessKeyId, secretAccessKey, bucket, endpoint }
  }

  return {
    publicBaseUrl,
    driver,
    localRoot,
    r2,
  }
}

export function initMediaConfig(env: Env): MediaConfig {
  mediaConfig = buildMediaConfig(env)
  return mediaConfig
}

export function getMediaConfig(): MediaConfig {
  if (!mediaConfig)
    throw new Error('Media config is not initialized')
  return mediaConfig
}

export function resetMediaConfigForTests(): void {
  mediaConfig = null
}

/** 将对象 key 拼成公开 URL。 */
export function buildMediaPublicUrl(baseUrl: string, key: string): string {
  const base = normalizeBaseUrl(baseUrl)
  const cleanKey = key.replace(/^\/+/, '')
  return `${base}/${cleanKey}`
}
