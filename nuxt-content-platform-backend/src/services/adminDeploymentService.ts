import type { BuildEventReason, Prisma } from '@prisma/client'
import { BuildEventStatus } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import type { AuditActorContext } from '../lib/adminAudit.js'
import { writeAuditLog } from '../lib/adminAudit.js'
import { articleStateConflict, routeNotFound } from '../lib/errors.js'
import { toUnixMillis } from '../lib/time.js'

export type DeploymentDto = {
  id: number
  event_type: string
  reason: string
  status: string
  article_id: number | null
  article_version: number | null
  attempts: number
  external_run_id: string | null
  external_run_url: string | null
  error_summary: string | null
  created_at: number
  started_at: number | null
  finished_at: number | null
  updated_at: number
}

function toDto(row: {
  id: number
  eventType: string
  reason: string
  status: string
  articleId: number | null
  articleVersion: number | null
  attempts: number
  externalRunId: string | null
  externalRunUrl: string | null
  errorSummary: string | null
  createdAt: Date
  startedAt: Date | null
  finishedAt: Date | null
  updatedAt: Date
}): DeploymentDto {
  return {
    id: row.id,
    event_type: row.eventType,
    reason: row.reason,
    status: row.status,
    article_id: row.articleId,
    article_version: row.articleVersion,
    attempts: row.attempts,
    external_run_id: row.externalRunId,
    external_run_url: row.externalRunUrl,
    error_summary: row.errorSummary,
    created_at: toUnixMillis(row.createdAt),
    started_at: row.startedAt ? toUnixMillis(row.startedAt) : null,
    finished_at: row.finishedAt ? toUnixMillis(row.finishedAt) : null,
    updated_at: toUnixMillis(row.updatedAt),
  }
}

export async function listDeployments(options: {
  status?: BuildEventStatus
  reason?: BuildEventReason
  page: number
  pageSize: number
}) {
  const where: Prisma.BuildEventWhereInput = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.reason ? { reason: options.reason } : {}),
  }
  const [rows, total] = await prisma.$transaction([
    prisma.buildEvent.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.buildEvent.count({ where }),
  ])
  return {
    items: rows.map(toDto),
    total,
    page: options.page,
    page_size: options.pageSize,
    total_pages: Math.ceil(total / options.pageSize),
  }
}

export async function getDeployment(id: number): Promise<DeploymentDto> {
  const row = await prisma.buildEvent.findUnique({ where: { id } })
  if (!row)
    throw routeNotFound('构建记录不存在')
  return toDto(row)
}

/** 失败事件复用原记录与幂等键；不会创建第二条部署任务。 */
export async function retryDeployment(id: number, actor: AuditActorContext): Promise<DeploymentDto> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.buildEvent.findUnique({ where: { id } })
    if (!row)
      throw routeNotFound('构建记录不存在')
    if (row.status !== BuildEventStatus.FAILED)
      throw articleStateConflict('仅失败的构建可以重试')

    const updated = await tx.buildEvent.update({
      where: { id },
      data: {
        status: BuildEventStatus.QUEUED,
        nextAttemptAt: null,
        externalRunId: null,
        externalRunUrl: null,
        errorSummary: null,
        startedAt: null,
        finishedAt: null,
      },
    })
    await writeAuditLog(tx, {
      actor,
      action: 'BUILD_RETRIED',
      entityType: 'build_event',
      entityId: id,
      metadata: { previous_attempts: row.attempts },
    })
    return toDto(updated)
  })
}
