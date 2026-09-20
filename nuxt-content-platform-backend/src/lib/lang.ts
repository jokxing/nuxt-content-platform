import { invalidArgument } from './errors.js'

export type Locale = 'zh-HK' | 'zh-CN' | 'en-US'

const LANG_MAP: Record<string, Locale> = {
  'zh-HK': 'zh-HK',
  'zh-CN': 'zh-CN',
  'en-US': 'en-US',
  tc: 'zh-HK',
  sc: 'zh-CN',
  en: 'en-US',
}

/** Resolve contract lang / aliases; default zh-HK when omitted. */
export function resolveLang(raw: string | undefined): Locale {
  if (raw === undefined) {
    return 'zh-HK'
  }
  const locale = LANG_MAP[raw]
  if (!locale) {
    throw invalidArgument('参数不合法')
  }
  return locale
}
