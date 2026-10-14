# 项目导览与设计讨论

更新：2026-10-14。面向代码阅读与面试交流，先体验公开站，再选择一条链路深入讨论，无需遍历全部管理页面。

## 项目背景与个人贡献

原项目为 Nuxt 前端业务产品，本人使用 Cursor 辅助完成前端开发并与后端联调。当前作品从原前端脱敏，补充 Express / Prisma / MySQL、文章管理端和发布部署链路，属于 AI 辅助全栈实践，不将当前全部后端、运维实现作为原工作成果或个人独立精通的证明。

重点可讨论 Vue / TypeScript 前端、SSR 请求边界、路由与 SEO、页面交互、联调排障及部署验证。演示站默认 noindex，SEO 实现不等于搜索收录或排名提升。统计与组合内容为脱敏演示，不是预测服务。

## 五到十分钟体验路线

1. 打开[公开站](https://contentpulse-web.pages.dev/)，从底部导航进入资讯和统计，再返回首页。观察客户端切页，不以刷新成功代替切页验证。
2. 查看[简体文章 101](https://contentpulse-web.pages.dev/zh-CN/news/education/article/101/)，切换语言或查看页面 head，结合正文、封面、canonical 和结构化数据说明内容与 SEO 的关系。
3. 作者按需演示文章后台：查看多语言编辑、封面上传及版本，不公开管理员凭据。默认可只看已有记录，不必现场修改线上文章。
4. 查看构建状态中的成功事件与 Actions 运行，说明数据库保存、内容发布和站点部署是不同阶段。
5. 需要实时更新演示时，由作者保存准备好的演示文章，等待 worker 合并窗口及构建，最后核对状态与公开站正文；不要承诺立即生效。

面试可用文字提问并指定下方代码入口。当前为单管理员后台，不提供访客共用管理员账号；客户端演示与源码/平台权限分别提供。

## 架构与三条链路

**读取：** Nuxt 页面 → 当前应用的 API 客户端 → 同源 /api → Nitro 或 Pages Function → Express → MySQL。

**管理：** 管理端页面 → 同源 BFF → Express 会话、Origin 与 CSRF 校验 → 业务服务 → Prisma；封面经图像处理写入 R2 和媒体元数据。

**部署：** 已发布内容更新 → 事务写入文章、审计与 BuildEvent → worker 领取 → workflow_dispatch → 真实内容预渲染及 SEO 审计 → Pages → worker 轮询结果 → 管理端读取状态。schedule 另由 GitHub 触发，不自动等于后台每日事件回写。

| 主题 | 代码入口 | 阅读重点 |
| --- | --- | --- |
| SSR 请求隔离 | [Nuxt 插件](../nuxt-content-platform-web/app/plugins/content-api.ts)、[客户端](../nuxt-content-platform-web/app/api/client.ts) | 每个 Nuxt 应用创建实例，避免模块级可变配置 |
| 内容目录 | [快照准备](../nuxt-content-platform-web/scripts/prepare-content-directory.ts)、[目录逻辑](../nuxt-content-platform-web/scripts/content-directory.ts) | 构建前取得内容目录，来源匹配及失败中止 |
| 路由与 SEO | [文章页](../nuxt-content-platform-web/app/pages/news/%5Bcategory%5D/article/%5Bid%5D.vue)、[产物审计](../nuxt-content-platform-web/scripts/audit-seo-output.mjs) | 分类规范路径、语言、响应式元数据及预渲染 HTML |
| 浏览器 API | [Pages Function](../nuxt-content-platform-web/functions/api/%5B%5Bpath%5D%5D.ts)、[共享白名单](../nuxt-content-platform-web/app/api/upstream-routes.ts) | GET 与路径/查询限制，拒绝非 JSON，不透传认证 |
| 管理会话 | [会话组合函数](../nuxt-content-platform-admin/app/composables/useAdminAuth.ts)、[BFF](../nuxt-content-platform-admin/server/utils/adminApiProxy.ts) | HttpOnly Cookie、内存 CSRF 与一次受限重试 |
| 文章事务 | [文章服务](../nuxt-content-platform-backend/src/services/adminArticleService.ts) | 版本冲突、发布完整性、审计与事件同事务 |
| 图片上传 | [媒体服务](../nuxt-content-platform-backend/src/services/adminMediaService.ts)、[图片处理](../nuxt-content-platform-backend/src/lib/imagePipeline.ts) | 魔数校验、重编码、随机 key、失败补偿删除 |
| worker | [构建服务](../nuxt-content-platform-backend/src/services/buildWorkerService.ts)、[部署服务](../nuxt-content-platform-backend/src/services/adminDeploymentService.ts) | 事件合并、条件领取、运行关联与结果回写 |
| 工作流 | [Actions](../.github/workflows/content-deploy.yml) | typecheck、build、SEO 审计成功后部署，定时与派发区别 |
| 图片状态 | [图片组件](../nuxt-content-platform-web/app/components/OptimizedImage.vue) | SSR 图片先完成时的水合状态同步 |

## 两个前端排障案例

### 刷新正常但切页返回 HTML

Pages 只部署静态产物时，刷新能看到预渲染 HTML，但客户端切页请求 /api 被静态站回退为 HTML，触发数据结构错误。不能因为刷新正常就认定运行环境具备 Nitro 服务。

当前添加 Pages Function，与 Nitro 共用公开接口白名单，只接受 GET 和规定查询，不转发 Cookie/Authorization；上游重定向、非 JSON 和不可用情况返回明确错误，不以 Mock 掩盖。核心是区分构建时数据与浏览器运行时数据，而非简单增加一次刷新。

### 图片已显示但加载占位层不消失

SSR 图片可能在客户端绑定 load 事件前完成。只依赖事件会漏掉已完成状态，导致占位层持续覆盖图片。当前在 mounted 和 src 更新后检查 complete / naturalWidth，同时处理失败状态。原阶段以延迟客户端 JS 的浏览器用例覆盖该时序，后续公网封面及刷新也已验证。

上述问题在当前 AI 辅助改造与部署阶段处理，不将其写作原产品当年的故障经历。

## 设计与面试讨论

**SSR 与预渲染是什么关系？** 项目用 Nuxt 在构建阶段生成 HTML 发布到 Pages，生产公开站不是常驻 Nuxt Node SSR 服务。客户端切页仍需 Pages Function 访问真实 API。

**为什么预渲染与 sitemap 共用目录？** 构建前取得内容目录并固化快照，让路由与 sitemap 使用同一来源；真实模式取数失败即中止，避免残缺产物。它不是跨数据库、构建期间所有内容的事务快照，不承诺绝对实时一致。

**页面客户端为什么不做全局单例？** SSR 进程可能处理多个请求。客户端在 Nuxt 插件内部创建，避免日后加入可变认证或配置时跨请求串用。

**有 Cookie 为何还要 CSRF？** Cookie 会由浏览器自动携带，不能据此判断写操作意图。服务端配合 Origin 与 CSRF 校验，客户端仅在指定 40301 时恢复会话再重试一次，不对任意失败无限重试。

**文章保存成功等于部署成功吗？** 不等于。事件入队后仍可能派发、构建或部署失败。管理端按 QUEUED/RUNNING/SUCCEEDED/FAILED 展示真实进度；合并事件标记 SKIPPED 并关联主事件。

**如何避免重复执行？** 文章用版本条件约束，事件在业务事务中写入；worker 通过状态条件领取，运行以批次键关联。此处不宣称跨数据库和 GitHub 的严格 exactly-once，也不忽略派发与回写之间的失败窗口。

**上传成功但数据库写入失败怎么办？** 媒体服务尝试补偿删除本次对象，删除失败不掩盖原始错误。上传后未保存文章等孤儿资源仍需维护策略，不将补偿称为分布式原子事务。

**为什么使用定时构建，怎样处理调度延迟？** 定时构建用于每日刷新预渲染内容，当前配置为 UTC 17:00，即北京时间 01:00。项目采用 GitHub Actions 的尽力调度，不要求分钟级准点上线；触发后还需排队、构建和部署。已确认真实 schedule 运行成功，但观察到晚于目标时间执行，尚未确定延迟发生在触发还是排队阶段。

可先考虑避开整点高峰，并记录计划、运行创建、开始和完成时间，判断延迟位置；若业务要求每天必须执行且可补偿，再利用现有 worker 增加每日唯一任务、持久化去重、漏执行补偿及失败告警。以上为后续优化方案，当前尚未实施，也不能消除 Actions 排队或承诺准点完成部署。实际验收应核对事件来源与运行结果，不仅看运行名称。

## 验证范围

- 已有真实证据：Railway API/管理端/worker/MySQL、R2 上传读取、Pages 正式站；文章更新事件自动构建部署、成功回写与新正文；真实 schedule #28 成功。
- 2026-10-13 Edge 公网只读复核两种视口共 8 页，切页无额外 document 请求，观察到的 API 均 200 JSON，新正文与 R2 封面及刷新正常，见[浏览器记录](browser-live-review/README.md)。
- 新文章发布/下线、失败重试、多事件合并与定时结果自动回写不因更新闭环成功而宣称公网已验收。
- 演示站 noindex；未提供搜索排名、并发规模、性能提升比例、高可用或灾备指标。
- 本次新增导读只核对代码与已有证据，没有再次触发构建、修改线上内容或重跑全套测试。

配置及运行见[部署链路](admin/DEPLOYMENT_PIPELINE.md)，历史验收见[最新状态](STATUS.md)。按日期阅读历史，不把早期未部署说明作为现状。
