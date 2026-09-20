import { BusinessCode } from './errors.js'

export type SuccessEnvelope<T> = {
  code: number
  msg: string
  data: T
}

export type ErrorEnvelope = {
  code: number
  msg: string
  data: null
  requestId: string
}

/** 成功外壳：code 恒为 0；成功响应不带 requestId。 */
export function okResponse<T>(data: T, msg = 'ok'): SuccessEnvelope<T> {
  return {
    code: BusinessCode.OK,
    msg,
    data,
  }
}

/**
 * 失败外壳：数字业务码 + data:null + requestId。
 * HTTP 状态码仍由调用方单独设置，避免全部变成 200。
 */
export function failResponse(code: number, msg: string, requestId: string): ErrorEnvelope {
  return {
    code,
    msg,
    data: null,
    requestId,
  }
}
