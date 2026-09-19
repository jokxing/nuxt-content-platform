<script setup lang="ts">
/**
 * 统计入口：重定向到默认 Tab（type/1）
 * 实际容器与 SEO 见 `statistics/type/[id].vue`
 */const { locale } = useI18n()

definePageMeta({
  layout: 'default',
  name: 'statistics',
  title: '数据统计',
  i18n: 'menu.statistics',
})

useHead({
  title: 'Redirecting…',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})

const path = locale.value === 'zh-HK'
  ? '/statistics/type/1'
  : `/${locale.value}/statistics/type/1`

await navigateTo(path, { replace: true })
</script>

<template>
  <div class="statistics_entry" />
</template>
