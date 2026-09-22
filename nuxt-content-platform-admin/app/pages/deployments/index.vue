<script setup lang="ts">
useHead({
  title: '构建状态 - 讯览资讯管理',
})
</script>

<template>
  <div class="deployments_page">
    <h1 class="page_title">
      构建状态
    </h1>
    <ApiNotConnected description="构建事件与部署状态查询尚未接入。发布文章不等于已部署；本页不会伪造成功记录。" />
    <n-card
      class="deployments_placeholder"
      size="small"
    >
      <n-empty description="暂无构建记录（接口尚未接入）" />
    </n-card>
  </div>
</template>

<style scoped lang="scss">
.page_title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}

.deployments_placeholder {
  margin-top: 16px;
}
</style>
