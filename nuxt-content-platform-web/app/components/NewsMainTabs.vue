<script setup lang="ts">
export interface NewsMainTabItem {
  id: string
  title: string
}

defineProps<{
  active: number
  tabs: NewsMainTabItem[]
}>()

const emit = defineEmits<{
  change: [index: number]
  clickTab: [event: { name: string | number }]
}>()

function onChange(index: string | number) {
  emit('change', Number(index))
}

function onClickTab(event: { name: string | number }) {
  emit('clickTab', event)
}
</script>

<template>
  <div class="news_main_tabs">
    <VanTabs
      :active="active"
      @change="onChange"
      @click-tab="onClickTab"
    >
      <VanTab v-for="tab in tabs" :key="tab.id" :title="tab.title" />
    </VanTabs>
  </div>
</template>

<style scoped lang="scss">
.news_main_tabs {
  position: fixed;
  bottom: var(--van-tabbar-height);
  left: 0;
  right: 0;
  background: #fff;
  z-index: 99;
  border-top: 1px solid var(--van-border-color);

  :deep(.van-tabs__line) {
    display: none;
  }

  :deep(.van-tab) {
    color: #666;
    flex: 1 !important;
    padding: 0 !important;
    font-size: 12px;
    font-weight: 500;
  }

  :deep(.van-tab--active) {
    color: #0f766e;
    font-weight: 700;
  }

  :deep(.van-tabs__nav) {
    background: transparent;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  :deep(.van-tabs__wrap) {
    padding: 0;
  }

  :deep(.van-tabs__content) {
    background: transparent;
  }
}

.dark .news_main_tabs {
  background: #2a2a2a !important;
  border-top-color: #444 !important;

  :deep(.van-tab) {
    color: #ccc !important;
  }

  :deep(.van-tab--active) {
    color: #5eead4 !important;
  }
}
</style>
