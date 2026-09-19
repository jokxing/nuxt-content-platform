<script setup lang="ts">
const api = useContentApi()

/**
 * 2.2-6 旧详情兼容入口
 * 证据：首页 ArticleCard、AppHeader、预渲染/sitemap 仍可能访问 `/news/detail/:id`
 * 策略：不删路由；302/replace 到 canonical `/news/{parent_route}/article/:id`
 * 与新详情共用 Mock；文章不存在时回退指南列表
 */

const route = useRoute()
const { locale } = useI18n()

const articleId = computed(() => String(route.params.id || ''))

function localePath(path: string) {
  return locale.value === 'zh-HK' ? path : `/${locale.value}${path}`
}

const id = articleId.value
if (!id || Array.isArray(route.params.id)) {
  await navigateTo(localePath('/news/education'), { replace: true })
}
else {
  const lang = locale.value === 'zh-CN' ? 'sc' : locale.value === 'en-US' ? 'en' : 'tc'
  try {
    const article = await api.get<Record<string, any>>(`/api/articles/${id}`, {
      params: { lang },
    })
    const category = ['education', 'analysis', 'story'].includes(article?.parent_route)
      ? article.parent_route
      : 'education'
    await navigateTo(
      localePath(`/news/${category}/article/${article.id || id}`),
      { replace: true },
    )
  }
  catch {
    await navigateTo(localePath('/news/education'), { replace: true })
  }
}

definePageMeta({
  layout: 'default',
  name: 'news-detail-legacy',
  title: '资讯详情',
  i18n: 'menu.news',
})

useHead({
  title: 'Redirecting…',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
})
</script>

<template>
  <div class="legacy_detail_redirect" />
</template>
