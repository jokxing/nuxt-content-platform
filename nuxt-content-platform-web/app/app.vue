<script setup lang="ts">
import type { ConfigProviderTheme } from 'vant'
import useKeepalive from '~/composables/keepalive'
import { appDescription, appName } from '~/constants'

const { t } = useI18n()

const siteName = computed(() => t('site.name', appName))
const siteDescription = computed(() => t('site.description', appDescription))

const color = useColorMode()

const mode = computed(() => {
  return color.value as ConfigProviderTheme
})

const keepAliveRouteNames = computed(() => {
  return useKeepalive().routeCaches as string[]
})

const { domain } = useCurrentDomain()
useHead(useSeo(() => ({
  title: siteName.value,
  description: siteDescription.value,
  schema: [{
    type: 'WebSite',
    data: { name: siteName.value, url: domain, description: siteDescription.value },
  }],
})))
</script>

<template>
  <VanConfigProvider :theme="mode">
    <NuxtLoadingIndicator color="repeating-linear-gradient(to right,var(--c-primary) 0%,var(--c-primary-active) 100%)" />
    <NuxtLayout>
      <keep-alive :include="keepAliveRouteNames">
        <NuxtPage />
      </keep-alive>
    </NuxtLayout>
  </VanConfigProvider>
</template>
