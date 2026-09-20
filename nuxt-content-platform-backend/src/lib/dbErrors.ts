import { Prisma } from '@prisma/client'
import { AppError, internalError, serviceUnavailable } from './errors.js'

export function mapDatabaseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError
    || error instanceof Prisma.PrismaClientUnknownRequestError
    || error instanceof Prisma.PrismaClientRustPanicError
    || error instanceof Prisma.PrismaClientInitializationError
  ) {
    return serviceUnavailable('服务暂不可用', error)
  }
  return internalError('内部服务错误', error)
}
