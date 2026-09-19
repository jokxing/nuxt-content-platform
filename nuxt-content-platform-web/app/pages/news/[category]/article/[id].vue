<script setup lang="ts">
import { DEMO_BRAND } from '~/mock/brand'
import { useCurrentDomain } from '~/composables/useCurrentDomain'
import { useNewsTab } from '~/composables/useNewsTab'
import { getArticleCoverImage } from '~/utils/common'
import OptimizedImage from '~/components/OptimizedImage.vue'

const api = useContentApi()

/**
 * 分类作用域 canonical 详情：`/news/{education|analysis|story}/article/:id`
 * 旧入口 `/news/detail/:id` 在 2.2-6 改为兼容跳转到本页（不删除路由）
 */

const VALID_CATEGORIES = ['education', 'analysis', 'story'] as const
type NewsCategory = typeof VALID_CATEGORIES[number]

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const newsTab = useNewsTab()
const { domain, getFullUrl } = useCurrentDomain()
const runtimeConfig = useRuntimeConfig()

const siteOrigin = (runtimeConfig.public.siteUrl as string)
  || domain
  || DEMO_BRAND.siteUrl

const brandName = computed(() => t('seo.home.schema.name'))

const category = computed(() => String(route.params.category || ''))
const articleId = computed(() => String(route.params.id || ''))

const isValidCategory = computed(() =>
  VALID_CATEGORIES.includes(category.value as NewsCategory),
)

function getLocalePath(path: string) {
  return locale.value === 'zh-HK' ? path : `/${locale.value}${path}`
}

if (!isValidCategory.value) {
  await navigateTo(getLocalePath('/news/education'), { replace: true })
}

const { data: article, error: fetchError, pending } = await useAsyncData(
  `news-article-${category.value}-${articleId.value}-${locale.value}`,
  async () => {
    if (!/^\d+$/.test(articleId.value) || Array.isArray(route.params.id))
      throw createError({ statusCode: 404, statusMessage: 'Invalid article ID' })

    const lang = locale.value === 'zh-CN' ? 'sc' : locale.value === 'en-US' ? 'en' : 'tc'
    const apiUrl = `/api/articles/${articleId.value}`

    return await api.get<Record<string, any>>(apiUrl, {
      params: { lang },
    })
  },
  {
    default: () => null,
    server: true,
    watch: [articleId, category, locale],
  },
)

// Preserve the error page UI while sending the actual HTTP failure status during SSR.
if (import.meta.server && fetchError.value) {
  setResponseStatus(fetchError.value.statusCode === 404 ? 404 : 503)
}

// 分类与文章所属 parent_route 不一致时，纠正到正确分类路径
if (
  import.meta.server
    && article.value?.parent_route
    && isValidCategory.value
    && article.value.parent_route !== category.value
) {
  await navigateTo(
    getLocalePath(`/news/${article.value.parent_route}/article/${article.value.id}`),
    { replace: true },
  )
}

watch(
  () => article.value?.parent_route,
  (parent) => {
    if (!import.meta.client || !parent || !isValidCategory.value)
      return
    if (parent !== category.value) {
      router.replace(getLocalePath(`/news/${parent}/article/${article.value?.id}`))
    }
  },
)

const articleCoverImage = computed(() => {
  if (!article.value)
    return null
  return getArticleCoverImage(article.value, '/logo.svg', false)
})

function plainText(html: string, max = 150) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text)
    return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const seoConfig = computed(() => {
  if (!article.value) {
    return {
      title: `${brandName.value}｜${t('news.detail.not_found')}`,
      meta: [
        { name: 'description', content: t('news.detail.not_found') },
        { name: 'keywords', content: `${brandName.value}, ContentPulse` },
        { name: 'robots', content: 'noindex,nofollow' },
      ],
    }
  }

  const description = plainText(article.value.content)
    || t('seo.home.description')
  const keywords = [
    brandName.value,
    'ContentPulse',
    article.value.category,
    article.value.title,
  ].filter(Boolean).join(', ')
  const pageUrl = getFullUrl(route.path)
  const image = getFullUrl(articleCoverImage.value || '/logo.svg')

  return {
    title: `${article.value.title}｜${brandName.value}`,
    meta: [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'robots', content: 'noindex,nofollow' },
      { property: 'og:title', content: `${article.value.title}｜${brandName.value}` },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: pageUrl },
      { property: 'og:image', content: image },
      { property: 'og:locale', content: locale.value === 'en-US' ? 'en_US' : locale.value === 'zh-CN' ? 'zh_CN' : 'zh_HK' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: article.value.title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [
      { rel: 'canonical', href: pageUrl },
    ],
    script: [
      {
        key: 'schema-Article',
        type: 'application/ld+json',
        innerHTML: serializeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.value.title,
          image,
          author: {
            '@type': 'Organization',
            name: article.value.author || brandName.value,
            url: siteOrigin,
          },
          publisher: {
            '@type': 'Organization',
            name: brandName.value,
            logo: {
              '@type': 'ImageObject',
              url: `${siteOrigin}/logo.png`,
              width: 200,
              height: 60,
            },
          },
          datePublished: article.value.publish_date,
          dateModified: article.value.publish_date,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': pageUrl,
          },
          inLanguage: locale.value === 'en-US' ? 'en' : locale.value,
          articleSection: article.value.category,
          keywords,
        }),
      },
    ],
  }
})

useHead(seoConfig)

