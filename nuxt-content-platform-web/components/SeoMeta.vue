<script setup>
const config = useRuntimeConfig()
const route = useRoute()
const { locale } = useI18n()

const siteUrl = config.public.siteUrl
const currentUrl = computed(() => `${siteUrl}${route.fullPath}`)

// 使用 useSeoMeta 来设置动态 meta 信息
useSeoMeta({
  ogUrl: currentUrl,
  canonical: currentUrl,
  ogImage: `${siteUrl}/logo.png`,
})

// 结构化数据
const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '訊覽 ContentPulse',
  url: currentUrl.value,
  inLanguage: locale.value,
  description: '多語言資訊與數據展示平台（演示）',
  isPartOf: {
    '@type': 'WebSite',
    name: '訊覽 ContentPulse',
    url: siteUrl,
  },
  publisher: {
    '@type': 'Organization',
    name: '訊覽 ContentPulse',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo.png`,
      width: 200,
      height: 60,
    },
  },
}))
</script>

<template>
  <script type="application/ld+json">
    {{ jsonLd }}
  </script>
</template>
