import type { BuildEvent, BuildEventReason, BuildEventType, Prisma } from '@prisma/client'
import { BuildEventStatus } from '@prisma/client'
import type { Request } from 'express'
import { sha256Hex } from './cryptoTokens.js'

export type AuditActorContext = {
  adminUserId: number
  requestId: string
  ipHash: string | null
}

export type BuildEventBriefDto = {
  id: number
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED'
  reason: 'article_published' | 'article_updated' | 'article_unpublished'
}

export function hashClientIp(req: Request): string | null {
  const forwarded = req.get('x-forwarded-for')
  const candidate = (
    typeof forwarded === 'string' && forwarded.length > 0
      ? (forwarded.split(',')[0] ?? '')
      : req.ip || req.socket.remoteAddress || ''
  ).trim()
  if (!candidate)
    return null
  return sha256Hex(candidate)
}

export function buildEventDedupeKey(
  articleId: number,
  version: number,
  eventType: BuildEventType,
): string {
  return `article:${articleId}:version:${version}:${eventType}`
}

export function toBuildEventBrief(row: BuildEvent): BuildEventBriefDto {
  return {
    id: row.id,
    status: row.status,
    reason: row.reason as BuildEventBriefDto['reason'],
  }
}

export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  input: {
    actor: AuditActorContext
    action: string
    entityType: string
    entityId: number
    entityVersion?: number | null
    metadata?: Prisma.InputJsonValue
  },
): Promise<void> {
  await tx.auditLog.create({
    data: {
      adminUserId: input.actor.adminUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityVersion: input.entityVersion ?? null,
      requestId: input.actor.requestId,
      ipHash: input.actor.ipHash,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    },
  })
}

export async function enqueueBuildEvent(
  tx: Prisma.TransactionClient,
  input: {
    eventType: BuildEventType
    reason: BuildEventReason
    articleId: number
    articleVersion: number
  },
): Promise<BuildEvent> {
  const dedupeKey = buildEventDedupeKey(
    input.articleId,
    input.articleVersion,
    input.eventType,
  )
  return tx.buildEvent.create({
    data: {
      eventType: input.eventType,
      reason: input.reason,
      status: BuildEventStatus.QUEUED,
      articleId: input.articleId,
      articleVersion: input.articleVersion,
      dedupeKey,
      attempts: 0,
    },
  })
}
