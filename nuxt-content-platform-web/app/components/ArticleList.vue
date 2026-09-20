<script setup lang="ts">
import type { ArticleDto } from '~/types/content'
import { getArticleCoverImage } from '~/utils/common'
import { formatPublishDateForDisplay } from '~/utils/publishTime'

defineProps<{
  articles: ArticleDto[]
  pending: boolean
  error?: Error | null
}>()

const emit = defineEmits<{
  select: [article: ArticleDto]
}>()

const { locale, t } = useI18n()

/** 列表只展示纯文本摘要；正文 HTML 仅在详情页渲染。 */
function toSummary(content: string): string {
  return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
</script>

<template>
  <div class="pb-60px bg-[#f7f8fa] min-h-screen news-content">
    <div v-if="pending" class="py-8 text-center">
      <VanLoading type="spinner" vertical>
        {{ t('common.loading') }}
      </VanLoading>
    </div>
    <div v-else-if="error" class="py-8 text-center">
      <div class="text-sm text-red-500">
        {{ error.message || t('news.fetch_failed') }}
      </div>
    </div>
    <div v-else class="p-16px">
      <div v-if="articles.length === 0" class="text-[#999] py-32px text-center">
        {{ t('common.no_data') }}
      </div>
      <div
        v-for="article in articles"
        v-else
        :key="article.id"
        class="article-card mb-10px rounded-8px bg-white cursor-pointer overflow-hidden hover:bg-gray-50"
        @click="emit('select', article)"
      >
        <div class="p-12px flex items-center relative">
          <div class="rounded-4px bg-[#f5f5f5] flex flex-shrink-0 h-80px w-120px items-center justify-center overflow-hidden">
            <img :src="getArticleCoverImage(article, '/logo.svg') as string" :alt="article.title" class="h-full w-full object-cover">
          </div>
          <div class="mx-12px flex-1 overflow-hidden">
            <div class="article-title text-15px text-[#333] font-500 mb-8px whitespace-nowrap text-ellipsis overflow-hidden">
              {{ article.title }}
            </div>
            <p class="article-summary text-12px text-[#666] line-clamp-2">
              {{ toSummary(article.content) }}
            </p>
            <div class="article-time text-12px text-[#999] mt-8px">
              {{ formatPublishDateForDisplay(article.publish_date, locale) }}
            </div>
          </div>
          <van-icon name="arrow" class="text-16px text-[#969799] right-12px top-1/2 absolute -translate-y-1/2" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-summary { line-height: 1.6; }
.pb-60px { padding-bottom: 60px; }
.min-h-screen { min-height: 100vh; }
.dark .news-content { background-color: #1a1a1a !important; }
.dark .article-card { background: #2a2a2a !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important; }
.dark .article-card:hover { background: #333 !important; }
.dark .article-title { color: #fff !important; }
.dark .article-summary { color: #ccc !important; }
.dark .article-time { color: #aaa !important; }
</style>
