# API 入口与 SSR 实例隔离

更新：2026-09-21（B8.8 统计联调）。页面仍只请求同源 `/api/*`；资讯与统计白名单可在 Nitro 内代理到 Express。统计 Mock 与真实接口都使用 SuccessEnvelope，页面只经 `useContentApi` 解包。

## 调用链与设计

页面在 setup 调用 `const api = useContentApi()`，随后在 useAsyncData 或事件回调中调用 `api.get('/api/articles', { params: { lang, page } })`。显式响应类型可使用 `api.get<ResponseType>(...)`。API composable 只在 setup 获取当前 Nuxt 实例，异步函数不再重新查找 Nuxt 上下文。

调用链：

- 默认 / Mock：页面 → useContentApi → contentApi → Nitro `/api/*` → `app/mock`（统计响应为 `{ code: 0, msg: "ok", data }`）
- 真实资讯与统计（`NUXT_CONTENT_API_USE_REAL=true`）：同上至 Nitro，再由私有 `NUXT_CONTENT_API_BASE_URL` 代理到 Express。白名单为 articles、文章详情、categories、content-directory、latest、history、analysis、advanced-stats、number-miss、demo-combinations。**不转发 Cookie/Authorization，不允许任意路径，上游失败不回退 Mock**
- 浏览器与 SSR 都不直连 Express；上游地址只在服务端私有 runtimeConfig

- `app/plugins/content-api.ts` 在插件执行时创建 `$fetch.create({})` 及客户端。服务端每次渲染有自己的 Nuxt 应用；客户端在本浏览器应用内复用。不再有模块级 `let http`、错误回调或请求头状态。
- `app/api/client.ts` 是可独立测试的工厂，只接受注入的 transport。允许已知本地路径（含 `categories`、`content-directory`）与数字文章 ID，拒绝绝对地址、查询串拼接、路径穿越和未知接口。参数通过 params 传入，不修改调用者参数，也不保存上一次的语言或筛选条件。
- `app/api/envelope.ts`：**统一**检查数字 `code`；`code=0` 提取 `data`；非零或 HTTP 错误保留 status、msg、requestId（`ContentApiError`）。统计 Mock 与资讯 Mock 都走成功外壳。页面禁止各自解包。
- SSR 的 Nuxt `$fetch` 对相对 Nitro API 做内部分发；浏览器使用同源 HTTP。两端走同一 API 边界。
- 统一超时 10 秒、不自动重试。资讯与统计上游失败**不回退 Mock**。错误向上传递，由现有页面决定错误态；没有新建全局 toast。
- 不读取 localStorage token，不复制 SSR 来访 Cookie/Authorization 到上游。代理仅转发白名单查询参数。

## 直连 Express vs Nuxt 代理

| 方式 | 适用 | 注意 |
| --- | --- | --- |
| `http://127.0.0.1:4000/api/...` | Apifox / 后端自测 | 见完整 Success/Error 外壳；含 `code`/`msg`/`data` |
| 浏览器或 SSR → `/api/...` | 前端页面 | 仍同源；真实模式由 Nitro 代理。`useContentApi` 已解包，页面拿到的是 `data`（列表为 `{ items, total, ... }`） |
| 构建 `prepare:content` | 预渲染 + sitemap | 真实模式直连一次 `GET /api/content-directory`（不经浏览器）；写入 `.nuxt/content-directory-snapshot.json` 供 prerender 与 sitemap **共用** |

开关：私有 `NUXT_CONTENT_API_USE_REAL` + `NUXT_CONTENT_API_BASE_URL`（见 `.env.example`），不会进入浏览器运行时配置。

## 清理依据（历史）

迁移了首页、推荐、历史、资讯三个列表、两个详情入口、统计三个模块/图表及工具页。扫描确认页面中不再直接 `$fetch`，也不再通过旧业务封装直读 Mock。

- 删除 api/http.ts、api/mark-six/index.ts、plugins/http.ts 等无消费者模块；详见 2026-09-18 记录。
- Pinia / useState 按实例创建的约定保留。

## 验证与边界

在前端目录：

```powershell
pnpm exec tsx scripts/check-api-client.ts
pnpm exec tsx scripts/check-content-directory.ts
pnpm lint
pnpm typecheck
pnpm build
# 启动本地生产服务后
$env:DEMO_CHECK_URL = 'http://127.0.0.1:4378'
node scripts/check-ssr-isolation.mjs
node scripts/check-demo.mjs
```

联调真实资讯时：先启动后端 `http://127.0.0.1:4000`，前端 `.env` 设 `NUXT_CONTENT_API_USE_REAL=true` 与 `NUXT_CONTENT_API_BASE_URL`，再 `pnpm prepare:content` / `pnpm dev`。

check-api-client 另覆盖 envelope 解包与 `ContentApiError`。未测试实体设备、认证或推送部署。

面试短答：Node SSR 会复用模块，所以模块级可变 HTTP 实例可能保留上一次请求状态。我在 Nuxt 插件内创建每次渲染所属的客户端，页面 setup 捕获后使用；真实后端地址只放在服务端私有配置，由 Nitro 白名单代理，避免浏览器直连内网 Express。
