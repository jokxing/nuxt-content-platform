<script setup lang="ts">
import type { MenuOption } from 'naive-ui'

const route = useRoute()
const navItems = useAdminNav()
const auth = useAdminAuth()
const message = useMessage()

const loggingOut = ref(false)

const menuOptions = computed<MenuOption[]>(() =>
  navItems.map(item => ({
    label: item.label,
    key: item.to,
  })),
)

const activeKey = computed(() =>
  navItems.find(item => item.to === route.path)?.to ?? null,
)

const adminLabel = computed(() => auth.admin.value?.display_name || auth.admin.value?.username || '管理员')

function onMenuUpdate(key: string) {
  navigateTo(key)
}

async function onLogout() {
  if (loggingOut.value)
    return
  loggingOut.value = true
  try {
    await auth.logout()
    await navigateTo('/login')
  }
  catch {
    message.error('退出失败，请稍后重试')
  }
  finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="admin_shell">
    <aside class="admin_sidebar">
      <div class="admin_brand">
        <span class="admin_brand_name">讯览</span>
        <span class="admin_brand_sub">资讯管理</span>
      </div>
      <n-menu
        :value="activeKey"
        :options="menuOptions"
        :collapsed-width="64"
        :indent="18"
        inverted
        @update:value="onMenuUpdate"
      />
    </aside>
    <div class="admin_main">
      <header class="admin_header">
        <div class="admin_header_title">
          <slot name="title">
            资讯管理后台
          </slot>
        </div>
        <div class="admin_header_actions">
          <n-tag
            size="small"
            type="warning"
            :bordered="false"
          >
            单管理员演示
          </n-tag>
          <span class="admin_user">
            {{ adminLabel }}
          </span>
          <n-button
            text
            :loading="loggingOut"
            :disabled="loggingOut"
            @click="onLogout"
          >
            退出
          </n-button>
        </div>
      </header>
      <main class="admin_content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin_shell {
  display: flex;
  min-height: 100vh;
  background: var(--admin-bg);
}

.admin_sidebar {
  flex-shrink: 0;
  width: var(--admin-sidebar-width);
  background: var(--admin-sidebar);
  color: var(--admin-sidebar-text);
}

.admin_brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: var(--admin-header-height);
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.admin_brand_name {
  font-size: 18px;
  font-weight: 650;
  letter-spacing: 0.04em;
  color: #fff;
}

.admin_brand_sub {
  font-size: 12px;
  color: #9ca3af;
}

.admin_main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.admin_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--admin-header-height);
  padding: 0 24px;
  background: var(--admin-surface);
  border-bottom: 1px solid var(--admin-border);
}

.admin_header_title {
  font-size: 16px;
  font-weight: 600;
}

.admin_header_actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.admin_user {
  color: var(--admin-text-muted);
  font-size: 13px;
}

.admin_content {
  flex: 1;
  padding: 24px;
}
</style>
