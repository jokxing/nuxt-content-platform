import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger.js'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma
  ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect()
  logger.info('database_connected')
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
  logger.info('database_disconnected')
}

/** 数据库就绪探测：执行 SELECT 1；调用方不得记录连接串。 */
export async function pingDatabase(): Promise<boolean> {
  await prisma.$queryRaw`SELECT 1`
  return true
}
