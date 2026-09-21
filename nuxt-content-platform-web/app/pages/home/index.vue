<script setup lang="ts">
import HistoryRecords from './modules/history-records.vue'
import LatestResult from './modules/latest-result.vue'
import NextReleaseCountdown from './modules/next-release-countdown.vue'
import RecommendArticles from './modules/recommend-articles.vue'
import RecommendNumbers from './modules/recommend-numbers.vue'
import type { LatestDatasetDto } from '~/api/models'

const api = useContentApi()

const color = useColorMode()
useHead(useSeo({ pageKey: 'home' }))
useHead(() => ({
  meta: [{ id: 'theme-color', name: 'theme-color', content: color.value === 'dark' ? '#222222' : '#ffffff' }],
}))

const { data: latestResult } = await useAsyncData('latestResult', async () => {
  return await api.get<LatestDatasetDto>('/api/latest')
}, {
  server: true,
  lazy: false,
  default: () => null,
})
</script>

<template>
  <div class="p-16">
    <LatestResult :result="latestResult || undefined" />
    <NextReleaseCountdown />
    <RecommendNumbers />
    <HistoryRecords />
    <RecommendArticles />
  </div>
</template>

<style>
.countdown-number {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-none);
  font-weight: 700;
  min-width: 2.5ch;
  text-align: center;
}
</style>
