/** 数字业务码：JSON 的 code 始终是 number；符号名仅用于代码与文档。 */
export const BusinessCode = {
  OK: 0,
  INVALID_ARGUMENT: 40000,
  AUTH_REQUIRED: 40100,
  INVALID_CREDENTIALS: 40101,
  FORBIDDEN: 40300,
  CSRF_INVALID: 40301,
  ROUTE_NOT_FOUND: 40400,
  ARTICLE_NOT_FOUND: 40401,
  DATASET_NOT_FOUND: 40402,
  ADMIN_ARTICLE_NOT_FOUND: 40410,
  VERSION_CONFLICT: 40900,
  ARTICLE_STATE_CONFLICT: 40901,
  UNIQUE_CONFLICT: 40902,
  PUBLISH_VALIDATION_FAILED: 42200,
  LOGIN_RATE_LIMITED: 42900,
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
  readonly headers: Record<string, string> | undefined

  constructor(
    statusCode: number,
    code: number,
    message: string,
    options?: { expose?: boolean, cause?: unknown, headers?: Record<string, string> },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.expose = options?.expose ?? statusCode < 500
    this.headers = options?.headers
  }
}

export function invalidArgument(message = '参数不合法'): AppError {
  return new AppError(400, BusinessCode.INVALID_ARGUMENT, message)
}

export function authRequired(message = '请先登录'): AppError {
  return new AppError(401, BusinessCode.AUTH_REQUIRED, message)
}

export function invalidCredentials(message = '用户名或密码错误'): AppError {
  return new AppError(401, BusinessCode.INVALID_CREDENTIALS, message)
}

export function forbidden(message = '无权执行此操作'): AppError {
  return new AppError(403, BusinessCode.FORBIDDEN, message)
}

export function csrfInvalid(message = '请求来源校验失败'): AppError {
  return new AppError(403, BusinessCode.CSRF_INVALID, message)
}

export function loginRateLimited(retryAfterSeconds: number): AppError {
  return new AppError(429, BusinessCode.LOGIN_RATE_LIMITED, '登录尝试过多，请稍后再试', {
    headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))) },
  })
}

export function routeNotFound(message = '资源不存在'): AppError {
  return new AppError(404, BusinessCode.ROUTE_NOT_FOUND, message)
}

export function articleNotFound(message = '文章不存在'): AppError {
  return new AppError(404, BusinessCode.ARTICLE_NOT_FOUND, message)
}

export function datasetNotFound(message = '数据期次不存在'): AppError {
  return new AppError(404, BusinessCode.DATASET_NOT_FOUND, message)
}

export function adminArticleNotFound(message = '文章不存在'): AppError {
  return new AppError(404, BusinessCode.ADMIN_ARTICLE_NOT_FOUND, message)
}

export function versionConflict(message = '文章已被其他操作更新，请重新加载'): AppError {
  return new AppError(409, BusinessCode.VERSION_CONFLICT, message)
}

export function articleStateConflict(message = '当前状态不允许该操作'): AppError {
  return new AppError(409, BusinessCode.ARTICLE_STATE_CONFLICT, message)
}

export function uniqueConflict(message = '资源已存在'): AppError {
  return new AppError(409, BusinessCode.UNIQUE_CONFLICT, message)
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
