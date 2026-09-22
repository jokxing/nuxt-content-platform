/**
 * 侧栏唯一数据源。不含动态权限树；单管理员固定菜单。
 * 新建文章不进侧栏，由文章列表页弹窗打开。
 */
export interface AdminNavItem {
  label: string
  to: string
}

export function useAdminNav(): AdminNavItem[] {
  return [
    { label: '文章列表', to: '/articles' },
    { label: '构建状态', to: '/deployments' },
  ]
}
