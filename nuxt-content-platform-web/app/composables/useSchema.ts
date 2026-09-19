import type { SchemaOptions } from '~/types/schema'
import { useHead } from 'nuxt/app'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

// 获取完整的URL
function getFullUrl(path: string) {
  const origin = useRuntimeConfig().public.siteUrl || 'http://localhost:3666'
  return new URL(path, origin).href
}

export function useSchema(input: MaybeRefOrGetter<SchemaOptions>) {
  useHead(() => {
    const options = toValue(input)
    return {
      script: [{
        key: `schema-${options.type}`,
        type: 'application/ld+json',
        innerHTML: serializeJsonLd({ '@context': 'https://schema.org', '@type': options.type, ...options.data }),
      }],
    }
  })
}
// 创建面包屑结构化数据
export function createBreadcrumbSchema(items: Array<{ name: string, url: string }>) {
  return {
    type: 'BreadcrumbList' as const,
    data: {
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: getFullUrl(item.url),
      })),
    },
  }
}

// 创建新闻文章结构化数据
export function createNewsArticleSchema(options: {
  headline: string
  description: string
  image?: string
  datePublished?: string
  dateModified?: string
  authorName?: string
}) {
  return {
    type: 'NewsArticle' as const,
    data: {
      headline: options.headline,
      description: options.description,
      image: options.image ? getFullUrl(options.image) : undefined,
      datePublished: options.datePublished,
      dateModified: options.dateModified,
      author: options.authorName
        ? {
            '@type': 'Person',
            name: options.authorName,
          }
        : undefined,
      publisher: {
        '@type': 'Organization',
        name: '訊覽 ContentPulse',
        logo: {
          '@type': 'ImageObject',
          url: getFullUrl('/logo.png'),
        },
      },
    },
  }
}

// 创建网页结构化数据
export function createWebPageSchema(options: {
  name: string
  description: string
  url: string
  breadcrumb?: ReturnType<typeof createBreadcrumbSchema>
}) {
  return {
    type: 'WebPage' as const,
    data: {
      name: options.name,
      description: options.description,
      url: getFullUrl(options.url),
      breadcrumb: options.breadcrumb?.data,
    },
  }
}
