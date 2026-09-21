<script setup lang="ts">
import { DEMO_BRAND } from '~/mock/brand'
import { useCurrentDomain } from '~/composables/useCurrentDomain'
import { useNewsTab } from '~/composables/useNewsTab'
import { useSeo } from '~/composables/useSeo'
import Forecasting from '../modules/forecasting.vue'
import NewsStory from '../modules/news-story.vue'
import Teaching from '../modules/teaching.vue'

const VALID_CATEGORIES = ['education', 'analysis', 'story'] as const
type NewsCategory = typeof VALID_CATEGORIES[number]

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { getFullUrl, domain } = useCurrentDomain()
const newsTab = useNewsTab()
const runtimeConfig = useRuntimeConfig()

const siteOrigin = (runtimeConfig.public.siteUrl as string)
  || domain
  || DEMO_BRAND.siteUrl

const category = computed(() => String(route.params.category || ''))
const isValidCategory = computed(() =>
  VALID_CATEGORIES.includes(category.value as NewsCategory),
)

// 非法分类：回退到默认指南页（不假装成功）
if (!isValidCategory.value) {
  const fallback = locale.value === 'zh-HK' ? '/news/education' : `/${locale.value}/news/education`
  await navigateTo(fallback, { replace: true })
}

const seoKey = computed(() => {
  switch (category.value) {
    case 'education':
      return 'news-education'
    case 'analysis':
      return 'news-analysis'
    case 'story':
      return 'news-story'
    default:
      return 'news-education'
  }
})

const homeLabel = computed(() => t('tabbar.home'))

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
            name: homeLabel.value,
            item: getFullUrl(locale.value === 'zh-HK' ? '/' : `/${locale.value}`),
          },
          {
            '@type': 'ListItem',
            position: 2,
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
        { id: 2, title: t('news.teaching.advanced_tips') },
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
        { id: 1, title: t('news.story.platform_updates') },
        { id: 2, title: t('news.story.user_stories') },
        { id: 3, title: t('news.story.activity_news') },
      ]
    default:
      return []
  }
})

const mainTabIndex = computed(() =>
  mainTabs.findIndex(tab => tab.id === category.value),
)

const subTabActive = ref(-1)

watch(mainTabIndex, (index) => {
  if (index >= 0)
    newsTab.mainTab.value = index
}, { immediate: true })

watch(() => category.value, () => {
  newsTab.teachingTab.value = -1
  newsTab.forecastingTab.value = -1
  newsTab.storyTab.value = -1
  subTabActive.value = -1
}, { immediate: true })

function getLocalePath(path: string) {
  return locale.value === 'zh-HK' ? path : `/${locale.value}${path}`
}

function clearSubTabs() {
  newsTab.teachingTab.value = -1
  newsTab.forecastingTab.value = -1
  newsTab.storyTab.value = -1
  subTabActive.value = -1
}

function onMainTabChange(index: number) {
  const targetCategory = mainTabs[index]?.id
  if (!targetCategory)
    return

  newsTab.mainTab.value = index
  clearSubTabs()

  if (targetCategory === category.value)
    router.replace(getLocalePath(`/news/${targetCategory}`))
  else
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
  subTabActive.value = index
  // 类型列表页属 2.2-4；此处只保证链接可达
  router.push(getLocalePath(`/news/${category.value}/type/${index + 1}`))
}

useHead(seo)

definePageMeta({
  layout: 'default',
  title: '资讯',
  i18n: 'menu.news',
  name: 'news-category',
})
</script>

<template>
  <div class="news-page">
    <div v-if="!isValidCategory" class="invalid-category">
      <p>{{ t('news.invalid_category') }}</p>
      <NuxtLink :to="getLocalePath('/news/education')">
        {{ t('news.back_to_guides') }}
      </NuxtLink>
    </div>

    <template v-else>
      <NewsSubTabs
        :active="subTabActive"
        :tabs="subTabs"
        @change="onSubTabChange"
      />

      <div class="content-wrapper">
        <component :is="mainTabs[mainTabIndex]?.component" v-if="mainTabIndex >= 0" />
        <div v-else class="invalid-category">
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

.invalid-category {
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

.dark .invalid-category {
  color: #aaa;
}
</style>
