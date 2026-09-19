<script setup lang="ts">
import { useAppFooterRouteNames as names } from '~/config'

const route = useRoute()
const { locale, t } = useI18n()

// 根据当前语言生成路由路径
function localePath(path: string) {
  if (locale.value === 'zh-HK')
    return path
  return `/${locale.value}${path}`
}

// 判断路由是否匹配
function isRouteMatch(path: string) {
  const currentPath = route.path
  const localizedPath = localePath(path)

  // 移除开头和结尾的斜杠进行比较
  const normalizedCurrentPath = currentPath.replace(/^\/|\/$/g, '')
  const normalizedLocalPath = localizedPath.replace(/^\/|\/$/g, '')

  return normalizedCurrentPath === normalizedLocalPath
}

const show = computed(() => {
  return route.name && names.includes(route.name as string)
})
</script>

<template>
  <van-tabbar v-if="show" route placeholder fixed>
    <!-- 首页 -->
    <van-tabbar-item :to="localePath('/')" :class="{ 'van-tabbar-item--active': isRouteMatch('/') || isRouteMatch('') }">
      <span>{{ t('tabbar.home') }}</span>
      <template #icon>
        <div class="i-carbon:home" />
      </template>
    </van-tabbar-item>

    <!-- 数据统计 -->
    <van-tabbar-item :to="localePath('/statistics')" :class="{ 'van-tabbar-item--active': route.path.includes('/statistics') }">
      <span>{{ t('tabbar.statistics') }}</span>
      <template #icon>
        <div class="i-carbon:chart-histogram" />
      </template>
    </van-tabbar-item>

    <!-- 组合工具 -->
    <van-tabbar-item :to="localePath('/pick')" :class="{ 'van-tabbar-item--active': route.path.includes('/pick') }">
      <span>{{ t('tabbar.pick') }}</span>
      <template #icon>
        <div class="i-carbon:character-whole-number h-24px w-24px" />
      </template>
    </van-tabbar-item>

    <!-- 资讯 -->
    <van-tabbar-item :to="localePath('/news')" :class="{ 'van-tabbar-item--active': route.path.includes('/news') }">
      <span>{{ t('tabbar.news') }}</span>
      <template #icon>
        <div class="i-carbon:document" />
      </template>
    </van-tabbar-item>

    <!-- 我的 -->
    <!-- <van-tabbar-item :to="localePath('/profile')" :class="{ 'van-tabbar-item--active': route.path.includes('/profile') }">
      <span>{{ t('tabbar.profile') }}</span>
      <template #icon>
        <div class="i-carbon:user" />
      </template>
    </van-tabbar-item> -->
  </van-tabbar>
</template>

<style lang="scss">
.van-tabbar {
  background-color: var(--c-primary);

  .van-tabbar-item {
    color: rgba(255, 255, 255, 0.6);

    .van-tabbar-item__icon {
      color: rgba(255, 255, 255, 0.6);

      div {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    &--active {
      color: #fff !important;

      .van-tabbar-item__icon {
        color: #fff !important;

        div {
          color: #fff !important;
        }
      }
    }
  }
}
</style>
