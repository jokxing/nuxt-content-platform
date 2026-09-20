/** 数字业务码：JSON 的 code 始终是 number；符号名仅用于代码与文档。 */
export const BusinessCode = {
  OK: 0,
  INVALID_ARGUMENT: 40000,
  ROUTE_NOT_FOUND: 40400,
  ARTICLE_NOT_FOUND: 40401,
  INTERNAL_ERROR: 50000,
  DATA_INTEGRITY_ERROR: 50001,
  SERVICE_UNAVAILABLE: 50300,
  CONTENT_DIRECTORY_LIMIT_EXCEEDED: 50301,
} as const

export type BusinessCodeValue = (typeof BusinessCode)[keyof typeof BusinessCode]

export class AppError extends Error {
  readonly statusCode: number
  readonly code: number
  readonly expose: boolean

  constructor(
    statusCode: number,
    code: number,
    message: string,
    options?: { expose?: boolean, cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.expose = options?.expose ?? statusCode < 500
  }
}

export function invalidArgument(message = '参数不合法'): AppError {
  return new AppError(400, BusinessCode.INVALID_ARGUMENT, message)
}

export function routeNotFound(message = '资源不存在'): AppError {
  return new AppError(404, BusinessCode.ROUTE_NOT_FOUND, message)
}

export function articleNotFound(message = '文章不存在'): AppError {
  return new AppError(404, BusinessCode.ARTICLE_NOT_FOUND, message)
}

export function internalError(message = '内部服务错误', cause?: unknown): AppError {
  return new AppError(500, BusinessCode.INTERNAL_ERROR, message, { expose: false, cause })
}

/** 已知数据残缺（如分类缺译）；对外短句，不泄露库细节。 */
export function dataIntegrityError(message = '数据不完整', cause?: unknown): AppError {
  return new AppError(500, BusinessCode.DATA_INTEGRITY_ERROR, message, { expose: true, cause })
}

export function serviceUnavailable(message = '服务暂不可用', cause?: unknown): AppError {
  return new AppError(503, BusinessCode.SERVICE_UNAVAILABLE, message, { expose: true, cause })
}

export function contentDirectoryLimitExceeded(
  message = '内容目录超过上限',
  cause?: unknown,
): AppError {
  return new AppError(503, BusinessCode.CONTENT_DIRECTORY_LIMIT_EXCEEDED, message, {
    expose: true,
    cause,
  })
}
