import process from 'node:process'
import { createContentDirectory } from './scripts/content-directory'

export default defineNuxtConfig({
  modules: [
    '@vant/nuxt',
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/image',
    // 演示站不加载第三方统计
  ],

  runtimeConfig: {
    // 私有：Express 上游，仅 Nitro 代理使用，不进入 public、不暴露给浏览器。
    // 部署时仅用 NUXT_CONTENT_API_* 覆盖，构建脚本也读取同一组变量。
    contentApiBaseUrl: '',
    contentApiUseReal: false,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3666',
      domain: process.env.NUXT_PUBLIC_DOMAIN || 'http://localhost:3666',
    },
  },

  css: [
    './app/styles/vars.css',
    './app/styles/global.css',
    './app/styles/default-theme.css',
  ],

  postcss: {
    plugins: {
      autoprefixer: {},
      'postcss-mobile-forever': {
        appSelector: '#__nuxt',
        viewportWidth: 375,
        maxDisplayWidth: 600,
        exclude: /@nuxt/,
        border: true,
        rootContainingBlockSelectorList: [
          '.van-tabbar',
          '.van-popup',
          '.van-popup--bottom',
          '.van-popup--top',
          '.van-popup--left',
          '.van-popup--right',
        ],
      },
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'nuxt-color-mode',
  },

  i18n: {
    locales: [
      {
        code: 'zh-CN',
        file: 'zh-CN.json',
        name: '简体中文',
      },
      {
        code: 'zh-HK',
        file: 'zh-HK.json',
        name: '繁體中文',
      },
      {
        code: 'en-US',
        file: 'en-US.json',
        name: 'English',
      },
    ],
    defaultLocale: 'zh-HK',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      viewport: 'width=device-width,initial-scale=1,viewport-fit=cover',
      title: '訊覽 ContentPulse｜多語言資訊與數據展示（演示）',
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '訊覽（ContentPulse）演示站：多語言資訊瀏覽與數據展示作品，使用本地 Mock 數據，不連接原生產服務。' },
        { name: 'keywords', content: 'ContentPulse, 訊覽, 多語言, 資訊, 數據展示, 演示' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#ffffff' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#222222' },
        { name: 'language', content: 'zh-HK' },
        { property: 'og:locale', content: 'zh_HK' },
      ],
      // 脱敏阶段不注入第三方统计脚本
      script: [],
    },
  },

  vite: {
    build: {
      target: 'esnext',
      cssMinify: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    },
    optimizeDeps: {
      include: [
        '@intlify/core-base',
        '@intlify/shared',
      ],
    },
    // /api 由 Nitro server/api 处理；资讯与统计白名单在 NUXT_CONTENT_API_USE_REAL 时服务端代理到 Express
  },

  devtools: {
    enabled: true,
  },

  typescript: {
    shim: false,
  },

  features: {
    inlineStyles: false,
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-09-24',

  // SSR和静态化配置
  ssr: true,

  // 禁用可能导致路由问题的功能
  router: {
    options: {
      strict: false,
    },
  },

  // 添加全局fetch配置
  experimental: {
    asyncContext: true,
    payloadExtraction: false,
    viewTransition: false,
  },

  // 全局fetch配置
  nitro: {
    routeRules: {
      // 首页和基础路由使用SSR
      '/': { ssr: true },
      '/zh-CN': { ssr: true },
      '/en-US': { ssr: true },

      // 统计页面重定向到第一个类型
      '/statistics': { redirect: '/statistics/type/1' },
      '/zh-CN/statistics': { redirect: '/zh-CN/statistics/type/1' },
      '/en-US/statistics': { redirect: '/en-US/statistics/type/1' },

      // 新闻页面重定向到教育分类
      '/news': { redirect: '/news/education' },
      '/zh-CN/news': { redirect: '/zh-CN/news/education' },
      '/en-US/news': { redirect: '/en-US/news/education' },

      // 其他页面使用SSR
      '/statistics/**': { ssr: true },
      '/news/**': { ssr: true },
      '/pick/**': { ssr: true },
    },
    prerender: {
      routes: createContentDirectory().map(route => route.path),
    },
    // 不用 nitro.devProxy 透传任意路径；资讯代理在 server/api/[...].ts 内按白名单实现
  },

  // 添加客户端水合配置
  vue: {
    compilerOptions: {
      hoistStatic: false,
      isCustomElement: _tag => false,
    },
  },

  // 禁用可能导致问题的功能
  telemetry: {
    enabled: false,
  },

  // 确保构建时的一致性
  build: {
    transpile: ['chinese-simple2traditional'],
    analyze: false,
  },
})