function handleBack() {
  const storedReturnPath = import.meta.client
    ? localStorage.getItem('articleReturnPath')
    : null
  if (storedReturnPath) {
    localStorage.removeItem('articleReturnPath')
    router.replace(storedReturnPath.startsWith('/') ? storedReturnPath : getLocalePath(`/${storedReturnPath}`))
    return
  }

  if (import.meta.client) {
    const storedTabState = localStorage.getItem('newsTabState')
    if (storedTabState) {
      try {
        const tabState = JSON.parse(storedTabState)
        if (Date.now() - tabState.timestamp < 30 * 60 * 1000) {
          localStorage.removeItem('newsTabState')
          newsTab.mainTab.value = tabState.mainTab
          newsTab.teachingTab.value = tabState.teachingTab
          newsTab.forecastingTab.value = tabState.forecastingTab
          newsTab.storyTab.value = tabState.storyTab

          let returnPath = '/news/education'
          switch (tabState.mainTab) {
            case 0:
              returnPath = tabState.teachingTab >= 0
                ? `/news/education/type/${tabState.teachingTab + 1}`
                : '/news/education'
              break
            case 1:
              returnPath = tabState.forecastingTab >= 0
                ? `/news/analysis/type/${tabState.forecastingTab + 1}`
                : '/news/analysis'
              break
            case 2:
              returnPath = tabState.storyTab >= 0
                ? `/news/story/type/${tabState.storyTab + 1}`
                : '/news/story'
              break
          }
          router.replace(getLocalePath(returnPath))
          return
        }
      }
      catch {
        localStorage.removeItem('newsTabState')
      }
    }
  }

  const cat = isValidCategory.value ? category.value : 'education'
  let returnPath = `/news/${cat}`
  if (cat === 'education' && newsTab.teachingTab.value >= 0)
    returnPath = `/news/education/type/${newsTab.teachingTab.value + 1}`
  else if (cat === 'analysis' && newsTab.forecastingTab.value >= 0)
    returnPath = `/news/analysis/type/${newsTab.forecastingTab.value + 1}`
  else if (cat === 'story' && newsTab.storyTab.value >= 0)
    returnPath = `/news/story/type/${newsTab.storyTab.value + 1}`

  router.replace(getLocalePath(returnPath))
}

definePageMeta({
  layout: 'default',
  name: 'news-category-article',
  title: '资讯详情',
  i18n: 'menu.news',
})
</script>

<template>
  <div class="article_detail_page">
    <div v-if="pending" class="article_detail_page__state">
      <van-loading type="spinner" color="#0f766e" />
      <span class="article_detail_page__hint">{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="fetchError || !article" class="article_detail_page__state">
      <van-empty
        image="error"
        :description="t('news.detail.not_found')"
      >
        <template #bottom>
          <van-button
            round
            type="primary"
            class="mt-4"
            color="#0f766e"
            @click="handleBack"
          >
            {{ t('news.detail.back') }}
          </van-button>
        </template>
      </van-empty>
    </div>

    <div v-else class="article_detail_page__body">
      <div class="article_card">
        <button type="button" class="back_button" @click="handleBack">
          <van-icon name="arrow-left" class="text-20px" />
          {{ t('news.detail.back') }}
        </button>

        <div class="article_card__inner">
          <h1 class="article_title">
            {{ article.title }}
          </h1>

          <div class="article_meta">
            <van-icon name="clock-o" class="mr-4px" />
            {{ article.publish_date }}
            <span v-if="article.author" class="ml-8px">
              <van-icon name="user-o" class="mr-4px" />
              {{ article.author }}
            </span>
          </div>

          <div v-if="articleCoverImage" class="article_cover">
            <OptimizedImage
              :src="articleCoverImage"
              :alt="article.title"
              class="h-full w-full object-cover"
              width="600"
              height="400"
            />
          </div>

          <div class="article_content">
            <div
              class="article_text"
              v-html="article.content"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.article_detail_page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: calc(60px + var(--van-tabbar-height));

  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  &__hint {
    margin-top: 8px;
    color: #666;
    font-size: 14px;
  }

  &__body {
    padding: 16px;
  }
}

.article_card {
  border-radius: 8px;
  background: #fff;
  overflow: hidden;

  &__inner {
    padding: 16px;
  }
}

.back_button {
  display: inline-flex;
  align-items: center;
  margin: 10px 0 0 10px;
  padding: 0;
  border: none;
  background: none;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}

.article_title {
  margin: 0 0 8px;
  color: #333;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
}

.article_meta {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  color: #999;
  font-size: 14px;
}

.article_cover {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.article_content {
  word-break: break-word;
  line-height: 1.8;
  padding: 16px 0;

  :deep(h2) {
    font-size: 16px;
    margin-top: 10px;
    margin-bottom: 6px;
  }

  :deep(p) {
    margin: 12px 0;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}

.article_text {
  color: #333;
  font-size: 12px;
  white-space: pre-line;
}

.dark .article_detail_page {
  background-color: #1a1a1a !important;
}

.dark .article_card {
  background: #2a2a2a !important;
}

.dark .back_button {
  color: #fff !important;
}

.dark .article_title {
  color: #fff !important;
}

.dark .article_meta {
  color: #aaa !important;
}

.dark .article_text {
  color: #ccc !important;
}

.dark .article_content :deep(h1),
.dark .article_content :deep(h2),
.dark .article_content :deep(h3),
.dark .article_content :deep(p),
.dark .article_content :deep(div),
.dark .article_content :deep(span) {
  color: #ccc !important;
}
</style>
