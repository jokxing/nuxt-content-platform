import process from 'node:process'

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
      publicSiteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3666',
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
