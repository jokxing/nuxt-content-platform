import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'
import zhCN from 'vant/es/locale/lang/zh-CN'
import zhHK from 'vant/es/locale/lang/zh-HK'

export default defineNuxtPlugin(() => {
  // The URL determines the locale on SSR and hydration; stored preferences must not override deep links.
  const packs = { 'zh-CN': zhCN, 'zh-HK': zhHK, 'en-US': enUS }
  const locale = useNuxtApp().$i18n.locale
  watch(locale, (code) => {
    if (code === 'zh-CN' || code === 'zh-HK' || code === 'en-US')
      Locale.use(code, packs[code])
  }, { immediate: true })
})
