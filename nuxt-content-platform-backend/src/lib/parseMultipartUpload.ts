import Busboy from 'busboy'
import type { Request } from 'express'
import { MEDIA_MAX_UPLOAD_BYTES } from '../config/mediaConfig.js'
import { invalidArgument, payloadTooLarge } from './errors.js'

export type ParsedUploadFile = {
  buffer: Buffer
  filename: string
  mimeType: string
}

/**
 * 解析 multipart：仅允许单字段 file；拒绝多余字段与多文件。
 * 原始文件部分超过 5 MiB 时抛 41300。
 */
export function parseSingleUploadFile(req: Request): Promise<ParsedUploadFile> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      reject(invalidArgument('Content-Type 必须为 multipart/form-data'))
      return
    }

    let settled = false
    let fileCount = 0
    let sawFileField = false
    const chunks: Buffer[] = []
    let total = 0
    let filename = ''
    let mimeType = ''

    const fail = (error: unknown) => {
      if (settled)
        return
      settled = true
      reject(error)
    }

    const succeed = (value: ParsedUploadFile) => {
      if (settled)
        return
      settled = true
      resolve(value)
    }

    let busboy: ReturnType<typeof Busboy>
    try {
      busboy = Busboy({
        headers: { 'content-type': contentType },
        limits: {
          files: 1,
          fields: 0,
          fileSize: MEDIA_MAX_UPLOAD_BYTES,
        },
      })
    }
    catch {
      fail(invalidArgument('multipart 解析失败'))
      return
    }

    busboy.on('file', (fieldname, stream, info) => {
      if (fieldname !== 'file') {
        stream.resume()
        fail(invalidArgument('仅允许文件字段 file'))
        return
      }
      fileCount += 1
      if (fileCount > 1) {
        stream.resume()
        fail(invalidArgument('仅允许单个文件'))
        return
      }
      sawFileField = true
      filename = info.filename || ''
      mimeType = info.mimeType || ''

      stream.on('data', (chunk: Buffer) => {
        total += chunk.length
        if (total > MEDIA_MAX_UPLOAD_BYTES) {
          stream.destroy()
          fail(payloadTooLarge())
          return
        }
        chunks.push(chunk)
      })
      stream.on('limit', () => {
        fail(payloadTooLarge())
      })
      stream.on('error', () => {
        fail(invalidArgument('文件读取失败'))
      })
    })

    busboy.on('field', () => {
      fail(invalidArgument('不允许额外表单字段'))
    })

    busboy.on('filesLimit', () => {
      fail(invalidArgument('仅允许单个文件'))
    })

    busboy.on('error', () => {
      fail(invalidArgument('multipart 解析失败'))
    })

    busboy.on('finish', () => {
      if (settled)
        return
      if (!sawFileField) {
        fail(invalidArgument('缺少 file'))
        return
      }
      succeed({
        buffer: Buffer.concat(chunks),
        filename,
        mimeType,
      })
    })

    req.pipe(busboy)
  })
}
