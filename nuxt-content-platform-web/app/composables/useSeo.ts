import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

export interface SeoMetaOptions {
  pageKey?: string // 页面标识，用于从i18n获取翻译
  title?: string
  description?: string
  keywords?: string
  og?: {
    title?: string
    description?: string
    type?: string
    url?: string
    image?: string
  }
  twitter?: {
    card?: string
    title?: string
    description?: string
    image?: string
  }
  schema?: Array<{
    type: string
    data: Record<string, any>
  }> | {
    type: string
    data: Record<string, any>
  }
}

export function useSeo(input: MaybeRefOrGetter<SeoMetaOptions>) {
  const route = useRoute()
  const { locale, t } = useI18n()
  const { domain, getFullUrl } = useCurrentDomain()
  // 在 computed 内读取路由、语言及动态内容，使客户端导航后 head 仍保持同步。
  return computed(() => {
    const options = toValue(input)
    const canonical = getFullUrl(route.path)
    const path = route.path.replace(/^\/(zh-CN|en-US)(?=\/|$)/, '') || '/'
    const title = options.pageKey ? t(`seo.${options.pageKey}.title`) : options.title || ''
    const description = options.pageKey ? t(`seo.${options.pageKey}.description`) : options.description || ''
    const keywords = options.pageKey ? t(`seo.${options.pageKey}.keywords`) : options.keywords || ''
    const schemas = options.schema ? (Array.isArray(options.schema) ? options.schema : [options.schema]) : []
    return {
      title,
      htmlAttrs: { lang: locale.value },
      meta: [
        { name: 'robots', content: 'noindex,nofollow' },
        { name: 'description', content: description },
        { name: 'keywords', content: keywords },
        { name: 'language', content: locale.value },
        { property: 'og:title', content: options.og?.title || title },
        { property: 'og:description', content: options.og?.description || description },
        { property: 'og:type', content: options.og?.type || 'website' },
        { property: 'og:url', content: options.og?.url || canonical },
        { property: 'og:image', content: getFullUrl(options.og?.image || '/logo.svg') },
        { property: 'og:locale', content: locale.value.replace('-', '_') },
        { name: 'twitter:card', content: options.twitter?.card || 'summary' },
        { name: 'twitter:title', content: options.twitter?.title || title },
        { name: 'twitter:description', content: options.twitter?.description || description },
        { name: 'twitter:image', content: getFullUrl(options.twitter?.image || '/logo.svg') },
      ],
      link: [
        { rel: 'canonical', href: canonical },
        ...['zh-HK', 'zh-CN', 'en-US'].map(lang => ({
          key: `alternate-${lang}`,
          rel: 'alternate',
          hreflang: lang,
          href: `${domain}${lang === 'zh-HK' ? path : `/${lang}${path === '/' ? '' : path}`}`,
        })),
        { key: 'alternate-default', rel: 'alternate', hreflang: 'x-default', href: getFullUrl(path) },
      ],
      script: schemas.map(schema => ({
        key: `schema-${schema.type}`,
        type: 'application/ld+json',
        innerHTML: serializeJsonLd({ '@context': 'https://schema.org', '@type': schema.type, ...schema.data }),
      })),
    }
  })
}
