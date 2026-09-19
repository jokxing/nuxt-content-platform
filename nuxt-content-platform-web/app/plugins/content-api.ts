import { createContentApi } from '~/api/client'

export default defineNuxtPlugin(() => {
  // 在每个 Nuxt 应用实例内创建客户端，避免 SSR 请求之间共享可变配置。
  // 相对 /api 请求在 SSR 内部派发，浏览器端使用同源 HTTP。
  const transport = $fetch.create({})
  return { provide: { contentApi: createContentApi((path, options) => transport(path, options)) } }
})
