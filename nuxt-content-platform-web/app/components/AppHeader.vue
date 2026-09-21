<script setup lang="ts">
import type { LocaleObject } from '@nuxtjs/i18n'
import type { PickerColumn } from 'vant'
import { Locale } from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { useAppFooterRouteNames as routeWhiteList } from '~/config'

const route = useRoute()
const router = useRouter()
const color = useColorMode()
const { t, locale, setLocale } = useI18n()

const showMenu = ref(false)
const showPlatformInfo = ref(false) // 新增：控制平台资料子菜单的展开/折叠

const i18n = useNuxtApp().$i18n

const showLanguagePicker = ref(false)
const languageValues = ref<string[]>([i18n.locale.value])
const { locales } = useI18n() as { locales: ComputedRef<LocaleObject[]> }

function onClickLeft(event: Event) {
  event.stopPropagation()
  showMenu.value = true
}

const title = computed(() => {
  if (!route.meta)
    return ''
  return route.meta.i18n ? t(route.meta.i18n) : (route.meta.title || '')
})

const showLeftArrow = computed(() => route.name && routeWhiteList.includes(route.name))

const isDarkMode = computed({
  get: () => color.value === 'dark',
  set: (val: boolean) => {
    color.preference = val ? 'dark' : 'light'
  },
})

function onLanguageConfirm(event: { selectedOptions: PickerColumn }) {
  const lang = event.selectedOptions[0]?.code

  setLocale(lang)
  Locale.use(lang)
  localStorage.setItem('lang', lang)

  showLanguagePicker.value = false
}

function localePath(path: string) {
  if (locale.value === 'zh-HK')
    return path
  return `/${locale.value}${path}`
}

// 平台资料仍走旧 detail 兼容入口（2.2-6）；无 Mock 稿时会回退指南列表
function handlePlatformInfoClick(articleId: string) {
  showMenu.value = false
  if (import.meta.client) {
    localStorage.setItem('platformInfoReturn', 'true')
  }
  router.push(localePath(`/news/detail/${articleId}`))
}
</script>

<template>
  <div>
    <VanNavBar
      :title="title"
      :left-arrow="!showLeftArrow"
      placeholder
      clickable
      fixed
    >
      <template #left>
        <div class="i-carbon:menu h-24px w-24px" @click="onClickLeft" />
      </template>
      <template #title>
        <h1 class="text-base !m-0">
          {{ title }}
        </h1>
      </template>
    </VanNavBar>

    <van-popup
      v-model:show="showMenu"
      position="left"
      :style="{ width: '60%', height: '100%' }"
    >
      <van-cell-group inset>
        <!-- 最新数据入口 -->
        <van-cell :title="t('menu.latestResult')" is-link @click="showMenu = false; router.push(localePath('/'))" />
        <!-- 历史数据入口 -->
        <van-cell :title="t('menu.last20Results')" is-link @click="showMenu = false; router.push(localePath('/statistics/type/2'))" />
        <!-- 平台资料分组 -->
        <van-cell
          :title="t('menu.platformInfo')"
          class="font-bold"
          is-link
          @click="showPlatformInfo = !showPlatformInfo"
        >
          <template #right-icon>
            <div class="i-carbon:chevron-down transition-transform duration-200" :class="{ 'rotate-180': showPlatformInfo }" />
          </template>
        </van-cell>
        <transition name="slide-fade">
          <div v-show="showPlatformInfo" class="submenu-container">
            <van-cell :title="t('menu.aboutUs')" is-link class="pl-4" @click="handlePlatformInfoClick('32')" />
            <van-cell :title="t('menu.contactUs')" is-link class="pl-4" @click="handlePlatformInfoClick('33')" />
            <van-cell :title="t('menu.disclaimer')" is-link class="pl-4" @click="handlePlatformInfoClick('34')" />
            <van-cell :title="t('menu.privacyPolicy')" is-link class="pl-4" @click="handlePlatformInfoClick('35')" />
            <van-cell :title="t('menu.termsOfUse')" is-link class="pl-4" @click="handlePlatformInfoClick('36')" />
            <van-cell :title="t('menu.apiDoc')" is-link class="pl-4" @click="handlePlatformInfoClick('37')" />
          </div>
        </transition>
        <!-- 语言/暗黑模式原有项 -->
        <van-cell :title="t('language')" is-link @click="showLanguagePicker = true">
          <template #value>
            {{ locale === 'zh-CN' ? '简体中文' : locale === 'zh-HK' ? '繁體中文' : 'English' }}
          </template>
        </van-cell>
        <van-cell :title="t('darkMode')">
          <template #right-icon>
            <van-switch v-model="isDarkMode" size="24" />
          </template>
        </van-cell>
      </van-cell-group>
    </van-popup>

    <van-popup v-model:show="showLanguagePicker" position="bottom">
      <van-picker
        v-model="languageValues"
        :columns="locales"
        :columns-field-names="{ text: 'name', value: 'code' }"
        :title="t('language')"
        :confirm-button-text="t('confirm')"
        :cancel-button-text="t('cancel')"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
/* 展开折叠动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 300px;
}

.submenu-container {
  overflow: hidden;
}
</style>
