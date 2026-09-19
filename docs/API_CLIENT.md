# API 入口与 SSR 实例隔离

2026-09-18。当前仅有本地 Nitro Mock API，没有真实业务后端、认证或持久化。

## 调用链与设计

页面在 setup 调用 `const api = useContentApi()`，随后在 useAsyncData 或事件回调中调用 `api.get('/api/articles', { params: { lang, page } })`。显式响应类型可使用 `api.get<ResponseType>(...)`。API composable 只在 setup 获取当前 Nuxt 实例，异步函数不再重新查找 Nuxt 上下文。

调用链：页面 → useContentApi → 当前 Nuxt 应用的 contentApi → Nitro `/api/*` → Mock。

- `app/plugins/content-api.ts` 在插件执行时创建 `$fetch.create({})` 及客户端。服务端每次渲染有自己的 Nuxt 应用；客户端在本浏览器应用内复用。不再有模块级 `let http`、错误回调或请求头状态。
- `app/api/client.ts` 是可独立测试的工厂，只接受注入的 transport。允许已知本地路径与数字文章 ID，拒绝绝对地址、查询串拼接、路径穿越和未知接口。参数通过 params 传入，不修改调用者参数，也不保存上一次的语言或筛选条件。
- SSR 的 Nuxt `$fetch` 对相对 Nitro API 做内部分发，无需 HTTP 请求自己的监听端口；浏览器使用同源 HTTP。两端走同一 API 边界，不再一个直读 Mock、另一个请求接口。
- 统一超时 10 秒、不自动重试。错误原样向上传递，由现有页面决定错误态/重试方式；没有新建全局 toast。首页历史与推荐模块删除三轮嵌套重试及二次请求兜底，失败进入已有 error 分支。
- 不读取 localStorage token，不复制 SSR 来访 Cookie/Authorization 到请求。当前是公开 Mock，尚无身份功能。后端引入认证时需要单独设计受控请求头转发，不能将用户凭据塞到共享默认值中。

## 清理依据

迁移了首页、推荐、历史、资讯三个列表、两个详情入口、统计三个模块/图表及工具页。扫描确认页面中不再直接 `$fetch`，也不再通过旧业务封装直读 Mock。

- 删除 api/http.ts、api/mark-six/index.ts、plugins/http.ts：消费者已迁移，旧模块级客户端与动态端点解析不再需要。
- 删除 stores/api.ts 与 app.vue 的服务端/挂载重复初始化；首页不再等待接口目录 Store 才补请求。API 地址由当前本地契约明确，不需要先请求目录再拼接。
- 删除 utils/api-domain.ts：不再需要把任意外部地址剥成相对路径的兜底。
- 删除 api/prose.ts 与 stores/prose.ts：除两者互相引用外无消费者；保留 Nitro `/api/prose` 等既有接口响应，未擅自删接口。
- 删除无消费者的 runtimeConfig.public.apiBase 和环境示例项。NUXT_PUBLIC_USE_MOCK 仍被演示时钟使用，不是切换真实后端的开关；当前所有业务请求都走本地 Mock。
- 现有 Pinia state 工厂、useState 的新闻/统计 Tab 状态已按实例创建，本轮保留；没有为了清理重命名所有兼容业务字段。

## 验证与边界

在前端目录：

```powershell
pnpm exec tsx scripts/check-api-client.ts
pnpm lint
pnpm typecheck
pnpm build
# 启动本地生产服务后
$env:DEMO_CHECK_URL = 'http://127.0.0.1:4378'
node scripts/check-ssr-isolation.mjs
node scripts/check-demo.mjs
```

check-api-client 验证两个独立 transport 的 40 个并发调用、参数不被修改、错误身份/状态保留、非法路径不触发传输。check-ssr-isolation 使用不在预渲染清单中的有效前导零文章 ID，发起 24 个并发 SSR 请求，混合路由语言与 Cookie，检查渲染语言隔离。测试是公开页面与参数隔离的证据，不代表未来登录系统已验证。

另复跑统计 Mock 检查、三语 72 页面浏览器矩阵、9 组连续交互和 28 次 SEO 客户端切换/6 个 SSR 页面。对应记录仍在 browser-review。未测试实体设备、真实远端后端或认证；没有部署、推送 Git 或访问原公司服务。

面试短答：Node SSR 会复用模块，所以模块级可变 HTTP 实例可能保留上一次请求状态。我在 Nuxt 插件内创建每次渲染所属的客户端，页面 setup 捕获后使用；语言与参数只存在于单次调用，不进入共享默认配置，再用并发 SSR 和独立 transport 测试验证。
