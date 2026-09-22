import sharp from 'sharp'
import {
  MEDIA_MAX_EDGE_PX,
  MEDIA_MAX_PIXELS,
  MEDIA_MAX_UPLOAD_BYTES,
  MEDIA_WEBP_QUALITY,
} from '../config/mediaConfig.js'
import { invalidArgument, payloadTooLarge } from './errors.js'

export type SniffedImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

export type ProcessedCoverImage = {
  buffer: Buffer
  mimeType: 'image/webp'
  width: number
  height: number
  size: number
}

function looksLikeSvg(buf: Buffer): boolean {
  const head = buf.subarray(0, Math.min(buf.length, 256)).toString('utf8').trimStart().toLowerCase()
  return head.startsWith('<?xml') || head.startsWith('<svg') || head.includes('<svg')
}

/** 魔数嗅探；不信任客户端 Content-Type / 扩展名。 */
export function sniffImageMime(buf: Buffer): SniffedImageMime {
  if (!buf.length)
    throw invalidArgument('缺少 file')
  if (looksLikeSvg(buf))
    throw invalidArgument('不支持 SVG 图片')

  if (buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF)
    return 'image/jpeg'

  if (
    buf.length >= 8
    && buf[0] === 0x89
    && buf[1] === 0x50
    && buf[2] === 0x4E
    && buf[3] === 0x47
    && buf[4] === 0x0D
    && buf[5] === 0x0A
    && buf[6] === 0x1A
    && buf[7] === 0x0A
  ) {
    return 'image/png'
  }

  if (
    buf.length >= 12
    && buf.toString('ascii', 0, 4) === 'RIFF'
    && buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }

  throw invalidArgument('格式不支持，仅接受 JPEG/PNG/WebP')
}

export async function processCoverImage(raw: Buffer): Promise<ProcessedCoverImage> {
  if (raw.length > MEDIA_MAX_UPLOAD_BYTES)
    throw payloadTooLarge()

  sniffImageMime(raw)

  let pipeline = sharp(raw, {
    failOn: 'error',
    limitInputPixels: MEDIA_MAX_PIXELS,
  })

  let width = 0
  let height = 0
  try {
    const meta = await pipeline.metadata()
    width = meta.width || 0
    height = meta.height || 0
  }
  catch {
    throw invalidArgument('不是合法图片')
  }

  if (width < 1 || height < 1)
    throw invalidArgument('不是合法图片')
  if (width * height > MEDIA_MAX_PIXELS)
    throw invalidArgument('图片像素总量超过上限')

  pipeline = sharp(raw, {
    failOn: 'error',
    limitInputPixels: MEDIA_MAX_PIXELS,
  }).rotate()

  if (width > MEDIA_MAX_EDGE_PX || height > MEDIA_MAX_EDGE_PX) {
    pipeline = pipeline.resize({
      width: MEDIA_MAX_EDGE_PX,
      height: MEDIA_MAX_EDGE_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  try {
    const result = await pipeline
      .webp({ quality: MEDIA_WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true })
    return {
      buffer: result.data,
      mimeType: 'image/webp',
      width: result.info.width,
      height: result.info.height,
      size: result.data.length,
    }
  }
  catch {
    throw invalidArgument('图片处理失败')
  }
}

export function createObjectKey(now = new Date()): string {
  const yyyy = String(now.getUTCFullYear())
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const id = crypto.randomUUID().replace(/-/g, '')
  return `covers/${yyyy}/${mm}/${id}.webp`
}
