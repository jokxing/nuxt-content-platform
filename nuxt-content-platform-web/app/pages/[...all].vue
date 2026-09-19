<script setup lang="ts">
/**
 * 未知路由兜底（2.2-14）
 * 保持真实 404，不伪装成功页；返回/首页带语言前缀
 */
const { t, locale } = useI18n()

function getLocalePath(path: string) {
  return locale.value === 'zh-HK' ? path : `/${locale.value}${path}`
}

const homePath = computed(() => getLocalePath('/'))

// 未知路径必须是 404，不能用 200 成功页掩盖
setResponseStatus(404)

useHead(() => ({
  title: t('error_page.title', { brand: t('seo.home.schema.name') }),
  meta: [
    { name: 'robots', content: 'noindex,nofollow' },
    { name: 'description', content: t('error_page.description') },
  ],
}))

definePageMeta({
  layout: '404',
  name: 'not-found',
})
</script>

<template>
  <div class="not_found">
    <p class="not_found__brand">
      {{ t('seo.home.schema.name') }}
    </p>
    <h1 class="not_found__code">
      404
    </h1>
    <p class="not_found__txt">
      {{ t('error_page.txt') }}
    </p>
    <p class="not_found__hint">
      {{ t('error_page.hint') }}
    </p>
    <NuxtLink :to="homePath" class="not_found__home">
      {{ t('error_page.home_btn') }}
    </NuxtLink>
  </div>
</template>

<style scoped lang="scss">
.not_found {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 24px 0;

  &__brand {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 600;
    color: #0f766e;
  }

  &__code {
    margin: 0;
    font-size: 48px;
    font-weight: 700;
    line-height: 1.2;
    color: #0f766e;
  }

  &__txt {
    margin: 12px 0 0;
    font-size: 16px;
    color: #4b5563;
  }

  &__hint {
    margin: 8px 0 0;
    font-size: 13px;
    color: #9ca3af;
    line-height: 1.5;
  }

  &__home {
    margin-top: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    height: 36px;
    padding: 0 16px;
    border-radius: 6px;
    background: #0f766e;
    color: #fff;
    font-size: 14px;
    text-decoration: none;
  }
}

.dark .not_found {
  .not_found__brand,
  .not_found__code {
    color: #5eead4;
  }

  .not_found__txt {
    color: #e5e7eb;
  }

  .not_found__hint {
    color: #9ca3af;
  }

  .not_found__home {
    background: #0f766e;
  }
}
</style>
