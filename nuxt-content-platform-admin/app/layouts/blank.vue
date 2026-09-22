<template>
  <div class="blank_layout">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.blank_layout {
  min-height: 100vh;
  background: var(--admin-bg);
}
</style>
