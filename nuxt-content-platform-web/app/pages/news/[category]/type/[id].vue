<script setup lang="ts">
import { DEMO_BRAND } from '~/mock/brand'
import { useCurrentDomain } from '~/composables/useCurrentDomain'
import { useNewsTab } from '~/composables/useNewsTab'
import { useSeo } from '~/composables/useSeo'
import Forecasting from '../../modules/forecasting.vue'
import NewsStory from '../../modules/news-story.vue'
import Teaching from '../../modules/teaching.vue'

const VALID_CATEGORIES = ['education', 'analysis', 'story'] as const
type NewsCategory = typeof VALID_CATEGORIES[number]

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { domain, getFullUrl } = useCurrentDomain()
const newsTab = useNewsTab()
const runtimeConfig = useRuntimeConfig()

const siteOrigin = (runtimeConfig.public.siteUrl as string)
  || domain
  || DEMO_BRAND.siteUrl

const category = computed(() => String(route.params.category || ''))
const typeId = computed(() => Number(route.params.id))

const isValidCategory = computed(() =>
  VALID_CATEGORIES.includes(category.value as NewsCategory),
)
const isValidType = computed(() =>
  Number.isInteger(typeId.value) && typeId.value >= 1 && typeId.value <= 3,
)

function getLocalePath(path: string) {
  return locale.value === 'zh-HK' ? path : `/${locale.value}${path}`
}

// 非法分类或类型：回退到分类列表（不假装成功）
if (!isValidCategory.value || !isValidType.value) {
  const cat = isValidCategory.value ? category.value : 'education'
  await navigateTo(getLocalePath(`/news/${cat}`), { replace: true })
}

const parentSeoKey = computed(() => {
  switch (category.value) {
    case 'analysis':
      return 'news-analysis'
    case 'story':
      return 'news-story'
    default:
      return 'news-education'
  }
})

const seoKey = computed(() => {
  const map: Record<string, Record<number, string>> = {
    education: {
      1: 'news-education-beginner',
      2: 'news-education-skills',
      3: 'news-education-rules',
    },
    analysis: {
      1: 'news-analysis-review',
      2: 'news-analysis-prediction',
      3: 'news-analysis-pattern',
    },
    story: {
      1: 'news-story-news',
      2: 'news-story-winning',
      3: 'news-story-activity',
    },
  }
  return map[category.value]?.[typeId.value] || 'news-education-beginner'
})

const seo = useSeo(() => ({
  pageKey: seoKey.value,
  schema: {
    type: 'CollectionPage',
    data: {
      name: t(`seo.${seoKey.value}.schema.name`),
      description: t(`seo.${seoKey.value}.schema.description`),
      url: getFullUrl(route.path),
      inLanguage: locale.value === 'en-US' ? 'en' : locale.value,
      isPartOf: {
        '@type': 'WebSite',
        name: t('seo.home.schema.name'),
        url: siteOrigin,
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: t('tabbar.home'),
            item: getFullUrl(locale.value === 'zh-HK' ? '/' : `/${locale.value}`),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: t(`seo.${parentSeoKey.value}.schema.name`),
            item: getFullUrl(getLocalePath(`/news/${category.value || 'education'}`)),
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: t(`seo.${seoKey.value}.schema.name`),
            item: getFullUrl(route.path),
          },
        ],
      },
      publisher: {
        '@type': 'Organization',
        name: t('seo.home.schema.publisher.name'),
        url: siteOrigin,
        logo: {
          '@type': 'ImageObject',
          url: `${siteOrigin}/logo.png`,
          width: 200,
          height: 60,
        },
      },
    },
  },
}))

useHead(seo)

const mainTabs = [
  { id: 'education', title: t('news.tabs.tutorial'), component: Teaching },
  { id: 'analysis', title: t('news.tabs.analysis'), component: Forecasting },
  { id: 'story', title: t('news.tabs.stories'), component: NewsStory },
]

