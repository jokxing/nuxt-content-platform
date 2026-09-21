import { analyzeFrequency, type AnalysisResult } from '../lib/analysisStats.js'
import { loadVisibleValueWindow } from './datasetWindow.js'

/** 同一 now 取可见窗口后交给纯函数；controller 不参与计算。 */
export async function getFrequencyAnalysis(
  requestedPeriod: number,
  now: Date = new Date(),
): Promise<AnalysisResult> {
  const rows = await loadVisibleValueWindow(requestedPeriod, now)
  return analyzeFrequency(rows, requestedPeriod)
}
