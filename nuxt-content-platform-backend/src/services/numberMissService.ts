import { analyzeNumberMiss, type NumberMissResult } from '../lib/numberMiss.js'
import { loadVisibleValueWindow } from './datasetWindow.js'

export async function getNumberMiss(
  requestedPeriod: number,
  now: Date = new Date(),
): Promise<NumberMissResult> {
  const rows = await loadVisibleValueWindow(requestedPeriod, now)
  return analyzeNumberMiss(rows, requestedPeriod)
}
