import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  getMediaConfig,
  MEDIA_CACHE_CONTROL,
  type MediaConfig,
} from '../../config/mediaConfig.js'
import { serviceUnavailable } from '../errors.js'

export type StorageAdapter = {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  delete(key: string): Promise<void>
}

function assertSafeKey(key: string): void {
  if (
    !key
    || key.includes('..')
    || key.includes('\\')
    || key.startsWith('/')
    || !key.startsWith('covers/')
  ) {
    throw serviceUnavailable('媒体存储暂不可用')
  }
}

export class LocalDiskStorageAdapter implements StorageAdapter {
  constructor(private readonly rootDir: string) {}

  private resolvePath(key: string): string {
    assertSafeKey(key)
    const root = resolve(this.rootDir)
    const full = resolve(join(root, key))
    if (full !== root && !full.startsWith(root + sep))
      throw serviceUnavailable('媒体存储暂不可用')
    return full
  }

  async put(key: string, body: Buffer, _contentType: string): Promise<void> {
    const full = this.resolvePath(key)
    await mkdir(dirname(full), { recursive: true })
    // wx：已存在则失败，永不覆盖随机 key
    await writeFile(full, body, { flag: 'wx' })
  }

  async delete(key: string): Promise<void> {
    const full = this.resolvePath(key)
    try {
      await unlink(full)
    }
    catch (error: unknown) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT')
        return
      throw error
    }
  }
}

export class R2StorageAdapter implements StorageAdapter {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(r2: NonNullable<MediaConfig['r2']>) {
    this.bucket = r2.bucket
    this.client = new S3Client({
      region: 'auto',
      endpoint: r2.endpoint,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
    })
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    assertSafeKey(key)
    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: MEDIA_CACHE_CONTROL,
        // 若对象已存在则拒绝（随机 key 不应冲突）
        IfNoneMatch: '*',
      }))
    }
    catch (error: unknown) {
      throw serviceUnavailable('媒体存储暂不可用', error)
    }
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key)
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }))
    }
    catch (error: unknown) {
      throw serviceUnavailable('媒体存储暂不可用', error)
    }
  }
}

let adapter: StorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
  if (adapter)
    return adapter
  const config = getMediaConfig()
  if (config.driver === 'r2') {
    if (!config.r2)
      throw serviceUnavailable('媒体存储暂不可用')
    adapter = new R2StorageAdapter(config.r2)
  }
  else {
    adapter = new LocalDiskStorageAdapter(config.localRoot)
  }
  return adapter
}

export function resetStorageAdapterForTests(): void {
  adapter = null
}
