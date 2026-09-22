# nuxt-content-platform-backend

ContentPulse 资讯后端（TypeScript + Express + Prisma + MySQL）。项目状态见 `docs/STATUS.md`，接口契约见 `docs/backend/` 与 `docs/admin/`。

## 当前能力

公开 GET（资讯 + 统计）与管理认证（A2）：

| 路径 | 说明 |
| --- | --- |
| `GET /health` | 服务与数据库就绪 |
| `GET /api/categories` | 九个子分类本地化名称（缺译 → 50001） |
| `GET /api/articles` | 已发布文章分页列表 |
| `GET /api/articles/{id}` | 文章详情 |
| `GET /api/content-directory` | 构建/sitemap 用完整可见快照 |
| `GET /api/latest` | 最新可见数据期次与可空下一计划（无可见期次 → 40402） |
| `GET /api/history` | 历史期次分页与 filter_options（page_size 最大 100） |
| `GET /api/analysis` | 频次分析（period 默认 10，最大 120；0 为空窗口） |
| `GET /api/advanced-stats` | 进阶统计（尾数/G01～G12/奇偶/相邻/完整组合） |
| `GET /api/number-miss` | 1～49 遗漏与连续命中 |
| `GET /api/demo-combinations` | 固定、可复现的演示组合 |
| `POST /api/admin/auth/login` | 单管理员登录（HttpOnly Cookie） |
| `POST /api/admin/auth/logout` | 撤销会话并清 Cookie |
| `GET /api/admin/auth/session` | 恢复会话与 CSRF token |

统一响应：

- 成功：`{ code: 0, msg: "ok", data: T }`（无 requestId）
- 失败：`{ code: 非零数字, msg, data: null, requestId }`，HTTP 仍用 400/401/403/404/429/500/503

业务时间字段为 **13 位 Unix 毫秒时间戳**。分层：`Route → Controller → Service → Prisma`。

管理认证：密码用 bcryptjs；会话 Cookie 名 `cp_admin_session`；数据库只存 SHA-256；不开放注册。本地初始化：配置 `ADMIN_BOOTSTRAP_*` 后执行 `pnpm admin:ensure`（只创建缺失账号，不写 seed）。

## 版本固定

| 工具 | 版本 |
| --- | --- |
| Node.js | >=22.12.0 |
| pnpm | 10.11.0 |
| Express | 5.2.1 |
| Prisma / @prisma/client | 6.19.3 |
| TypeScript | 5.9.2 |
| Zod | 4.1.5 |
| sanitize-html | 2.17.7 |
| bcryptjs | 3.x |
| @apidevtools/swagger-parser | 13.0.0（dev） |

## 常用命令

```bash
pnpm install
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm openapi:validate
pnpm openapi:validate:admin
pnpm test               # unit + integration
pnpm test:unit
pnpm test:sanitize
pnpm test:integration
pnpm build
pnpm dev          # 127.0.0.1:4000
pnpm start
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:status
pnpm admin:ensure # 仅创建缺失管理员（凭据来自环境变量）
```

复制 `.env.example` 为 `.env`。`ENABLE_DEBUG_ROUTES` 默认 false；`/__debug` 仅在 `NODE_ENV=test` 或显式开启时挂载，**production 禁止开启**。`ADMIN_BOOTSTRAP_PASSWORD` 等真实凭据不得提交仓库。

## 契约与 Apifox

- 公开：`docs/backend/openapi.json` + `pnpm openapi:validate`
- 管理：`docs/admin/admin-openapi.json` + `pnpm openapi:validate:admin`

## 已验证 / 未完成

- 已验证：B1～B8.8、A2 认证三接口。
- 未完成：管理端登录联调（A3）、文章写接口、发布事件、自动部署。
