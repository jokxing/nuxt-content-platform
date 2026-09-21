import type { Prisma } from '@prisma/client'

/** 公开统计可见：已发布且 releasedAt 不晚于统一 now。 */
export function visibleDatasetPeriodWhere(now: Date): Prisma.DatasetPeriodWhereInput {
  return {
    status: 'PUBLISHED',
    releasedAt: { lte: now },
  }
}
