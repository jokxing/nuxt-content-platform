<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useArticleNavigation } from '~/composables/useArticleNavigation'
import { useNewsTab } from '~/composables/useNewsTab'
import { NEWS_CATEGORIES } from '~/constants/news-categories'
import type { ArticleDto, ArticlePage } from '~/types/content'

const api = useContentApi()

const route = useRoute()
const { locale } = useI18n()
const newsTab = useNewsTab()
const { goToArticle } = useArticleNavigation({
  basePath: () => `/news/${String(route.params.category || 'analysis')}/article`,
  idKey: 'id',
})

// 根据路由参数同步tab状态到store（仅在带type参数的路由时）
const typeId = computed(() => route.params.id ? Number(route.params.id) - 1 : -1)
const hasTypeParam = computed(() => route.path.includes('/type/'))

// 确保在独立路由时清除状态
if (!hasTypeParam.value) {
  newsTab.forecastingTab.value = -1
}
else if (typeId.value >= 0) {
  newsTab.forecastingTab.value = typeId.value
}

// 使用useAsyncData获取文章列表，支持SSR
const { data: articles, error, pending } = await useAsyncData(() => `forecasting-articles-${locale.value}-${route.params.category}-${route.params.id || 'default'}`, async () => {
  const routeCategory = route.params.category as string
  const typeId = route.params.id ? Number(route.params.id) : 0

  let category: string
  const hasTypeParam = route.path.includes('/type/')

  if (hasTypeParam && typeId >= 1) {
    category = NEWS_CATEGORIES.getCategory(routeCategory, typeId)
  }
  else {
    category = NEWS_CATEGORIES.getParentCategory(routeCategory)
    if (!category) {
      category = 'ai-predict'
    }
  }

  if (!category) {
    throw new Error('Invalid category')
  }

  const data = await api.get<ArticlePage>('/api/articles', {
    params: {
      category,
      lang: locale.value,
      page: 1,
      page_size: 10,
    },
  })

  if (!data?.items || !Array.isArray(data.items)) {
    throw new Error('Invalid articles data structure')
  }

  return data.items
}, {
  server: true,
  lazy: false,
  default: () => [],

})

function selectArticle(article: ArticleDto) {
  goToArticle(article)
}
</script>

<template>
  <ArticleList :articles="articles || []" :pending="pending" :error="error" @select="selectArticle" />
</template>
