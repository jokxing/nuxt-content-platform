<script setup lang="ts">
import { useRouter } from 'vue-router'

const api = useContentApi()

const router = useRouter()
const { locale, t } = useI18n()

const { data: articles, error, pending } = await useAsyncData(() => `recommendArticles-${locale.value}`, async () => {
  const data = await api.get<{ items: Array<Record<string, any>> }>('/api/articles', {
    params: {
      page: 1,
      page_size: 5,
      lang: locale.value,
    },
  })
  if (!data?.items || !Array.isArray(data.items))
    throw new Error('Invalid articles data structure')
  return data.items
})

function handleViewMore() {
  router.push(locale.value === 'zh-HK' ? '/news/education' : `/${locale.value}/news/education`)
}
</script>

<template>
  <VanCellGroup class="!mt-10" inset>
    <VanCell class="!p-0">
      <template #title>
        <div class="w-full">
          <div class="pt-14 text-center">
            <h3 class="text-base text-gray-800 font-medium dark:text-gray-200 !mb-4">
              {{ t('home.recommend.articles_title') }}
            </h3>
          </div>

          <div v-if="pending" class="py-8 text-center">
            <VanLoading type="spinner" vertical>
              {{ t('common.loading') }}
            </VanLoading>
          </div>

          <div v-else-if="error" class="text-red-500 py-8 text-center">
            {{ error.message || t('common.error.network') }}
          </div>

          <div v-else-if="articles && articles.length > 0" class="space-y-4">
            <ArticleCard
              v-for="article in articles"
              :id="article.id"
              :key="article.id"
              :title="article.title"
              :type="article.category_slug"
              :date="article.publish_date"
              :description="article.content"
              :content="article.content"
              :cover-image="article.cover_image"
            />
          </div>

          <div v-else class="text-gray-400 py-8 text-center">
            {{ t('common.no_data') }}
          </div>

          <div class="mt-4 text-center">
            <button
              class="text-12px text-gray-600 px-4 py-2 inline-flex gap-1 items-center dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              @click="handleViewMore"
            >
              <span>{{ t('home.recommend.view_more') }}</span>
              <div class="i-carbon:chevron-right h-16px w-16px" />
            </button>
          </div>
        </div>
      </template>
    </VanCell>
  </VanCellGroup>
</template>

<style scoped>
:deep(.van-cell__title) {
  width: 100%;
}
</style>
