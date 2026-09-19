<script setup lang="ts">
export interface NewsSubTabItem {
  id: number | string
  title: string
}

const props = defineProps<{
  active: number
  tabs: NewsSubTabItem[]
}>()

const emit = defineEmits<{
  change: [index: number]
}>()

const underlineStyle = computed(() => {
  const count = props.tabs.length
  if (count <= 0 || props.active < 0)
    return null

  return {
    width: `${100 / count}%`,
    left: `${(100 / count) * props.active}%`,
  }
})
</script>

<template>
  <div class="news_sub_tabs">
    <div class="news_sub_tabs__wrap">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.id"
        type="button"
        class="news_sub_tabs__item"
        :class="{ 'is-active': active === idx }"
        @click="emit('change', idx)"
      >
        {{ tab.title }}
      </button>
      <div
        v-if="underlineStyle"
        class="news_sub_tabs__line"
        :style="underlineStyle"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.news_sub_tabs {
  position: sticky;
  top: var(--van-nav-bar-height);
  z-index: 99;
  background: #fff;
  border-bottom: 1px solid var(--van-border-color);

  &__wrap {
    display: flex;
    position: relative;
    width: 100%;
  }

  &__item {
    flex: 1;
    padding: 14px 0 12px;
    background: none;
    border: none;
    color: #666;
    font-size: 15px;
    cursor: pointer;
    outline: none;
    font-weight: 500;
    position: relative;
    transition: color 0.2s;

    &.is-active {
      color: #0f766e;
      font-weight: 700;
    }
  }

  &__line {
    position: absolute;
    bottom: 0;
    height: 2px;
    background: #0f766e;
    border-radius: 2px;
    will-change: left;
    z-index: 2;
    transition: left 0.35s cubic-bezier(0.55, 0, 0.1, 1);
  }
}

.dark .news_sub_tabs {
  background: #2a2a2a !important;
  border-bottom-color: #444 !important;

  .news_sub_tabs__item {
    color: #ccc !important;

    &.is-active {
      color: #5eead4 !important;
    }
  }

  .news_sub_tabs__line {
    background: #5eead4;
  }
}
</style>