const subTabs = computed(() => {
  switch (category.value) {
    case 'education':
      return [
        { id: 1, title: t('news.teaching.beginner_guide') },
        { id: 2, title: t('news.teaching.betting_skills') },
        { id: 3, title: t('news.teaching.game_rules') },
      ]
    case 'analysis':
      return [
        { id: 1, title: t('news.forecasting.last_review') },
        { id: 2, title: t('news.forecasting.current_prediction') },
        { id: 3, title: t('news.forecasting.special_pattern') },
      ]
    case 'story':
      return [
        { id: 1, title: t('news.story.lottery_news') },
        { id: 2, title: t('news.story.winning_stories') },
        { id: 3, title: t('news.story.activity_news') },
      ]
    default:
      return []
  }
})

const mainTabIndex = computed(() =>
  mainTabs.findIndex(tab => tab.id === category.value),
)

const subTabIndex = computed(() =>
  isValidType.value ? typeId.value - 1 : 0,
)

watch(
  () => [category.value, typeId.value] as const,
  ([cat, tid]) => {
    newsTab.teachingTab.value = -1
    newsTab.forecastingTab.value = -1
    newsTab.storyTab.value = -1
    if (tid >= 1 && tid <= 3) {
      if (cat === 'education')
        newsTab.teachingTab.value = tid - 1
      else if (cat === 'analysis')
        newsTab.forecastingTab.value = tid - 1
      else if (cat === 'story')
        newsTab.storyTab.value = tid - 1
    }
    if (mainTabIndex.value >= 0)
      newsTab.mainTab.value = mainTabIndex.value
  },
  { immediate: true },
)

function clearSubTabs() {
  newsTab.teachingTab.value = -1
  newsTab.forecastingTab.value = -1
  newsTab.storyTab.value = -1
}

function onMainTabChange(index: number) {
  const targetCategory = mainTabs[index]?.id
  if (!targetCategory)
    return
  newsTab.mainTab.value = index
  clearSubTabs()
  router.push(getLocalePath(`/news/${targetCategory}`))
}

function onMainTabClick(event: { name: string | number }) {
  if (event.name !== mainTabIndex.value)
    return
  clearSubTabs()
  const targetCategory = mainTabs[event.name as number]?.id
  if (targetCategory)
    router.replace(getLocalePath(`/news/${targetCategory}`))
}

function onSubTabChange(index: number) {
  if (!isValidCategory.value)
    return
  router.push(getLocalePath(`/news/${category.value}/type/${index + 1}`))
}

definePageMeta({
  layout: 'default',
  title: '资讯',
  i18n: 'menu.news',
  name: 'news-category-type-id',
})
</script>

<template>
  <div class="news-page">
    <div v-if="!isValidCategory || !isValidType" class="invalid-type">
      <p>{{ t('news.invalid_type') }}</p>
      <NuxtLink :to="getLocalePath('/news/education')">
        {{ t('news.back_to_guides') }}
      </NuxtLink>
    </div>

    <template v-else>
      <NewsSubTabs
        :active="subTabIndex"
        :tabs="subTabs"
        @change="onSubTabChange"
      />

      <div class="content-wrapper">
        <component :is="mainTabs[mainTabIndex]?.component" v-if="mainTabIndex >= 0" />
        <div v-else class="invalid-type">
          {{ t('common.no_data') }}
        </div>
      </div>

      <NewsMainTabs
        :active="mainTabIndex"
        :tabs="mainTabs"
        @change="onMainTabChange"
        @click-tab="onMainTabClick"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.news-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--van-tabbar-height) + 44px);
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
}

.invalid-type {
  padding: 48px 24px;
  text-align: center;
  color: #666;
  font-size: 14px;

  a {
    display: inline-block;
    margin-top: 12px;
    color: #0f766e;
  }
}

.dark .invalid-type {
  color: #aaa;
}
</style>
