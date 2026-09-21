<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useArticleNavigation } from '~/composables/useArticleNavigation'
import { getArticleCoverImage } from '~/utils/common'
import { formatPublishDateForDisplay } from '~/utils/publishTime'

interface Props {
  id: number
  title: string
  type: 'getting-started' | 'skills' | 'feature-notes'
    | 'current-insights' | 'last-review' | 'metric-rules'
    | 'platform-updates' | 'user-stories' | 'activity-news'
  date: string | number
  views?: number
  description?: string
  tags?: string[]
  content?: string
  coverImage?: string
}

const props = defineProps<Props>()

const { t, locale } = useI18n()
const router = useRouter()
const localePath = useLocalePath()

const displayDate = computed(() => formatPublishDateForDisplay(props.date, locale.value))

const categoryByType: Record<Props['type'], string> = {
  'getting-started': 'education',
  skills: 'education',
  'feature-notes': 'education',
  'current-insights': 'analysis',
  'last-review': 'analysis',
  'metric-rules': 'analysis',
  'platform-updates': 'story',
  'user-stories': 'story',
  'activity-news': 'story',
}

const { goToArticle } = useArticleNavigation({
  basePath: () => `/news/${categoryByType[props.type] || 'education'}/article`,
  idKey: 'id',
  saveTabState: false,
})

const typeMap = {
  'getting-started': {
    text: 'news.teaching.beginner_guide',
    icon: 'i-carbon:education',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    route: '/news/education/type/1',
  },
  skills: {
    text: 'news.teaching.advanced_tips',
    icon: 'i-carbon:education',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    route: '/news/education/type/2',
  },
  'feature-notes': {
    text: 'news.teaching.game_rules',
    icon: 'i-carbon:education',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    route: '/news/education/type/3',
  },
  'last-review': {
    text: 'news.forecasting.last_review',
    icon: 'i-carbon:analytics',
    color: 'text-red-500',
    bg: 'bg-red-50',
    route: '/news/analysis/type/1',
  },
  'current-insights': {
    text: 'news.forecasting.current_prediction',
    icon: 'i-carbon:analytics',
    color: 'text-red-500',
    bg: 'bg-red-50',
    route: '/news/analysis/type/2',
  },
  'metric-rules': {
    text: 'news.forecasting.special_pattern',
    icon: 'i-carbon:analytics',
    color: 'text-red-500',
    bg: 'bg-red-50',
    route: '/news/analysis/type/3',
  },
  'platform-updates': {
    text: 'news.story.platform_updates',
    icon: 'i-carbon:document',
    color: 'text-green-500',
    bg: 'bg-green-50',
    route: '/news/story/type/1',
  },
  'user-stories': {
    text: 'news.story.user_stories',
    icon: 'i-carbon:document',
    color: 'text-green-500',
    bg: 'bg-green-50',
    route: '/news/story/type/2',
  },
  'activity-news': {
    text: 'news.story.activity_news',
    icon: 'i-carbon:document',
    color: 'text-green-500',
    bg: 'bg-green-50',
    route: '/news/story/type/3',
  },
} as const

function handleTypeClick(e: Event, route: string) {
  e.preventDefault()
  e.stopPropagation()
  router.push(localePath(route))
}

function handleArticleClick() {
  const currentPath = router.currentRoute.value.path
  localStorage.setItem('articleReturnPath', currentPath)

  goToArticle({ id: props.id })
}
</script>

<template>
  <VanCell
    class="group cursor-pointer"
    @click="handleArticleClick"
  >
    <template #title>
      <div class="flex flex-col gap-2">
        <div class="mb-6 flex gap-2 items-center">
          <span
            class="text-xs font-medium px-6 py-2 rounded-full flex gap-1 items-center"
            :class="[typeMap[type]?.color, typeMap[type]?.bg]"
            @click="(e) => handleTypeClick(e, typeMap[type]?.route)"
          >
            <div class="h-16px w-16px" :class="typeMap[type]?.icon" />
            {{ t(typeMap[type]?.text || '') }}
          </span>
          <span v-if="views" class="text-12px text-gray-400 ml-2 flex gap-1 items-center">
            <div class="i-carbon:view mr-1 h-12px w-12px" />
            {{ views }}
          </span>
        </div>

        <h3 class="text-sm text-gray-800 font-bold transition-colors line-clamp-2 dark:text-gray-200 group-hover:text-primary !mb-1">
          {{ title }}
        </h3>

        <div v-if="getArticleCoverImage({ content, coverImage }, '/logo.svg')" class="mb-2">
          <img
            :src="getArticleCoverImage({ content, coverImage }, '/logo.svg') || undefined"
            :alt="title"
            class="rounded-4px h-120px w-full object-cover"
          >
        </div>

        <p
          v-if="description"
          class="text-xs text-gray-500 line-clamp-2"
          v-html="description"
        />

        <div class="mt-1 flex items-center justify-between">
          <div v-if="tags?.length" class="flex gap-1">
            <span
              v-for="tag in tags"
              :key="tag"
              class="text-xs text-gray-600 px-2 py-0.5 rounded bg-gray-100 dark:text-gray-400 dark:bg-gray-800"
            >
              {{ tag }}
            </span>
          </div>
          <span class="text-xs text-gray-400">
            {{ displayDate }}
          </span>
        </div>
      </div>
    </template>
  </VanCell>
</template>
