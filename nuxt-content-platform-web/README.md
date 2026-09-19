# 讯览 ContentPulse 前端演示

Nuxt 4、Vue 3、TypeScript、Vant、Pinia 与三语内容展示。当前只使用本地 Mock，独立业务后端尚未实现。

面试阅读入口：[前端导览与简短问答](../docs/FRONTEND_GUIDE.md)。按 API/SSR、路由与 sitemap、多语言 SEO、数据展示、脱敏清理五个主题提供源码入口。原在职职责为独立前端开发及后端联调，当前脱敏与个人扩展另行说明。

## 本地运行

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

默认端口 3666。变量见 `.env.example`，真实 `.env` 不提交。数据在 `app/mock`，`server/api` 为本地模拟接口，不提供真实认证或持久化。

页面统一使用 `useContentApi()`，SSR 客户端按 Nuxt 实例隔离。设计、清理依据和并发测试见 [API_CLIENT.md](../docs/API_CLIENT.md)。当前始终调用本地 Mock；USE_MOCK 只影响现有演示时钟，不会切换真实后端。

## 验证与预览

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

构建包含三语预渲染；浏览器交互仍需要 Node 服务提供 Mock API，不能只复制静态目录便假定所有功能可用。

部署完整 `.output`，以 `node .output/server/index.mjs` 或 `pnpm start` 运行。Node 独立产物验证与尚未实测的 Docker 配置边界见 [DEPLOYMENT.md](../docs/DEPLOYMENT.md)；本轮组件、图片、命名及依赖清理见 [P2_CLEANUP.md](../docs/P2_CLEANUP.md)。

`node scripts/check-demo.mjs` 检查三语路由、旧详情跳转、404 与文章数据一致性。默认本地地址 http://127.0.0.1:4366，可通过 DEMO_CHECK_URL 指定本地端口。

## 当前约束

- 无第三方统计，robots 和页面元信息默认不收录。
- 无统计或营销授权弹窗；不写入或读取旧 cookie-consent。语言、主题和页面返回状态仍使用浏览器存储；未清空用户已有偏好。
- 旧生产脚本已退役，同名入口只报错退出。
- sitemap 在构建时从共享内容目录离线生成，也可单独运行 `pnpm update-sitemaps`；无需旧授权开关。生成不会启用收录，详见 [路由与 sitemap](../docs/ROUTES_AND_SITEMAP.md)。
- 全量 lint 已通过；规则取舍和格式修复方式见 ../docs/LINT_POLICY.md。
- Mock 统计、分页边界和浏览器回归说明见 [MOCK_DATA_CONTRACT.md](../docs/MOCK_DATA_CONTRACT.md)，三语截图与报告见 [browser-review](../docs/browser-review/)。
- 后端工作暂缓，交接入口见 ../docs/README.md。

本项目源于 Nuxt Vant Mobile 模板，保留原 LICENSE 和上游署名。原工作经历与个人全栈重构分别描述。

SEO 响应更新与浏览器验证见 [SEO_REACTIVITY.md](../docs/SEO_REACTIVITY.md)。
