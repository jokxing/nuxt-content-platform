import process from 'node:process'
import { DEFAULT_PUBLIC_SITE_URL } from './app/constants/site'

const DEFAULT_MEDIA_PUBLIC_BASE_URL = 'http://127.0.0.1:4000/media'

export default defineNuxtConfig({
  modules: [
    '@bg-dev/nuxt-naiveui',
    '@nuxt/eslint',
  ],

  css: [
    '~/assets/styles/vars.scss',
    '~/assets/styles/global.scss',
  ],

  runtimeConfig: {
    // 私有：仅 Nitro BFF 使用，不进入 public，不暴露给浏览器。
    adminApiBaseUrl: process.env.NUXT_ADMIN_API_BASE_URL || '',
    public: {
      publicSiteUrl: process.env.NUXT_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL,
      /** 可信媒体基址（无尾斜杠），用于封面 URL 校验；不含密钥。 */
      mediaPublicBaseUrl: process.env.NUXT_PUBLIC_MEDIA_PUBLIC_BASE_URL || DEFAULT_MEDIA_PUBLIC_BASE_URL,
    },
  },

  hooks: {
    // Nitro 类型尚未暴露该字段；通过 hook 设置，略高于业务 5 MiB
    'nitro:config'(nitroConfig) {
      ;(nitroConfig as { maxRequestBodySize?: number }).maxRequestBodySize = 6 * 1024 * 1024
    },
  },

  app: {
    head: {
      title: '讯览资讯管理',
      meta: [
        { name: 'robots', content: 'noindex,nofollow' },
        { name: 'description', content: '讯览 ContentPulse 资讯管理后台（单管理员）' },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
})
