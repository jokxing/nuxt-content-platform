<script setup lang="ts">
/**
 * 统计类型页（2.2-12）
 * 复用已脱敏 modules；校验 type、SEO/多语言、非法回退
 */
import { useCurrentDomain } from '~/composables/useCurrentDomain'
import { useStatisticsTab } from '~/composables/useStatisticsTab'
import { DEMO_BRAND } from '~/mock/brand'
import AdvancedStatistics from '../modules/advanced-statistics.vue'
import ColdHotNumber from '../modules/cold-hot-number.vue'
import HistoricalRecords from '../modules/historical-records.vue'

const VALID_TYPES = [1, 2, 3] as const

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const { mainTab } = useStatisticsTab()
const { domain, getFullUrl } = useCurrentDomain()
const runtimeConfig = useRuntimeConfig()

const siteOrigin = (runtimeConfig.public.siteUrl as string)
  || domain
  || DEMO_BRAND.siteUrl

const brandName = computed(() => t('seo.home.schema.name'))
const typeId = computed(() => Number(route.params.id))
const isValidType = computed(() =>
  Number.isInteger(typeId.value) && VALID_TYPES.includes(typeId.value as 1 | 2 | 3),
)

function getLocalePath(path: string) {
  return locale.value === 'zh-HK' ? path : `/${locale.value}${path}`
}

if (!isValidType.value) {
  await navigateTo(getLocalePath('/statistics/type/1'), { replace: true })
}

interface StatsTab {
  id: 1 | 2 | 3
  title: string
  component: typeof ColdHotNumber | typeof HistoricalRecords | typeof AdvancedStatistics
  seoKey: 'statistics-hot-cold' | 'statistics-history' | 'statistics-advanced'
}

const tabs = computed((): StatsTab[] => [
  { id: 1, title: t('statistics.tabs.cold_hot'), component: ColdHotNumber, seoKey: 'statistics-hot-cold' },
  { id: 2, title: t('statistics.tabs.history'), component: HistoricalRecords, seoKey: 'statistics-history' },
  { id: 3, title: t('statistics.tabs.advanced'), component: AdvancedStatistics, seoKey: 'statistics-advanced' },
])

const activeTab = computed((): StatsTab => {
  const list = tabs.value
  return list.find(tab => tab.id === typeId.value) ?? list[0]!
})

watch(() => route.params.id, (newId) => {
  const n = Number(newId)
  if (Number.isInteger(n) && n >= 1 && n <= 3)
    mainTab.value = n - 1
  else
    mainTab.value = 0
}, { immediate: true })

function onTabChange(index: number) {
  mainTab.value = index
  router.push(getLocalePath(`/statistics/type/${index + 1}`))
}

const seoKey = computed(() => activeTab.value.seoKey)

const pageUrl = computed(() => getFullUrl(
  isValidType.value ? route.path : getLocalePath('/statistics/type/1'),
))

useHead(() => {
  if (!isValidType.value) {
    return {
      title: 'Redirecting…',
      meta: [{ name: 'robots', content: 'noindex,nofollow' }],
    }
  }

  const key = seoKey.value
  const tabTitle = activeTab.value.title
  return {
    title: t(`seo.${key}.title`),
    meta: [
      { name: 'description', content: t(`seo.${key}.description`) },
      { name: 'keywords', content: t(`seo.${key}.keywords`) },
      { name: 'robots', content: 'noindex,nofollow' },
      { property: 'og:title', content: t(`seo.${key}.og.title`) },
      { property: 'og:description', content: t(`seo.${key}.og.description`) },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: pageUrl.value },
      { property: 'og:image', content: `${siteOrigin}/logo.png` },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: t(`seo.${key}.twitter.title`) },
      { name: 'twitter:description', content: t(`seo.${key}.twitter.description`) },
      { name: 'twitter:image', content: `${siteOrigin}/logo.png` },
    ],
    link: [
      { rel: 'canonical', href: pageUrl.value },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: serializeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: t(`seo.${key}.schema.name`),
          description: t(`seo.${key}.schema.description`),
          url: pageUrl.value,
          inLanguage: locale.value === 'en-US' ? 'en' : locale.value,
          isPartOf: {
            '@type': 'WebSite',
            name: brandName.value,
            url: siteOrigin,
          },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: t('tabbar.home'),
                item: siteOrigin,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: t('menu.statistics'),
                item: getFullUrl(getLocalePath('/statistics')),
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: tabTitle,
                item: pageUrl.value,
              },
            ],
          },
          publisher: {
            '@type': 'Organization',
            name: brandName.value,
            url: siteOrigin,
            logo: {
              '@type': 'ImageObject',
              url: `${siteOrigin}/logo.png`,
              width: 200,
              height: 60,
            },
          },
        }),
      },
    ],
  }
})

definePageMeta({
  layout: 'default',
  name: 'statistics-type-id',
  title: '数据统计',
  i18n: 'menu.statistics',
})
</script>

<template>
  <div v-if="isValidType" class="statistics_page">
    <VanTabs
      :active="mainTab"
      sticky
      :class="{ 'is-en': locale === 'en-US' }"
      @change="onTabChange"
    >
      <VanTab
        v-for="tab in tabs"
        :key="tab.id"
        :title="tab.title"
        class="statistics_page__tab"
      />
    </VanTabs>

    <keep-alive>
      <component :is="activeTab.component" />
    </keep-alive>
  </div>
</template>

<style scoped lang="scss">
.statistics_page {
  :deep(.van-tab) {
    flex: 1;
    padding: 0 8px;
    color: #666;
    font-weight: 500;
  }

  :deep(.van-tab--active) {
    color: #0f766e;
    font-weight: 700;
  }

  :deep(.van-tabs__line) {
    background-color: #0f766e;
  }

  :deep(.van-tab__text) {
    white-space: nowrap;
    overflow: visible;
    text-overflow: unset;
  }

  :deep(.van-tabs__nav) {
    padding: 0 12px 6px;
  }

  :deep(.van-tabs__wrap) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  :deep(.van-tabs__nav--line) {
    padding-bottom: 10px;
  }

  :deep(.is-en) {
    .van-tabs__nav {
      overflow-x: auto;
      overflow-y: hidden;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .van-tab {
      flex: 0 0 auto;
      min-width: fit-content;
      padding: 0 16px;
    }
  }
}

.statistics_page__tab {
  margin-top: 2px;
}

.dark .statistics_page {
  :deep(.van-tab) {
    color: #ccc;
  }

  :deep(.van-tab--active) {
    color: #5eead4;
  }

  :deep(.van-tabs__line) {
    background-color: #5eead4;
  }
}
</style>
