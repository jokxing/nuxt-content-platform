import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** 生成至少 256 bit 的 opaque token（base64url）。 */
export function generateOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url')
}

/** SHA-256 十六进制摘要，用于会话/CSRF 落库。 */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

/** 常量时间比较两个等长字符串；长度不同直接失败。 */
export function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  if (left.length !== right.length || left.length === 0)
    return false
  return timingSafeEqual(left, right)
}
