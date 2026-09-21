import type { DatasetPeriod, DatasetSchedule } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { datasetNotFound } from '../lib/errors.js'
import { toUnixMillis } from '../lib/time.js'
import { visibleDatasetPeriodWhere } from './datasetVisibility.js'

export type LatestDatasetDto = {
  period_code: string
  released_at: number
  values: number[]
  extra_value: number
  next_release: {
    period_code: string
    scheduled_at: number
  } | null
}

export { visibleDatasetPeriodWhere }

function mapPeriod(period: DatasetPeriod): Omit<LatestDatasetDto, 'next_release'> {
  return {
    period_code: period.periodCode,
    released_at: toUnixMillis(period.releasedAt),
    values: [period.value1, period.value2, period.value3, period.value4, period.value5, period.value6],
    extra_value: period.extraValue,
  }
}

function mapNext(schedule: DatasetSchedule | null): LatestDatasetDto['next_release'] {
  if (!schedule) {
    return null
  }
  return {
    period_code: schedule.periodCode,
    scheduled_at: toUnixMillis(schedule.scheduledAt),
  }
}

/**
 * 同一 now 下取最新可见期次 + 最早未来 SCHEDULED 计划。
 * 无可见期次 → 40402；无下一计划 → next_release 为 null。
 */
export async function getLatestDataset(now: Date = new Date()): Promise<LatestDatasetDto> {
  const [period, schedule] = await Promise.all([
    prisma.datasetPeriod.findFirst({
      where: visibleDatasetPeriodWhere(now),
      orderBy: [{ releasedAt: 'desc' }, { id: 'desc' }],
    }),
    prisma.datasetSchedule.findFirst({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gt: now },
      },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    }),
  ])

  if (!period) {
    throw datasetNotFound()
  }

  return {
    ...mapPeriod(period),
    next_release: mapNext(schedule),
  }
}
