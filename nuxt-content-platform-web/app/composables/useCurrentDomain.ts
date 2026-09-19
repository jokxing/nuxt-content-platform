import { useRuntimeConfig } from '#app'

export function useCurrentDomain() {
  const config = useRuntimeConfig()
  const domain = String(config.public.siteUrl || 'http://localhost:3666').replace(/\/$/, '')

  return {
    domain,
    getFullUrl: (path: string) => new URL(path, `${domain}/`).href,
  }
}
