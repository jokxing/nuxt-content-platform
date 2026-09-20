/** 后端 SuccessEnvelope / ErrorEnvelope 解包；Mock 统计等无外壳响应原样返回。 */

export interface ApiErrorBody {
  code: number
  msg?: string
  data?: null
  requestId?: string
}

export class ContentApiError extends Error {
  statusCode: number
  code: number
  msg: string
  requestId?: string

  constructor(opts: { statusCode: number, code: number, msg: string, requestId?: string }) {
    super(opts.msg)
    this.name = 'ContentApiError'
    this.statusCode = opts.statusCode
    this.code = opts.code
    this.msg = opts.msg
    this.requestId = opts.requestId
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isApiEnvelope(value: unknown): value is { code: number, msg?: string, data?: unknown, requestId?: string } {
  return isRecord(value) && typeof value.code === 'number'
}

/** code=0 提取 data；非零抛出可判断错误；无外壳则原样返回（统计 Mock）。 */
export function unwrapApiPayload<T = unknown>(raw: unknown): T {
  if (!isApiEnvelope(raw))
    return raw as T
  if (raw.code === 0)
    return raw.data as T
  throw new ContentApiError({
    statusCode: 400,
    code: raw.code,
    msg: typeof raw.msg === 'string' ? raw.msg : 'API error',
    requestId: typeof raw.requestId === 'string' ? raw.requestId : undefined,
  })
}

/** 将 ofetch / Nitro 抛出的错误转为带 HTTP 状态、msg、requestId 的 ContentApiError（若体含业务码）。 */
export function normalizeTransportError(err: unknown): never {
  const anyErr = err as {
    statusCode?: number
    status?: number
    message?: string
    data?: unknown
    response?: { status?: number, _data?: unknown }
  }
  const statusCode = anyErr.statusCode || anyErr.status || anyErr.response?.status || 500
  const body = anyErr.data ?? anyErr.response?._data
  if (isApiEnvelope(body) && body.code !== 0) {
    throw new ContentApiError({
      statusCode,
      code: body.code,
      msg: typeof body.msg === 'string' ? body.msg : (anyErr.message || 'API error'),
      requestId: typeof body.requestId === 'string' ? body.requestId : undefined,
    })
  }
  throw err
}
