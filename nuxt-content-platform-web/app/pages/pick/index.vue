<script setup lang="ts">
/**
 * 智能推荐组合 / 筛选工具（2.2-13）
 * BUSINESS_MAPPING.aiPrediction；刷新固定示例，Mock 固定可复现
 */
import { useCurrentDomain } from '~/composables/useCurrentDomain'
import { DEMO_BRAND } from '~/mock/brand'

const api = useContentApi()

interface AiRecommendation {
  numbers: number[]
  reason: string
  tags?: string[]
}

interface AiPredictionResponse {
  recommendations: AiRecommendation[]
}

const { locale, t } = useI18n()
const { domain, getFullUrl } = useCurrentDomain()
const runtimeConfig = useRuntimeConfig()
const loading = ref(false)

const siteOrigin = (runtimeConfig.public.siteUrl as string)
  || domain
  || DEMO_BRAND.siteUrl

const brandName = computed(() => t('seo.home.schema.name'))

function getLocalePath(path: string) {
  return locale.value === 'zh-HK' ? path : `/${locale.value}${path}`
}

const pageUrl = computed(() => getFullUrl(getLocalePath('/pick')))

useHead(() => ({
  title: t('seo.ai-pick.title'),
  meta: [
    { name: 'description', content: t('seo.ai-pick.description') },
    { name: 'keywords', content: t('seo.ai-pick.keywords') },
    { name: 'robots', content: 'noindex,nofollow' },
    { property: 'og:title', content: t('seo.ai-pick.og.title') },
    { property: 'og:description', content: t('seo.ai-pick.og.description') },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: pageUrl.value },
    { property: 'og:image', content: `${siteOrigin}/logo.png` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: t('seo.ai-pick.twitter.title') },
    { name: 'twitter:description', content: t('seo.ai-pick.twitter.description') },
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
        name: t('seo.ai-pick.schema.name'),
        description: t('seo.ai-pick.schema.description'),
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
              name: t('menu.pick'),
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
        mainEntity: {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: t('seo.ai-pick.faq.questions.how_ai_predict.question'),
              acceptedAnswer: {
                '@type': 'Answer',
                text: t('seo.ai-pick.faq.questions.how_ai_predict.answer'),
              },
            },
            {
              '@type': 'Question',
              name: t('seo.ai-pick.faq.questions.ai_accuracy.question'),
              acceptedAnswer: {
                '@type': 'Answer',
                text: t('seo.ai-pick.faq.questions.ai_accuracy.answer'),
              },
            },
            {
              '@type': 'Question',
              name: t('seo.ai-pick.faq.questions.update_frequency.question'),
              acceptedAnswer: {
                '@type': 'Answer',
                text: t('seo.ai-pick.faq.questions.update_frequency.answer'),
              },
            },
          ],
        },
      }),
    },
  ],
}))

definePageMeta({
  layout: 'default',
  name: 'pick',
  title: '智能筛选',
  i18n: 'menu.pick',
})

const { data: predictions, error, pending, refresh } = await useAsyncData(
  () => `aiPredictions-${locale.value}`,
  async () => {
    try {
      const data = await api.get<AiPredictionResponse>('/api/ai-prediction', {
        params: { lang: locale.value },
      })

      if (!data?.recommendations || !Array.isArray(data.recommendations))
        throw createError({ statusCode: 500, statusMessage: t('pick.fetch_failed') })

      return data.recommendations.map(item => ({
        numbers: item.numbers,
        reason: item.reason,
      }))
    }
    catch {
      return []
    }
  },
  {
    default: () => [] as { numbers: number[], reason: string }[],

  },
)

async function refreshExample() {
  loading.value = true
  try {
    await refresh()
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pick_page">
    <div class="pick_page__header">
      <h5 class="pick_page__title">
        {{ t('pick.prediction_title') }}
      </h5>
      <p class="pick_page__note">
        {{ t('pick.demo_note') }}
      </p>
      <VanButton
        size="small"
        type="primary"
        color="#0f766e"
        class="pick_page__action"
        :loading="loading || pending"
        @click="refreshExample"
      >
        {{ t('pick.refresh_example') }}
      </VanButton>
    </div>

    <div v-if="pending || loading" class="pick_page__state">
      <VanLoading type="spinner" vertical>
        {{ t('pick.ai_analyzing') }}
      </VanLoading>
    </div>

    <div v-else-if="error" class="pick_page__state pick_page__state--error">
      {{ error.message || t('pick.fetch_failed') }}
    </div>

    <div v-else-if="predictions?.length" class="pick_page__list">
      <div
        v-for="(group, index) in predictions"
        :key="index"
        class="prediction_card"
      >
        <div class="prediction_card__bar" />
        <div class="prediction_card__body">
          <div class="prediction_card__title">
            {{ t('pick.group_label', { n: index + 1 }) }}
          </div>
          <div class="prediction_card__numbers">
            <BallNumber
              v-for="number in group.numbers"
              :key="number"
              :number="number"
              :size="32"
            />
          </div>
          <p class="prediction_card__reason">
            {{ group.reason }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="pick_page__state">
      {{ t('pick.empty') }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.pick_page {
  &__header {
    padding: 16px 16px 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  &__title {
    margin: 0 0 8px;
    width: 100%;
    font-size: 14px;
    font-weight: 600;
    color: #0f766e;
    line-height: 1.5;
  }

  &__note {
    margin: 0 0 12px;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
  }

  &__action {
    font-size: 12px;
    height: 28px;
    padding: 0 12px;
  }

  &__state {
    padding: 32px 16px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;

    &--error {
      color: #ef4444;
    }
  }

  &__list {
    padding: 16px;
  }
}

.prediction_card {
  position: relative;
  display: flex;
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  &__bar {
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    border-radius: 2px;
    background: #0f766e;
  }

  &__body {
    flex: 1;
    padding-left: 10px;
  }

  &__title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #666;
  }

  &__numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__reason {
    margin: 0;
    font-size: 12px;
    color: #666;
    line-height: 1.6;
  }
}

.dark {
  .prediction_card {
    background: #2a2a2a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .prediction_card__title {
    color: #fff;
  }

  .prediction_card__reason {
    color: #ccc;
  }

  .pick_page__title {
    color: #5eead4;
  }

  .pick_page__note {
    color: #9ca3af;
  }
}
</style>
