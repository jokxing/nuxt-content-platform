# 前端面试导览

这是一个使用 Nuxt 4、Vue 3、TypeScript、Vant 和 Pinia 的多语言资讯与数据展示项目。可以先运行前端，再沿下面五个主题阅读代码；启动步骤见 [前端 README](../../nuxt-content-platform-web/README.md)。

经历边界：在职阶段使用 Cursor 辅助完成前端并与后端同事联调；当前展示版进行脱敏及个人全栈改造。认证、文章管理和内容更新构建部署闭环已接入，真实部署与定时验收见[完整导览](../PROJECT_GUIDE.md)。本机仍可使用 Mock，组合工具为固定示例，不是 AI 推理或真实预测。

## 五分钟阅读路线

| 顺序 | 页面或操作 | 重点 |
| --- | --- | --- |
| 1 | 首页 `/zh-CN`，查看数据请求 | API 入口与 SSR 实例隔离 |
| 2 | 资讯 `/zh-CN/news/education`，进入文章 | 内容目录、动态路由与 sitemap |
| 3 | 切换语言和文章，查看页面 head | SEO 随路由、语言和内容响应更新 |
| 4 | 数据 `/zh-CN/statistics/type/2`，筛选并翻页 | 参数、数据窗口与展示一致性 |
| 5 | 对照改造记录和验证脚本 | 脱敏、兼容边界及清理依据 |

默认繁体语言没有 URL 前缀，简体和英文分别使用 `/zh-CN`、`/en-US`。演示站已公开部署但默认禁止收录，SEO 标签不等于搜索排名成果。

## 1. API 入口与 SSR 实例隔离

阅读：[Nuxt 插件](../../nuxt-content-platform-web/app/plugins/content-api.ts) → [客户端工厂](../../nuxt-content-platform-web/app/api/client.ts) → [页面获取入口](../../nuxt-content-platform-web/app/composables/useContentApi.ts)。

页面在 setup 获取客户端，统一通过受限的本地 API 路径请求数据。客户端和 transport 在 Nuxt 插件内部创建，没有模块级可变客户端；SSR 相对路径由 Nitro 内部派发，浏览器使用同源请求。`useContentApi` 统一解包数字 `code`；资讯与统计可在 `NUXT_CONTENT_API_USE_REAL=true` 时由 Nitro 白名单代理到 Express（地址仅服务端私有配置，不转发认证头，上游失败不回退 Mock）。未列入白名单的路径继续 Mock。

**问：为什么不直接导出一个全局客户端？**
答：SSR 服务会处理多个用户请求。如果全局客户端将来保存认证头或可变配置，就可能串用。我把实例放在 Nuxt 插件内部创建，页面复用当前应用的客户端。

**问：为什么浏览器不直连 `localhost:4000`？**
答：避免把内网后端地址暴露到 public runtimeConfig；同源 `/api` + 服务端白名单代理，也便于 SSR/浏览器走同一边界。

证据与细节：[API_CLIENT.md](./API_CLIENT.md)、[并发客户端检查](../../nuxt-content-platform-web/scripts/check-api-client.ts)、[SSR 并发检查](../../nuxt-content-platform-web/scripts/check-ssr-isolation.mjs)。

## 2. 路由与 sitemap 共用内容目录

阅读：[内容目录](../../nuxt-content-platform-web/scripts/content-directory.ts) → [预渲染路由](../../nuxt-content-platform-web/scripts/generate-prerender-routes.ts) / [sitemap 生成](../../nuxt-content-platform-web/scripts/generate-sitemaps.ts)。

两个构建产物消费同一份已发布内容快照（`prepare:content` 写入），减少文章路由与 sitemap 各自维护造成的遗漏。真实模式快照来自一次 `content-directory`；Mock 模式离线读 catalog。目录校验文章 ID、分类和日期（含毫秒时间戳 → lastmod），并区分可预渲染页面与应写入 sitemap 的页面。

**问：为什么预渲染和 sitemap 的 URL 数量不同？**
答：用途不同。跳转入口和筛选页可以预渲染，但 sitemap 优先保留规范内容 URL；所以共用目录不等于输出完全相同的列表。

**问：以后接真实接口，文章能实时进入 sitemap 吗？**
答：当前是构建时生成，不是实时同步。后端完成后需要把已发布内容接入目录，并明确发布后重建或另行提供动态 sitemap 的策略。

