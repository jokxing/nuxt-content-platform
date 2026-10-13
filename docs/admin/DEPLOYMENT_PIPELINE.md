# A7 构建触发与部署状态

## 工作流程

1. 发布、修改已发布文章或下线时，业务事务同时写入 `BuildEvent(QUEUED)`。
2. 独立 worker 每隔一段时间读取事件；默认等待 120 秒，把窗口内的多次内容变化合并成一次构建。
3. worker 使用后端环境变量中的 GitHub Token 调用 `workflow_dispatch`。浏览器和管理端 BFF 都接触不到 Token。
4. GitHub Actions 获取真实内容目录，执行 Nuxt typecheck、build、SSR/SEO/sitemap 审计；全部成功后才部署 Cloudflare Pages。因此构建失败会保留上一线上版本。
5. worker 后续轮询 GitHub Actions：运行中保持 `RUNNING`，成功写 `SUCCEEDED`，失败写 `FAILED` 与安全错误摘要。
6. 管理端 `/deployments` 展示数据库中的真实事件。失败事件可重新排队；重试复用原事件与 `dedupeKey`，不会新增重复记录。

`SKIPPED` 表示该事件已合并进同一批次的主事件，并非内容被丢弃。批次主事件的 GitHub Actions 结果代表这一批内容变化。

## GitHub 配置

仓库 Actions secrets：

- `CONTENT_API_BASE_URL`：GitHub Runner 可访问的后端公开地址。
- `CLOUDFLARE_API_TOKEN`：仅指定账户的 Cloudflare Pages 编辑权限（账户级）。
- `CLOUDFLARE_ACCOUNT_ID`。

仓库 Actions variables：

- `DEPLOY_ENABLED`：全部配置并完成首次验证后设为 `true`；未设置时定时任务安全跳过。
- `PUBLIC_SITE_URL`：公开站正式域名。
- `CLOUDFLARE_PAGES_PROJECT`：Pages 项目名。

后端私有环境变量：

- `BUILD_GITHUB_OWNER`、`BUILD_GITHUB_REPO`。
- `BUILD_GITHUB_WORKFLOW=content-deploy.yml`、`BUILD_GITHUB_REF=master`（与当前默认分支一致）。
- `BUILD_GITHUB_TOKEN`：建议 Fine-grained token，仅目标仓库 `Actions: write`、`Contents: read`。
- `BUILD_MERGE_WINDOW_SECONDS=120`、`BUILD_WORKER_INTERVAL_SECONDS=30`。
- 容器平台上的 API 服务设置 `HOST=0.0.0.0`；本地继续使用 `127.0.0.1`。

工作流在 [content-deploy.yml](../../.github/workflows/content-deploy.yml)；UTC `17:00` 对应北京时间次日 `01:00`，也支持 GitHub 页面手动执行和 worker 的 `workflow_dispatch`。

### Pages 静态页面与浏览器 API

当前工作流构建预渲染页面，上传 `.output/public`。Node 模式的 `.output/server` 不会在 Pages 上运行；只上传静态页面时，刷新可能正常，而浏览器切页的 `/api/*` 请求会被 Pages 回退成 HTML，导致数据格式错误。

公开站 `functions/api/[[path]].ts` 由 Wrangler 在部署时编译为 Pages Function，处理同源只读请求。它与 Nitro 共用 `app/api/upstream-routes.ts` 的路径及查询白名单，仅代理公开资讯和统计接口，不转发浏览器 Cookie/Authorization，不代理管理接口。上游失败返回 JSON 错误，禁止回退演示内容。

在 Pages 项目生产与预览环境分别配置 `NUXT_CONTENT_API_BASE_URL`，值为 Express API 的 HTTPS 公网基址，不带 `/api`。GitHub Secret 同名用途不同：Runner 的 `CONTENT_API_BASE_URL` 提供构建时数据，Pages 的变量提供浏览器切页时数据；二者都必须配置。Direct Upload 项目的生产分支须与工作流 `master` 一致。

保留 Function 源码和静态目录共同部署：在 `nuxt-content-platform-web` 目录运行 `wrangler pages deploy .output/public`。仅通过控制台拖放静态目录不会编译 `functions` 目录，不能替代该步骤。

本机验证：先构建，再运行 `wrangler pages dev .output/public --port 4371 --binding NUXT_CONTENT_API_BASE_URL=<公开API基址>`，另一个终端执行 `node scripts/check-pages-api.mjs`。该检查验证 JSON 响应和不支持的路径、查询、方法被拒绝。还需在浏览器通过导航切页检查；刷新成功不能替代切页验收。

Pages Function 请求使用 Workers 配额；Free 计划与其他 Workers 共用每日 100,000 请求。无需为该修复开启付费套餐。参见 [官方计费说明](https://developers.cloudflare.com/pages/functions/pricing/)。

## 启动与检查

后端 API 与 worker 是两个进程：

```bash
pnpm dev
pnpm worker:build
```

一次轮询：

```bash
pnpm worker:build:once
```

只查看当前满足合并窗口的事件，不修改数据库、不调用 GitHub：

```bash
pnpm worker:build:dry-run
```

生产环境应由进程管理器分别守护 API 和 worker。worker 可重复启动，但数据库状态条件会避免同一主事件被重复领取；作品部署建议只运行一个 worker 实例，减少无意义轮询。

## 状态含义

| 状态 | 含义 |
| --- | --- |
| `QUEUED` | 已入库，等待合并窗口或失败后重新排队 |
| `RUNNING` | 已向 GitHub 派发或 GitHub 正在运行 |
| `SUCCEEDED` | GitHub Actions 构建、SEO 审计和 Pages 部署全部成功 |
| `FAILED` | 派发失败或 Actions 失败，可在管理端重试 |
| `SKIPPED` | 已合并到另一个主事件，由主事件代表部署结果 |

本地未配置 GitHub/Cloudflare 凭据时，只能验证 API、数据库状态机和 dry-run，不能称为真实部署成功。
