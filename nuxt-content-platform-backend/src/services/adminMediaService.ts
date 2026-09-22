import { buildMediaPublicUrl, getMediaConfig } from '../config/mediaConfig.js'
import { prisma } from '../db/prisma.js'
import { createObjectKey, processCoverImage } from '../lib/imagePipeline.js'
import { toUnixMillis } from '../lib/time.js'
import { getStorageAdapter } from '../lib/storage/storageAdapter.js'

export type MediaAssetDto = {
  id: number
  key: string
  url: string
  mime_type: 'image/webp'
  width: number
  height: number
  size: number
  created_at: number
}

export async function uploadAdminMediaImage(
  rawFile: Buffer,
  adminUserId: number,
): Promise<MediaAssetDto> {
  const processed = await processCoverImage(rawFile)
  const key = createObjectKey()
  const config = getMediaConfig()
  const url = buildMediaPublicUrl(config.publicBaseUrl, key)
  const storage = getStorageAdapter()
  await storage.put(key, processed.buffer, processed.mimeType)

  try {
    const row = await prisma.mediaAsset.create({
      data: {
        key,
        url,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.size,
        adminUserId,
      },
    })
    return {
      id: row.id,
      key: row.key,
      url: row.url,
      mime_type: 'image/webp',
      width: row.width,
      height: row.height,
      size: row.sizeBytes,
      created_at: toUnixMillis(row.createdAt),
    }
  }
  catch (error) {
    try {
      await storage.delete(key)
    }
    catch {
      // 补偿删除失败不掩盖原始错误
    }
    throw error
  }
}
