import { useState } from '#app'

export function useNewsTab() {
  const mainTab = useState<number>('newsMainTab', () => 0)
  const forecastingTab = useState<number>('newsForecastingTab', () => 0)
  const storyTab = useState<number>('newsStoryTab', () => 0)
  const teachingTab = useState<number>('newsTeachingTab', () => 0)

  return {
    mainTab,
    forecastingTab,
    storyTab,
    teachingTab,
  }
}
