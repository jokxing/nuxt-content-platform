# 讯览 ContentPulse 前端演示

Nuxt 4、Vue 3、TypeScript、Vant、Pinia 与三语内容展示。本机支持 Mock / Nitro 真实 API，生产使用 Pages 预渲染产物及受限只读 Function。文章管理与发布链路已接入，整体阅读见[项目导览](../docs/PROJECT_GUIDE.md)。

面试阅读入口：[前端导览与简短问答](../docs/frontend/FRONTEND_GUIDE.md)。按 API/SSR、路由与 sitemap、多语言 SEO、数据展示、脱敏清理五个主题提供源码入口。原在职职责为独立前端开发及后端联调，当前脱敏与个人扩展另行说明。

## 本地运行

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

默认端口 3666。变量见 `.env.example`，真实 `.env` 不提交。数据在 `app/mock`，`server/api` 为本地模拟接口，不提供真实认证或持久化。

页面统一使用 `useContentApi()`，SSR 客户端按 Nuxt 实例隔离；响应统一解包数字 `code`。设计、清理依据、直连与代理差异见 [API_CLIENT.md](../docs/frontend/API_CLIENT.md)。Mock / 真实上游由私有 `NUXT_CONTENT_API_USE_REAL` + `NUXT_CONTENT_API_BASE_URL` 控制（见 `.env.example`）。

## 验证与预览

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

构建包含三语预渲染。Node 模式由 Nitro 提供 API；当前 Pages 模式必须同时部署 functions，不能只上传静态目录便假定浏览器接口可用。

可选 Node 模式部署完整 `.output`，以 `node .output/server/index.mjs` 或 `pnpm start` 运行。当前生产采用 Pages，详见[部署说明](../docs/frontend/DEPLOYMENT.md)与[构建链路](../docs/admin/DEPLOYMENT_PIPELINE.md)。

`node scripts/check-demo.mjs` 检查三语路由、旧详情跳转、404 与文章数据一致性。默认本地地址 http://127.0.0.1:4366，可通过 DEMO_CHECK_URL 指定本地端口。

## 当前约束

- 无第三方统计，robots 和页面元信息默认不收录。
- 无统计或营销授权弹窗；不写入或读取旧 cookie-consent。语言、主题和页面返回状态仍使用浏览器存储；未清空用户已有偏好。
- 旧生产脚本已退役，同名入口只报错退出。
- sitemap 在构建时从共享内容目录离线生成，也可单独运行 `pnpm update-sitemaps`；无需旧授权开关。生成不会启用收录，详见 [路由与 sitemap](../docs/frontend/ROUTES_AND_SITEMAP.md)。
- 全量 lint 已通过；规则取舍和格式修复方式见 ../docs/frontend/LINT_POLICY.md。
- Mock 统计、分页边界和浏览器回归说明见 [MOCK_DATA_CONTRACT.md](../docs/frontend/MOCK_DATA_CONTRACT.md)，三语截图与报告见 [browser-review](../docs/frontend/browser-review/)。
- 后端与管理端已部署，导航见[文档目录](../docs/README.md)。

本项目源于 Nuxt Vant Mobile 模板，保留原 LICENSE 和上游署名。原工作经历与个人全栈重构分别描述。

SEO 响应更新与浏览器验证见 [SEO_REACTIVITY.md](../docs/frontend/SEO_REACTIVITY.md)。
