import type { Request, Response } from 'express'
import { hashClientIp, type AuditActorContext } from './adminAudit.js'
import { getRequestId } from '../middleware/requestId.js'

/** 统一构造审计主体；可信代理下的 IP 收口留在 A7 部署配置任务。 */
export function actorFromRequest(
  req: Request,
  res: Response,
  adminUserId: number,
): AuditActorContext {
  return {
    adminUserId,
    requestId: getRequestId(res),
    ipHash: hashClientIp(req),
  }
}
