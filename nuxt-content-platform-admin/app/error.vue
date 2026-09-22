<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}>()

const title = computed(() => {
  const code = props.error?.statusCode
  if (code === 404)
    return '页面不存在'
  return '页面出错了'
})

const detail = computed(() => {
  return props.error?.statusMessage
    || props.error?.message
    || '请返回管理首页重试。'
})

function goHome() {
  clearError({ redirect: '/articles' })
}
</script>

<template>
  <naive-config>
    <div class="error_page">
      <n-result
        :status="error?.statusCode === 404 ? '404' : 'error'"
        :title="title"
        :description="detail"
      >
        <template #footer>
          <n-button type="primary" @click="goHome">
            返回文章列表
          </n-button>
        </template>
      </n-result>
    </div>
  </naive-config>
</template>

<style scoped lang="scss">
.error_page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--admin-bg);
}
</style>
