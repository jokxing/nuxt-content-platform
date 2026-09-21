import { prisma } from '../db/prisma.js'
import { visibleDatasetPeriodWhere } from './datasetVisibility.js'

/** 一期 7 个值，顺序为 value1～value6、extraValue；窗口从新到旧。 */
export type ValueWindowRow = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

/**
 * 同一 now 下取最新可见期次，最多 requested 行。
 * requested 为 0 时不查库，返回空窗口。
 */
export async function loadVisibleValueWindow(
  requested: number,
  now: Date = new Date(),
): Promise<ValueWindowRow[]> {
  if (requested <= 0) {
    return []
  }

  const rows = await prisma.datasetPeriod.findMany({
    where: visibleDatasetPeriodWhere(now),
    orderBy: [{ releasedAt: 'desc' }, { id: 'desc' }],
    take: requested,
    select: {
      value1: true,
      value2: true,
      value3: true,
      value4: true,
      value5: true,
      value6: true,
      extraValue: true,
    },
  })

  return rows.map(row => [
    row.value1,
    row.value2,
    row.value3,
    row.value4,
    row.value5,
    row.value6,
    row.extraValue,
  ])
}
