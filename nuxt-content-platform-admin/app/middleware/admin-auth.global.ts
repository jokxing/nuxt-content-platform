/**
 * 全局会话守卫：未登录进 /login；已登录访问 /login 转到 /articles。
 * 会话经同源 BFF + Cookie 恢复；不共享跨请求的内存会话（useState 按请求隔离）。
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAdminAuth()

  try {
    await auth.ensureSession()
  }
  catch {
    auth.clearSession()
  }

  if (to.path === '/login') {
    if (auth.isAuthenticated.value)
      return navigateTo('/articles')
    return
  }

  if (!auth.isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    })
  }
})
