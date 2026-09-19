import { useState } from '#app'

export function useStatisticsTab() {
  const mainTab = useState<number>('statisticsMainTab', () => 0)

  return {
    mainTab,
  }
}
