<script setup lang="ts">
/**
 * 404 布局：返回上一页或首页（带语言前缀）
 */
const router = useRouter()
const { locale, t } = useI18n()

function getLocalePath(path: string) {
  return locale.value === 'zh-HK' ? path : `/${locale.value}${path}`
}

function onBack() {
  if (import.meta.client && window.history.state.back)
    history.back()
  else
    router.replace(getLocalePath('/'))
}
</script>

<template>
  <main class="layout_404">
    <van-icon name="warn-o" size="3em" class="layout_404__icon" />
    <slot />

    <div class="layout_404__actions">
      <button
        type="button"
        class="layout_404__back"
        van-haptics-feedback
        @click="onBack"
      >
        {{ t('error_page.back_btn') }}
      </button>
    </div>
  </main>
</template>

<style scoped lang="scss">
.layout_404 {
  min-height: 60vh;
  padding: 48px 16px 32px;
  text-align: center;
  color: #9ca3af;

  &__icon {
    color: #0f766e;
  }

  &__actions {
    margin-top: 16px;
  }

  &__back {
    margin: 12px 8px 0;
    padding: 8px 20px;
    border: 1px solid #0f766e;
    border-radius: 6px;
    background: transparent;
    color: #0f766e;
    font-size: 14px;
    cursor: pointer;
  }
}

.dark .layout_404 {
  color: #d1d5db;

  .layout_404__icon,
  .layout_404__back {
    color: #5eead4;
  }

  .layout_404__back {
    border-color: #5eead4;
  }
}
</style>
