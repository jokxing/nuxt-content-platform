import { AdminApiError, adminApiRequest } from '~/api/adminClient'
import type { AdminSessionData } from '~/types/admin'

/**
 * 管理员会话：csrf 与资料只存内存（useState）。
 * Cookie 由浏览器 HttpOnly 持有，禁止写入 localStorage。
 */
export function useAdminAuth() {
  const session = useState<AdminSessionData | null>('admin-session', () => null)
  const ready = useState<boolean>('admin-session-ready', () => false)
  const loading = useState<boolean>('admin-session-loading', () => false)

  const isAuthenticated = computed(() => Boolean(session.value?.admin?.id))
  const csrfToken = computed(() => session.value?.csrf_token ?? null)
  const admin = computed(() => session.value?.admin ?? null)

  function clearSession() {
    session.value = null
  }

  async function fetchSession(): Promise<AdminSessionData | null> {
    try {
      const data = await adminApiRequest<AdminSessionData>('/api/admin/auth/session', {
        method: 'GET',
        redirectOnUnauthorized: false,
      })
      session.value = data
      return data
    }
    catch (error: unknown) {
      session.value = null
      if (error instanceof AdminApiError && error.code === 40100)
        return null
      throw error
    }
  }

  async function ensureSession(force = false): Promise<AdminSessionData | null> {
    if (ready.value && !force)
      return session.value
    if (loading.value) {
      // 简单等待当前加载结束
      while (loading.value)
        await new Promise(resolve => setTimeout(resolve, 20))
      return session.value
    }

    loading.value = true
    try {
      await fetchSession()
      ready.value = true
      return session.value
    }
    finally {
      loading.value = false
    }
  }

  async function login(username: string, password: string): Promise<AdminSessionData> {
    const data = await adminApiRequest<AdminSessionData>('/api/admin/auth/login', {
      method: 'POST',
      body: { username, password },
      redirectOnUnauthorized: false,
    })
    session.value = data
    ready.value = true
    return data
  }

  async function logout(): Promise<void> {
    try {
      await adminApiRequest<{ logged_out: true }>('/api/admin/auth/logout', {
        method: 'POST',
        csrfToken: csrfToken.value,
        redirectOnUnauthorized: false,
      })
    }
    catch (error: unknown) {
      // 无会话时后端仍幂等成功；其它错误继续清本地态
      if (!(error instanceof AdminApiError && (error.code === 40100 || error.code === 40301)))
        throw error
    }
    finally {
      clearSession()
      ready.value = true
    }
  }

  return {
    session,
    ready,
    loading,
    isAuthenticated,
    csrfToken,
    admin,
    clearSession,
    ensureSession,
    fetchSession,
    login,
    logout,
  }
}
