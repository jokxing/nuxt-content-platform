import { invalidArgument } from './errors.js'
import { LANG_ALIASES, type Locale } from './domainConstants.js'

export type { Locale } from './domainConstants.js'

/** Resolve contract lang / aliases; default zh-HK when omitted. */
export function resolveLang(raw: string | undefined): Locale {
  if (raw === undefined) {
    return 'zh-HK'
  }
  const locale = LANG_ALIASES[raw as keyof typeof LANG_ALIASES]
  if (!locale) {
    throw invalidArgument('参数不合法')
  }
  return locale
}
