<script setup lang="ts">
import HistoryDraws from './modules/history-draws.vue'
import LatestResult from './modules/latest-result.vue'
import NextDrawCountdown from './modules/next-draw-countdown.vue'
import RecommendArticles from './modules/recommend-articles.vue'
import RecommendNumbers from './modules/recommend-numbers.vue'

const api = useContentApi()

const color = useColorMode()
useHead(useSeo({ pageKey: 'home' }))
useHead(() => ({
  meta: [{ id: 'theme-color', name: 'theme-color', content: color.value === 'dark' ? '#222222' : '#ffffff' }],
}))

const { data: latestResult } = await useAsyncData('latestResult', async () => {
  return await api.get('/api/latest')
}, {
  server: true,
  lazy: false,
  default: () => null,
})
</script>

<template>
  <div class="p-16">
    <LatestResult :result="latestResult || undefined" />
    <NextDrawCountdown />
    <RecommendNumbers />
    <HistoryDraws />
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
