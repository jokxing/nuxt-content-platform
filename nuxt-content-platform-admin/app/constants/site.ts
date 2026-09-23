/** 公开站本地默认基址（无尾斜杠）；与 NUXT_PUBLIC_SITE_URL / .env.example 一致。 */
export const DEFAULT_PUBLIC_SITE_URL = 'http://localhost:3666'

/** 去掉尾斜杠；空值回退到默认公开站地址。 */
export function resolvePublicSiteUrl(raw: string | null | undefined): string {
  const value = String(raw || '').replace(/\/+$/, '')
  return value || DEFAULT_PUBLIC_SITE_URL
}
