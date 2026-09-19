<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useArticleNavigation } from '~/composables/useArticleNavigation'
import { useNewsTab } from '~/composables/useNewsTab'
import { NEWS_CATEGORIES } from '~/constants/news-categories'
import { getArticleCoverImage } from '~/utils/common'

const api = useContentApi()

const route = useRoute()
const { locale, t } = useI18n()
const newsTab = useNewsTab()
const { goToArticle } = useArticleNavigation({
  basePath: () => `/news/${String(route.params.category || 'story')}/article`,
  idKey: 'id',
})

interface Article {
  id: number
  title: string
  content: string
  image: string
  publish_time: string
  category: string
}

// 添加一个ref来控制v-html内容的显示
const showHtmlContent = ref(false)

// 在组件挂载后延迟显示v-html内容
onMounted(() => {
  setTimeout(() => {
    showHtmlContent.value = true
  }, 1500) // 延迟1.5秒显示
})

// 根据路由参数同步tab状态到store（仅在带type参数的路由时）
const typeId = computed(() => route.params.id ? Number(route.params.id) - 1 : -1)
const hasTypeParam = computed(() => route.path.includes('/type/'))

// 确保在独立路由时清除状态
if (!hasTypeParam.value) {
  newsTab.storyTab.value = -1
}
else if (typeId.value >= 0) {
  newsTab.storyTab.value = typeId.value
}

// 使用useAsyncData获取文章列表，支持SSR
const { data: articles, error, pending } = await useAsyncData(() => `news-story-articles-${locale.value}-${route.params.category}-${route.params.id || 'default'}`, async () => {
  try {
    // 获取当前路由参数
    const routeCategory = route.params.category as string
    const typeId = route.params.id ? Number(route.params.id) : 0

    // 根据当前路由类型决定传递的category参数
    let category: string

    // 检查当前路由是否包含type参数
    const hasTypeParam = route.path.includes('/type/')

    if (hasTypeParam && typeId >= 1) {
      // 有二级tab选中，传递子分类
      category = NEWS_CATEGORIES.getCategory(routeCategory, typeId)
    }
    else {
      // 独立路由，传递父分类
      category = NEWS_CATEGORIES.getParentCategory(routeCategory)

      // 如果父分类为空，尝试直接使用 'news-story'
      if (!category) {
        category = 'news-story'
      }
    }

    if (!category) {
      throw new Error('Invalid category')
    }

    // eslint-disable-next-line no-useless-catch
    try {
      // 使用超极简API调用设置 - 专门针对面板环境
      const lang = locale.value === 'zh-CN' ? 'sc' : locale.value === 'en-US' ? 'en' : 'tc'
      const data = await api.get('/api/articles', {
        params: {
          category,
          lang,
          page: 1,
          page_size: 10,
        },
      }) as any

      // 验证数据结构
      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid articles data structure')
      }

      return data.data
    }
    catch (err: any) {
      throw err
    }
  }
  catch {
    return []
  }
}, {
  server: true,
  lazy: false,
  default: () => [],

})

function getSafeHtmlContent(content: string | undefined) {
  if (!content)
    return ''
  return content
}

const processedArticles = computed(() => {
  if (!articles.value)
    return []
  return articles.value.map((article: Article) => ({
    ...article,
    safeContent: getSafeHtmlContent(article.content),
    displayTime: (article as any).publish_date || article.publish_time || '',
  }))
})
</script>

<template>
  <div class="pb-60px bg-[#f7f8fa] min-h-screen news-content">
    <!-- 加载状态 -->
    <div v-if="pending" class="py-8 text-center">
      <VanLoading type="spinner" vertical>
        {{ t('common.loading') }}
      </VanLoading>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="py-8 text-center">
      <div class="text-sm text-red-500">
        {{ error.message || t('news.fetch_failed') }}
      </div>
    </div>

    <!-- 文章列表 -->
    <div v-else class="p-16px">
      <template v-if="!articles || articles.length === 0">
        <div class="text-[#999] py-32px text-center">
          {{ t('common.no_data') }}
        </div>
      </template>
      <template v-else>
        <div
          v-for="article in processedArticles"
          :key="article.id"
          class="article-card mb-10px rounded-8px bg-white cursor-pointer overflow-hidden hover:bg-gray-50"
          @click="goToArticle(article)"
        >
          <div class="p-12px flex items-center relative">
            <div class="rounded-4px bg-[#f5f5f5] flex flex-shrink-0 h-80px w-120px items-center justify-center overflow-hidden">
              <img
                :src="getArticleCoverImage(article, '/logo.svg') as string"
                :alt="article.title"
                class="h-full w-full object-cover"
              >
            </div>
            <div class="mx-12px flex-1 overflow-hidden">
              <div class="article-title text-15px text-[#333] font-500 mb-8px whitespace-nowrap text-ellipsis overflow-hidden">
                {{ article.title }}
              </div>
              <!-- 延迟显示v-html内容 -->
              <template v-if="showHtmlContent">
                <p class="article-summary text-12px text-[#666] line-clamp-2" v-html="article.safeContent" />
              </template>
              <template v-else>
                <p class="article-summary text-12px text-[#666] line-clamp-2">
                  {{ article.content ? article.content.replace(/<[^>]*>/g, '') : '' }}
                </p>
              </template>
              <div class="article-time text-12px text-[#999] mt-8px">
                {{ article.displayTime }}
              </div>
            </div>
            <van-icon name="arrow" class="text-16px text-[#969799] right-12px top-1/2 absolute -translate-y-1/2" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pb-60px {
  padding-bottom: 60px;
}

.min-h-screen {
  min-height: 100vh;
}

.article-summary {
  font-size: 12px !important;
  font-weight: normal !important;
  color: #666 !important;
  line-height: 1.6;
}

.article-summary :deep(h1),
.article-summary :deep(h2),
.article-summary :deep(h3),
.article-summary :deep(h4),
.article-summary :deep(h5),
.article-summary :deep(h6),
.article-summary :deep(strong),
.article-summary :deep(b),
.article-summary :deep(p),
.article-summary :deep(div),
.article-summary :deep(span) {
  font-size: 12px !important;
  font-weight: normal !important;
  margin: 0 !important;
  color: #666 !important;
}

/* 暗黑模式样式 */
.dark .news-content {
  background-color: #1a1a1a !important;
}

.dark .article-card {
  background: #2a2a2a !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
}

.dark .article-card:hover {
  background: #333 !important;
}

.dark .article-title {
  color: #fff !important;
}

.dark .article-summary {
  color: #ccc !important;
}

.dark .article-summary :deep(h1),
.dark .article-summary :deep(h2),
.dark .article-summary :deep(h3),
.dark .article-summary :deep(h4),
.dark .article-summary :deep(h5),
.dark .article-summary :deep(h6),
.dark .article-summary :deep(strong),
.dark .article-summary :deep(b),
.dark .article-summary :deep(p),
.dark .article-summary :deep(div),
.dark .article-summary :deep(span) {
  color: #ccc !important;
}

.dark .article-time {
  color: #aaa !important;
}
</style>
