# 讯览资讯管理后台

目录：`nuxt-content-platform-admin`。与 `nuxt-content-platform-web`、`nuxt-content-platform-backend` 共用根 Git，不在本目录初始化独立仓库。

## 技术栈

- Nuxt 4.0.3 + TypeScript（与公开站主版本对齐）
- Naive UI（`@bg-dev/nuxt-naiveui`）
- 桌面后台布局：侧栏 + 顶栏 + 内容区
- 同源 Nitro BFF + HttpOnly Cookie 会话（不写 localStorage）

## 启动

1. 后端 `pnpm dev`（`127.0.0.1:4000`），并已 migrate；本地管理员用 `pnpm admin:ensure`（凭据仅环境变量）。
2. 管理端复制 `.env.example` 为 `.env`，确认 `NUXT_ADMIN_API_BASE_URL=http://127.0.0.1:4000`。
3. 管理端：

```bash
pnpm install
pnpm dev
```

本地默认：<http://localhost:3670>。未登录会进入 `/login`；登录后进入 `/articles`。

其它命令：`pnpm typecheck`、`pnpm lint`、`pnpm build`。

后端 Origin 白名单须包含 `http://localhost:3670`（见 backend `ADMIN_ALLOWED_ORIGINS`）。

## 目录

| 路径 | 说明 |
| --- | --- |
| `app/layouts` | `default` 后台壳、`blank` 登录页 |
| `app/pages` | `/login`、`/articles`、`/deployments`；`/` 重定向到 `/articles` |
| `app/components` | `ApiNotConnected`、`ArticleFormModal` |
| `app/composables` | `useAdminNav`、`useAdminAuth` |
| `app/middleware` | `admin-auth.global` 会话守卫 |
| `app/api` | 集中 API 客户端（白名单） |
| `server/api/admin` | Nitro 白名单 BFF |
| `app/types` | 会话与表单类型 |
| `app/assets/styles` | 主题变量与全局样式 |

## 当前范围

已完成：登录与会话、文章 CRUD/三语编辑、封面上传、发布/下线、构建事件列表和失败重试。浏览器只请求同源 `/api/admin/*`；Cookie 使用 `credentials`，CSRF 仅保存在内存。

发布成功只代表数据库提交并排队。构建页只有 `SUCCEEDED` 才显示“部署成功”；真实 GitHub Actions 与 Cloudflare Pages 需按 `docs/admin/DEPLOYMENT_PIPELINE.md` 配置外部环境。

## 环境变量

见 `.env.example`。后端地址只放私有 runtimeConfig；不得写入 `public`、浏览器存储或仓库。
