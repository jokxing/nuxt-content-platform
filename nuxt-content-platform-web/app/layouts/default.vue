<template>
  <main class="flex flex-col min-h-svh">
    <AppHeader class="h-[var(--van-nav-bar-height)]" />

    <div class="flex-1">
      <slot />
    </div>

    <!-- 免责声明 -->

    <AppFooter />
  </main>
</template>