细节：[ROUTES_AND_SITEMAP.md](./ROUTES_AND_SITEMAP.md)。

## 3. 多语言 SEO 响应更新

阅读：[useSeo](../../nuxt-content-platform-web/app/composables/useSeo.ts)、[文章详情页](../../nuxt-content-platform-web/app/pages/news/%5Bcategory%5D/article/%5Bid%5D.vue)。

SEO 在 computed 中读取路由、语言和动态输入，再交给 useHead。这样客户端切换页面时，标题、canonical 和语言链接会更新；canonical 不携带筛选 query/hash。模板翻译使用 setup 中的 `t`，避免依赖编辑器对全局翻译属性的识别。

**问：简体页面为什么也有英文和繁体 hreflang？**
答：这些标签描述同一内容的不同语言地址，所以每个语言页面都会列出对应版本；canonical 则指向当前页面的规范地址。

**问：只验证首次打开页面够吗？**
答：不够。SSR 首屏正确，客户端跳转后仍可能残留旧标题或旧 URL，因此需要分别检查首屏输出和路由、语言切换后的 head。

证据与细节：[SEO_REACTIVITY.md](./SEO_REACTIVITY.md)、[SEO 检查脚本](../../nuxt-content-platform-web/scripts/check-seo.mjs)。

## 4. 筛选、分页与图表数据

阅读：[历史记录模块](../../nuxt-content-platform-web/app/pages/statistics/modules/historical-records.vue)、[图表模块](../../nuxt-content-platform-web/app/pages/statistics/modules/chart-analysis.vue)、[统计计算](../../nuxt-content-platform-web/app/mock/statistics.ts)、[参数校验](../../nuxt-content-platform-web/app/mock/parameters.ts)。

Mock 统计由固定历史样本计算，不是给每个筛选条件随便返回一组数字。统计窗口返回实际样本数，分页和非法参数有明确边界，方便复现结果和发现展示问题。

**问：Mock 有什么展示价值？**
答：可以稳定验证筛选、分页、空态和图表之间的数据关系，避免界面能点击但结果互相矛盾。它不能替代真实数据库和线上性能验证。

**问：原接口字段为什么没有全部改名？**
答：部分字段保留兼容，页面需要的通用语义在转换层处理，避免一次性改名破坏联动。后续接真实后端时再按明确契约迁移。

阅读：[DTO 转换](../../nuxt-content-platform-web/app/api/models.ts)、[MOCK_DATA_CONTRACT.md](./MOCK_DATA_CONTRACT.md)、[统计与分页检查](../../nuxt-content-platform-web/scripts/check-mock.ts)。

## 5. 脱敏与有依据的清理

当前结构见[项目导览](../PROJECT_GUIDE.md)，验证范围见[状态](../STATUS.md)。

改造先建立本地演示基线，再处理品牌、外部服务、生产脚本和旧数据；清理组件、图片、依赖前检查引用和用途。保留必要兼容逻辑，不把代码减少数量当作改造目标。

**问：怎样判断一个组件可以删除？**
答：除了 import，还要检查 Nuxt 自动组件标签、动态引用和实际页面行为；资源要检查字符串引用。无法确认的先记录，不凭名称判断。

**问：你怎样说明质量验证的范围？**
答：区分 lint、类型检查、构建、浏览器行为和部署验证。以状态记录中的实际结果为准，未执行的检查不写成通过。

## 文字面试使用方式

可以提前向面试官说明：“我使用文字沟通，欢迎直接指出文件或函数。我会先简短回答，再结合代码补充；现场输入需要一点时间。”

回答时按“问题 → 设计理由 → 代码位置 → 验证或限制”组织，不必现场重打长篇背景。本页每个短答可以作为起点，但应结合对方实际问题回答。

## 验证与当前限制

- lint 和 typecheck 是不同检查：前者检查代码规则，后者检查类型；编辑器诊断还可能涉及语言服务状态。
- 此前已执行构建、路由/API、SSR 并发、三语浏览器交互和 SEO 检查；具体批次及后续改动以 [STATUS.md](../STATUS.md) 为准，历史通过不等于每次修改都重新执行全部检查。
- Node 独立产物及 Pages 真实部署有验证记录；实体设备和全部业务路径未全面验收，见[部署说明](./DEPLOYMENT.md)。
- 后端、管理认证和内容更新发布闭环已实现并部署，实际范围见[完整导览](../PROJECT_GUIDE.md)。
