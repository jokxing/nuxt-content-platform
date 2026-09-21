import { analyzeAdvancedStats, type AdvancedStatsResult } from '../lib/advancedStats.js'
import { loadVisibleValueWindow } from './datasetWindow.js'

/** 复用可见窗口查询；计算在纯函数中完成。 */
export async function getAdvancedStats(
  requestedPeriod: number,
  now: Date = new Date(),
): Promise<AdvancedStatsResult> {
  const rows = await loadVisibleValueWindow(requestedPeriod, now)
  return analyzeAdvancedStats(rows, requestedPeriod)
}
