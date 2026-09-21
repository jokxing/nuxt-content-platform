import { Prisma, type DatasetPeriod } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { hongKongCalendarYear, hongKongYearUtcRange } from '../lib/hongKongTime.js'
import { toUnixMillis } from '../lib/time.js'
import { visibleDatasetPeriodWhere } from './datasetVisibility.js'

export type HistoryRowDto = {
  period_code: string
  released_at: number
  values: number[]
  extra_value: number
}

export type HistoryFilterOptions = {
  years: number[]
  period_codes: string[]
}

export type HistoryPage = {
  items: HistoryRowDto[]
  total: number
  page: number
  page_size: number
  total_pages: number
  filter_options: HistoryFilterOptions
}

export type HistoryQuery = {
  page: number
  pageSize: number
  year?: number
  periodCode?: string
  number?: number
  periods?: number
}

const ORDER_BY = [{ releasedAt: 'desc' as const }, { id: 'desc' as const }]

function mapRow(period: DatasetPeriod): HistoryRowDto {
  return {
    period_code: period.periodCode,
    released_at: toUnixMillis(period.releasedAt),
    values: [period.value1, period.value2, period.value3, period.value4, period.value5, period.value6],
    extra_value: period.extraValue,
  }
}

function buildFilteredWhere(
  now: Date,
  query: HistoryQuery,
): Prisma.DatasetPeriodWhereInput {
  const clauses: Prisma.DatasetPeriodWhereInput[] = [visibleDatasetPeriodWhere(now)]

  if (query.year !== undefined) {
    const range = hongKongYearUtcRange(query.year)
    clauses.push({
      releasedAt: { gte: range.gte, lt: range.lt },
    })
  }

  if (query.periodCode !== undefined) {
    clauses.push({ periodCode: query.periodCode })
  }

  if (query.number !== undefined) {
    const n = query.number
    clauses.push({
      OR: [
        { value1: n },
        { value2: n },
        { value3: n },
        { value4: n },
        { value5: n },
        { value6: n },
        { extraValue: n },
      ],
    })
  }

  return { AND: clauses }
}

function buildFilterOptions(
  visibleRows: Array<{ periodCode: string, releasedAt: Date }>,
): HistoryFilterOptions {
  const yearSet = new Set<number>()
  for (const row of visibleRows) {
    yearSet.add(hongKongCalendarYear(row.releasedAt))
  }
  const years = [...yearSet].sort((a, b) => b - a)
  const period_codes = visibleRows.slice(0, 120).map(row => row.periodCode)
  return { years, period_codes }
}

/**
 * 历史列表：同一 now + 可重复读事务。
 * filter_options 仅基于全部可见期次，不受本次 year/period_code/number/periods 影响。
 * periods 在其他过滤完成后截取最新窗口，再分页；total 为窗口大小。
 */
export async function listDatasetHistory(
  query: HistoryQuery,
  now: Date = new Date(),
): Promise<HistoryPage> {
  const filteredWhere = buildFilteredWhere(now, query)
  const visibleWhere = visibleDatasetPeriodWhere(now)

  return prisma.$transaction(async (tx) => {
    const visibleMeta = await tx.datasetPeriod.findMany({
      where: visibleWhere,
      select: { periodCode: true, releasedAt: true },
      orderBy: ORDER_BY,
    })
    const filter_options = buildFilterOptions(visibleMeta)

    let candidates: DatasetPeriod[]
    if (query.periods !== undefined) {
      candidates = await tx.datasetPeriod.findMany({
        where: filteredWhere,
        orderBy: ORDER_BY,
        take: query.periods,
      })
    }
    else {
      const totalAll = await tx.datasetPeriod.count({ where: filteredWhere })
      const totalPagesAll = Math.max(1, Math.ceil(totalAll / query.pageSize))
      const rows = await tx.datasetPeriod.findMany({
        where: filteredWhere,
        orderBy: ORDER_BY,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      })
      return {
        items: rows.map(mapRow),
        total: totalAll,
        page: query.page,
        page_size: query.pageSize,
        total_pages: totalPagesAll,
        filter_options,
      }
    }

    const total = candidates.length
    const total_pages = Math.max(1, Math.ceil(total / query.pageSize))
    const start = (query.page - 1) * query.pageSize
    const pageRows = candidates.slice(start, start + query.pageSize)

    return {
      items: pageRows.map(mapRow),
      total,
      page: query.page,
      page_size: query.pageSize,
      total_pages,
      filter_options,
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}
