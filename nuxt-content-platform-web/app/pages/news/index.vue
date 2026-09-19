<script setup lang="ts">
import { useNewsTab } from '../../composables/useNewsTab'
import Forecasting from './modules/forecasting.vue'
import NewsStory from './modules/news-story.vue'
import Teaching from './modules/teaching.vue'

const { t, locale } = useI18n()
const { mainTab } = useNewsTab()

const MAIN_TABS = [
  { id: 'education', titleKey: 'news.tabs.tutorial' },
  { id: 'analysis', titleKey: 'news.tabs.analysis' },
  { id: 'story', titleKey: 'news.tabs.stories' },
] as const

function categoryPath(categoryId: string) {
  return locale.value === 'zh-HK' ? `/news/${categoryId}` : `/${locale.value}/news/${categoryId}`
}

function onMainTabChange(index: number) {
  const target = MAIN_TABS[index]
  if (!target)
    return
  mainTab.value = index
  navigateTo(categoryPath(target.id))
}

function onMainTabClick(event: { name: string | number }) {
  if (event.name !== mainTab.value)
    return

  const newsTab = useNewsTab()
  newsTab.teachingTab.value = -1
  newsTab.forecastingTab.value = -1
  newsTab.storyTab.value = -1

  const target = MAIN_TABS[event.name as number]
  if (target)
    navigateTo(categoryPath(target.id))
}

useHead({
  title: t('seo.news.title'),
  meta: [
    { name: 'description', content: t('seo.news.description') },
    { name: 'keywords', content: t('seo.news.keywords') },
    { name: 'robots', content: 'noindex,nofollow' },
  ],
})

definePageMeta({
  layout: 'default',
  name: 'news',
  title: '资讯',
  i18n: 'menu.news',
})

// 入口页立即进入默认分类（指南），保持原交互
navigateTo(categoryPath('education'), { replace: true })
</script>

<template>
  <div class="news-page">
    <Teaching v-if="mainTab === 0" />
    <Forecasting v-if="mainTab === 1" />
    <NewsStory v-if="mainTab === 2" />
    <div class="bottom-tabs">
      <VanTabs v-model:active="mainTab" @change="onMainTabChange" @click-tab="onMainTabClick">
        <VanTab :title="t('news.tabs.tutorial')" />
        <VanTab :title="t('news.tabs.analysis')" />
        <VanTab :title="t('news.tabs.stories')" />
      </VanTabs>
    </div>
  </div>
</template>

<style scoped lang="scss">
.news-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.bottom-tabs {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 99;

  :deep(.van-tabs__line) {
    display: none;
  }

  :deep(.van-tab) {
    color: #666;
    flex: none !important;
    padding: 0 18px !important;
    font-size: 12px;
  }

  :deep(.van-tab:first-child) {
    padding-left: 10px !important;
  }

  :deep(.van-tab:last-child) {
    padding-right: 10px !important;
  }

  :deep(.van-tab--active) {
    color: #0f766e;
  }

  :deep(.van-tabs__nav) {
    background: transparent;
    display: flex;
    justify-content: flex-start;
  }

  :deep(.van-tabs__wrap) {
    padding: 0 16px;
  }

  :deep(.van-tabs__content) {
    background: transparent;
  }
}

:deep(.van-cell-group--inset) {
  margin: 12px 16px;
}

.dark .bottom-tabs {
  background: #2a2a2a !important;
}

.dark .bottom-tabs :deep(.van-tab) {
  color: #ccc !important;
}

.dark .bottom-tabs :deep(.van-tab--active) {
  color: #5eead4 !important;
}
</style>
