/**
 * 将 Prisma/MySQL 的 UTC DateTime 转为 API 使用的 Unix 毫秒时间戳。
 * 业务接口统一用 number（13 位），避免各 service 各自序列化。
 * 日志字段不属于业务 API，可继续用 ISO 字符串。
 */
export function toUnixMillis(value: Date): number {
  const millis = value.getTime()
  if (!Number.isSafeInteger(millis)) {
    throw new Error('invalid_datetime')
  }
  return millis
}
