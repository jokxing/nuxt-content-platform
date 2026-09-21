# nuxt-content-platform-backend

ContentPulse 资讯后端（TypeScript + Express + Prisma + MySQL）。项目状态见 `docs/STATUS.md`，接口契约见 `docs/backend/`。

## 当前能力（第一批，不等于完整后端）

五个公开 GET（资讯）+ latest / history：

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

统一响应：

- 成功：`{ code: 0, msg: "ok", data: T }`（无 requestId）
- 失败：`{ code: 非零数字, msg, data: null, requestId }`，HTTP 仍用 400/404/500/503

业务时间字段为 **13 位 Unix 毫秒时间戳**。分层：`Route → Controller → Service → Prisma`。

领域常量（locale / parent_route / 九 slug / 旧别名）集中在 `src/lib/domainConstants.ts`，seed 与 query/service 共用。

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
| @apidevtools/swagger-parser | 13.0.0（dev） |

## 常用命令

```bash
pnpm install
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm openapi:validate
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
```

复制 `.env.example` 为 `.env`。`ENABLE_DEBUG_ROUTES` 默认 false；`/__debug` 仅在 `NODE_ENV=test` 或显式开启时挂载，**production 禁止开启**。

## 契约与 Apifox

- `docs/backend/openapi.json` + `pnpm openapi:validate`
- Apifox 可人工导入；B7.2 起以自动化校验为准（B7.2 未实际导入 Apifox）

## 数据期次模型（B8.1）与统计查询（B8.2–B8.7）

Prisma 已含 `DatasetPeriod` / `DatasetSchedule`。**已实现** latest、history、analysis、advanced-stats、number-miss 及固定演示组合 `demo-combinations`。前端统计联调尚未开始。

## 已验证 / 未完成

- 已验证：B1～B7.4、B8.1～B8.7。
- 未完成：认证/发布等。统计查询（B8.8）已可由 Nitro 白名单代理联调。
