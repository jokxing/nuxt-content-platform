import { useI18n } from '#imports'
import { navigateTo } from 'nuxt/app'
import { useNewsTab } from './useNewsTab'

interface Article {
  id?: number | string
  [key: string]: any
}

interface NavigationOptions {
  basePath?: string | (() => string)
  idKey?: string
  saveTabState?: boolean // 是否保存tab状态，默认true
}

export function useArticleNavigation(options: NavigationOptions = {}) {
  const { locale } = useI18n()
  const route = useRoute()
  const { basePath = '/news/detail', idKey = 'id', saveTabState = true } = options
  const newsTab = useNewsTab()

  const goToArticle = (article: Article): void => {
    // Every entry records its origin so a previous home visit cannot override list return.
    localStorage.setItem('articleReturnPath', route.fullPath)
    // 只有在需要保存tab状态时才保存
    if (saveTabState) {
      // 保存当前的tab状态到localStorage
      const tabState = {
        mainTab: newsTab.mainTab.value,
        teachingTab: newsTab.teachingTab.value,
        forecastingTab: newsTab.forecastingTab.value,
        storyTab: newsTab.storyTab.value,
        timestamp: Date.now(),
      }
      localStorage.setItem('newsTabState', JSON.stringify(tabState))
    }

    const langPrefix = locale.value === 'zh-HK' ? '' : `/${locale.value}`
    let path = langPrefix

    const resolvedBase = typeof basePath === 'function' ? basePath() : basePath

    // 添加基础路径
    if (resolvedBase) {
      path += resolvedBase.startsWith('/') ? resolvedBase : `/${resolvedBase}`
    }

    // 添加 ID
    const articleId = article[idKey]
    if (articleId !== undefined && articleId !== null) {
      path += `/${articleId}`
    }

    navigateTo(path)
  }

  return {
    goToArticle,
  }
}
