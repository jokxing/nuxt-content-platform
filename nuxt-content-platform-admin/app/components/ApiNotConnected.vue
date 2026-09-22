<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <n-alert type="warning" :title="title || '接口尚未接入'" :bordered="false">
    <p>
      {{ description || '管理接口与认证尚未实现。当前仅为工程骨架占位，不包含 Mock 业务数据。' }}
    </p>
  </n-alert>
</template>
