import { pingDatabase } from '../db/prisma.js'
import { serviceUnavailable } from '../lib/errors.js'

export type HealthStatus = {
  status: 'ok'
  database: 'up'
}

/**
 * /health 就绪检查：确认 DATABASE_URL 已配置并实际 SELECT 1。
 * 失败统一 50300，不打印连接串。
 */
export async function checkHealth(): Promise<HealthStatus> {
  if (!process.env.DATABASE_URL) {
    throw serviceUnavailable('服务暂不可用')
  }
  try {
    await pingDatabase()
  }
  catch (error) {
    throw serviceUnavailable('服务暂不可用', error)
  }
  return { status: 'ok', database: 'up' }
}
