# 资讯管理后台 AI 接手提示词

更新：2026-09-21。每次只复制一个提示词给 AI。AI 必须先检查实际文件与 `docs/STATUS.md`，计划项不能当成已完成项；完成当前编号后停止，不连续执行下一项。

## 0. 通用接手提示词

```text
请接手 E:/project/nuxt-content-platform 的资讯管理后台工作。

先读取 docs/STATUS.md、docs/admin/README.md、docs/admin/ADMIN_HANDOFF_PROMPTS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json，并检查适用 AGENTS.md 与根 Git 状态。以实际代码和最新用户要求为准，历史记录只表示当时状态。

项目是一个根仓库下的三个独立子项目：nuxt-content-platform-web（公开站）、nuxt-content-platform-admin（资讯后台）、nuxt-content-platform-backend（Express + Prisma + MySQL）。不要改成 apps/*，不要在子项目初始化 Git，不复制旧公司 Git 历史。原公司项目和其他 E:/project 项目只读且默认不要访问。

管理端固定使用 Nuxt + TypeScript + Naive UI，采用清晰克制的桌面后台风格。只做单管理员的资讯管理闭环：登录、文章列表、三语编辑、草稿、发布、下线、公开页预览和构建状态。文章新建与编辑复用 `/articles` 列表页内同一个 Naive UI 表单弹窗，不建立 `/articles/new`、`/articles/:id` 独立页面，也不在侧栏增加“新建文章”。不要引入多租户、动态菜单、低代码、微服务、复杂 RBAC 或与当前规模不匹配的抽象。

后端继续遵循 Route → Controller → Service → Prisma；统一响应为成功 `{ code: 0, msg: "ok", data: T }`，失败 `{ code: 非零数字, msg, data: null, requestId }`，HTTP 状态仍表达协议语义；业务时间为 13 位 Unix 毫秒。管理接口必须与公开查询接口分开，禁止公开注册，禁止将密码、会话密钥、GitHub Token 或 Cloudflare Hook 暴露到浏览器/public runtimeConfig/日志/仓库。

管理页面只通过集中 API 客户端访问固定白名单路径。优先设计同源 Nitro BFF 代理，以 HttpOnly Cookie 保持会话；不得把管理员令牌放 localStorage。最终认证方式以 B9.1 契约评审结果为准，尚未实现的接口必须显示明确的未接入状态，不能用 Mock 冒充完整后台。

发布文章与部署是两个状态：数据库发布成功不等于 Cloudflare 已部署。文章发布/更新/下线后由后端记录事件并安全触发自动构建；浏览器不持有部署凭据，也不允许用户传入 shell 命令。自动部署留到对应阶段，前期不得提前伪造。

按用户指定的编号执行，先审查再修改。不要大范围格式化或改公开站无关代码。每阶段运行与改动相称的 typecheck、lint、必要测试/构建；区分遗留问题与新增问题。结束前在 docs/STATUS.md 追加：修改文件、验证命令与结果、设计决定、未完成项、下一步。不要 commit、push、发布或连接外部生产服务。
```

## A0：管理端工程骨架

```text
仅执行 A0。先应用本文件“0. 通用接手提示词”。确认用户已创建 nuxt-content-platform-admin；如果目录不存在，只报告前置条件，不在错误位置生成项目。检查实际 package.json 和 Nuxt 版本，不擅自升级整个根仓库。

在现有管理端项目中建立最小可运行骨架：接入与当前 Nuxt 版本兼容的 Naive UI，完成全局 provider、基础主题变量、桌面后台布局、侧栏、顶栏、内容区、错误页和占位路由。首批路由只保留 `/login`、`/articles`、`/deployments`；默认入口跳转到 `/articles`。文章新建与编辑预留为列表页内同一个表单弹窗，不建立独立路由。页面标题和导航使用简体中文，适合广州求职展示。

建立目录边界：layouts、pages、components、composables、api、types。不要安装完整后台模板，不复制 multiTenant-admin-lab 或原公司界面，不做动态菜单、权限树、图表大屏和假仪表盘。未有管理 API 时页面明确显示“接口尚未接入”，不得制造假文章或假部署成功记录。

补充 `.env.example`，只放无密钥示例；规划私有管理 API 上游配置，不把后端地址和密钥放 public。建立 README，说明启动命令、目录、当前范围和未完成接口。运行依赖安装（如确有需要）、typecheck、lint、build；更新 STATUS 后停止。不要实现登录、文章 CRUD、后端接口或自动部署。
```

## A0.1：文章表单改为列表页弹窗（当前修正）

```text
仅执行 A0.1 管理端信息架构修正，不执行 A1，不接后端接口。先应用本文件“0. 通用接手提示词”，确认 A0 已完成并检查 nuxt-content-platform-admin 实际路由、导航和占位页面。

删除独立的 `/articles/new` 与 `/articles/:id` 页面文件及所有跳转、选中态和 README 描述；侧栏只保留“文章列表”和“构建状态”，不单列“新建文章”。检查 layout 与 useAdminNav 的重复导航定义，保留单一数据源，避免两处维护。

在 `/articles` 页面保留“新建文章”主按钮，点击后打开 Naive UI 表单弹窗；后续表格行的“编辑”也必须复用同一个弹窗组件。弹窗采用明确的 create/edit 模式和统一 ArticleFormDraft 类型：create 打开时重置为空表单，edit 后续由真实详情填充；关闭后清理校验和临时状态。弹窗宽度适合桌面后台，正文区域内部滚动，不能让整页被超长三语表单撑开；小屏时使用接近全屏的安全宽度。

A0.1 仍处于接口未接入阶段：可以展示禁用的封面、分类、三语标题/正文等结构占位和“接口尚未接入”说明，但不得保存假数据、伪造成功提示或实现 Mock CRUD。关闭存在未保存内容的弹窗应预留确认机制；本阶段若字段全部禁用，可在文档中说明待 A5 启用。

最终可访问业务路由只有 `/articles` 与 `/deployments`（另有 `/login` 和根重定向）；直接访问旧 `/articles/new` 或任意 `/articles/:id` 应进入项目既有 404，不做兼容跳转。同步管理端 README 与 docs/STATUS.md。运行 admin 的 typecheck、lint、build，并做列表页弹窗开关检查，然后停止。不要设计管理契约、认证、文章接口、发布或自动部署。
```

## A1 / B9.1：管理接口与认证契约（只设计）

```text
仅执行 A1 / B9.1 设计，不写业务实现。先应用通用接手提示词，确认 A0 已完成，审查现有 Prisma Article/ArticleTranslation/Category 模型、公开文章接口、统一错误外壳和管理端页面骨架。

新增 docs/admin/ADMIN_CONTRACT.md 与 docs/admin/admin-openapi.json，独立描述管理接口，不污染现有公开 openapi.json。设计单管理员登录、退出、当前会话、文章管理列表、详情、创建、修改、发布、下线和部署状态查询。明确请求/响应 DTO、分页筛选、三语字段、分类、封面、状态流转、发布时间、created_at/updated_at、乐观并发版本、401/403/409 错误、审计字段和验收用例。

认证优先采用同源 Nitro BFF + HttpOnly/Secure/SameSite Cookie；密码使用成熟哈希库，数据库只保存哈希；不开放注册、不使用 localStorage token。说明本地和生产域名边界、CSRF 防护、会话过期、登录限速与退出失效。若实际部署约束要求调整，记录理由，不凭空引入 OAuth。

设计发布事件：草稿保存不触发构建；首次发布、已发布内容修改、下线触发内容变更事件。数据库发布与部署状态分开，事件失败不得回滚已成功的文章事务，但必须可观察、可重试且去重。这里只设计事件字段和状态，不实现 GitHub Actions。

确认 Prisma 是否需要 AdminUser、AdminSession、Article revision/version、AuditLog、BuildEvent 等最小模型；给出追加迁移顺序，禁止改写已应用迁移。更新 docs 导航和 STATUS 后停止。不要执行 A2，不安装认证库，不修改数据库。
```

## A2 / B9.2：单管理员认证后端

```text
仅执行 A2 / B9.2。先应用通用接手提示词，确认 A1 契约已评审且 admin-openapi.json 可校验。按契约追加 Prisma 模型与迁移，实现登录、退出和当前会话接口；严格保持 Route → Controller → Service → Prisma。使用成熟密码哈希方案、安全随机会话、HttpOnly Cookie、过期与撤销、登录限速和统一错误外壳；不开放注册，不输出账号是否存在，不记录密码或 Cookie。

提供只创建缺失管理员的本地初始化方式，凭据只能从环境变量读取，不写进 seed、示例、日志或文档。测试使用独立账号并清理自身数据，不 reset 数据库。同步 admin-openapi、环境说明和 STATUS；运行迁移检查、typecheck、lint、OpenAPI 校验及认证集成测试后停止。不要实现文章写接口或管理端登录页面联调。
```

## A3：管理端登录与会话守卫

```text
仅执行 A3。应用通用接手提示词，确认 A2 认证接口可用。管理端建立集中 API 客户端和 Nitro 固定白名单 BFF，浏览器只请求同源 `/api/admin/*`，Cookie 使用 credentials，后端地址保持私有；未知路径、方法和 query 必须拒绝，不做任意代理。

实现 `/login`、当前会话恢复、未登录路由守卫、退出和 401 统一回登录页。登录表单使用 Naive UI，包含必要校验、提交状态和不泄密错误提示；不要记住明文密码，不把 token/session 放 localStorage。已登录访问 `/login` 转到 `/articles`。验证 SSR 不跨请求共享会话，刷新页面仍能恢复会话，退出后会话失效。更新 STATUS 后停止，不实现文章 CRUD 页面。
```

## A4 / B9.3：文章管理读写接口

```text
仅执行 A4 / B9.3 后端接口。应用通用接手提示词，确认认证中间件与管理契约已完成。实现受保护的文章管理列表、详情、创建和修改接口；公开文章接口行为保持不变。支持状态/分类/关键词筛选、稳定分页；编辑 DTO 包含三语 title/content、分类、封面、发布时间和版本号。

所有写入用 Zod 或项目既有统一校验；HTML 清理复用现有安全模块；Prisma 事务保证 Article 与三语翻译一致。更新必须使用乐观并发，版本冲突返回 HTTP 409 + 稳定数字业务码，不静默覆盖。草稿允许明确约定的未完成字段，发布校验留给 A6。补权限、校验、并发、事务和公开接口不泄露草稿的集成测试；同步 admin-openapi/STATUS 后停止，不改管理端页面，不实现发布或构建触发。
```

## A5：文章列表与编辑器页面

```text
仅执行 A5 管理端页面。应用通用接手提示词，确认 A4 接口可用且 A0.1 已移除独立文章表单路由。用 Naive UI 在 `/articles` 实现文章列表、分页、状态/分类/关键词筛选；“新建文章”按钮和表格行“编辑”复用同一个表单弹窗，不新增 `/articles/new`、`/articles/:id` 页面。弹窗组件只接收模式、articleId/初值与开关状态，通过事件通知保存成功；列表页负责刷新列表，避免弹窗直接操作表格内部状态。

编辑器第一版使用可靠的 textarea 或已审查的轻量富文本方案；若引入富文本依赖，先核实维护状态和 Nuxt SSR 兼容性，禁止直接 v-html 回显未经后端清理的内容。弹窗正文区域内部滚动，小屏安全适配；create 每次打开重置表单，edit 每次按真实 ID 拉详情，切换记录时不能残留上一条数据。关闭未保存表单需要确认，保存成功关闭弹窗并刷新当前列表，失败保留输入并显示可定位错误。

三语编辑使用清晰 Tab，展示保存状态、字段错误、未保存离开提醒和版本冲突提示。创建/保存只处理草稿，不出现可点击的假发布按钮。封面第一版可使用 URL 字段并预览，不先做对象存储上传。完成键盘操作、加载/空/错误状态；运行 typecheck、lint、build 和必要页面回归，更新 STATUS 后停止，不实现发布、下线或部署。
```

## A5.0：A5 错误状态与视觉收尾

```text
仅执行 A5.0，不新增删除、上传、发布或部署功能。应用通用接手提示词，阅读 docs/admin/A5_REVIEW.md，并以实际 A5 页面为准处理其中 P1 视觉问题。

分类选项加载失败不能只弹短暂 message：文章列表筛选区显示可持续阅读且可重试的错误状态；ArticleFormModal 在新建模式分类失败、编辑模式分类或详情失败时提供语义明确的重试按钮。重试期间显示局部 loading，不能关闭或覆盖用户已经填写的草稿。区分“重试分类”和“重试文章详情”，不要用一次操作无条件重置整个表单。

登录、列表和弹窗的请求错误以内联 n-alert 为主，避免同一错误同时出现内联 alert 和 message；message 保留给保存成功、重新加载成功等短反馈，或无法归属当前区域的全局错误。错误内容使用后端安全 msg，未知错误使用稳定中文兜底；40100 仍由集中客户端回登录页。检查键盘焦点：出现错误后焦点或 aria-live 能让用户发现错误，重试按钮可用键盘操作。

完成桌面宽度与 390px 浏览器回归，核对登录错误、分类失败、列表失败、详情失败、保存失败、409 冲突及重试状态。运行 admin typecheck、lint、build，更新 STATUS 后停止。
```

## A5.1 / B9.3.1：文章删除闭环

```text
仅执行 A5.1 / B9.3.1 文章删除，不执行上传、发布或部署。应用通用接手提示词，确认 A5 与 A5.0 状态，先同步 ADMIN_CONTRACT 和 admin-openapi，再实现后端、BFF、集中客户端和文章列表 UI。

新增 DELETE /api/admin/articles/{id}，JSON 请求体固定为 `{ version: 正整数 }`，成功 HTTP 200：`{ code: 0, msg: "ok", data: { id, deleted: true } }`。必须登录并通过 Origin + CSRF；用 id + version 做乐观并发。只允许硬删除 DRAFT 或 ARCHIVED，PUBLISHED 返回 HTTP 409 + 40901 并提示先下线；不存在 40410，版本冲突 40900。ArticleTranslation 依现有外键级联删除，不接受批量 ID，不提供 GET 参数绕过，不新增公开删除接口。删除草稿/已下线内容不产生 BuildEvent；删除操作与 A6 审计的衔接在文档明确记录。

后端保持 Route → Controller → Service → Prisma；DELETE body 做严格 Zod 校验，事务内再次核对状态与版本，避免检查后竞争。补未登录、CSRF、非法 ID/body、不存在、版本冲突、已发布拒绝、草稿删除、已下线删除、翻译级联和公开查询不受影响的集成测试。同步管理端 BFF 方法类型及固定白名单，不开放任意 DELETE 代理。

文章列表操作列加入“删除”，使用 Naive UI warning/error 风格的确认 Dialog，明确展示文章标题或 slug，并说明不可恢复；确认按钮在请求中 loading、防重复提交。PUBLISHED 行禁用删除并给出“请先下线”的说明；成功后短 message，并处理当前页最后一条被删后的页码回退再刷新。失败在确认框或列表操作附近显示可读错误；40900 提示刷新列表，不能伪造删除成功。完成桌面和 390px 回归，运行前后端 typecheck/lint、OpenAPI 校验、后端必要测试和 admin build，更新 STATUS 后停止。
```

## A5.2 / B9.3.2：封面上传契约与存储设计（只设计）

```text
仅执行 A5.2 / B9.3.2 设计，不安装依赖、不改数据库、不实现上传。应用通用接手提示词，审查当前 cover_image 校验、公开站图片渲染、Nitro BFF 原始 body 转发、部署目标 Cloudflare Pages 和本地开发约束。

在 ADMIN_CONTRACT 与 admin-openapi 中设计 POST /api/admin/media/images：multipart/form-data 单文件字段 `file`，要求认证、Origin、CSRF；限制原始文件 5 MiB，只接受 JPEG/PNG/WebP，不能只信扩展名或 Content-Type。设计服务端解码并重新编码（建议统一 WebP、移除元数据、限制最长边与像素总量）以防伪造图片和解压炸弹；文件名使用服务端随机 key，不采用用户文件名，不允许 SVG。

设计 StorageAdapter 边界：本地开发适配器写入明确的 gitignore 目录并通过受控媒体路由读取；生产适配器使用 Cloudflare R2/S3 兼容对象存储，凭据只在后端环境变量。上传成功返回 MediaAsset DTO（id/key/url/mime_type/width/height/size/created_at）；文章仍只保存 cover_image URL。公开 URL 只允许配置的可信 MEDIA_PUBLIC_BASE_URL，不能放开任意 http(s) URL。说明本地 URL 与生产 R2 URL、Cloudflare Pages 静态构建和 SSR 的衔接。

评估是否增加 MediaAsset 最小模型以记录上传人、对象 key、元数据和创建时间；给出追加迁移与孤儿文件清理策略。文章删除或替换封面时不得立即删除对象，因为可能被其他文章复用；首版只标记/定时清理未引用资源。明确 BFF multipart 大小上限、超时和 Cookie/CSRF 转发，禁止把 R2 密钥或预签名管理能力交给浏览器。列出错误码、验收用例与 Apifox 示例。更新 STATUS 后停止，不执行 A5.3。
```

## A5.3 / B9.3.3：封面上传实现与管理端联调

```text
仅执行 A5.3 / B9.3.3。应用通用接手提示词，确认 A5.2 契约已经评审并以其最终字段、错误码和存储选择为准，不在实现中临时改协议。

按契约追加迁移（如设计决定需要 MediaAsset），实现图片校验/解码重编码、StorageAdapter、本地开发适配器与生产 R2 适配器、受保护上传接口及必要的公开媒体读取方式。对象存储凭据只读后端私有环境变量；本地上传目录必须进入根/后端 gitignore。失败时清理本次产生的临时文件/未完成对象，不记录文件二进制、Cookie、CSRF 或凭据。不得接受 SVG、任意 URL、路径穿越或用户提供的对象 key。

扩展管理端 BFF 固定白名单，只允许约定上传路径和 multipart；设置略高于业务文件上限的请求体上限并拒绝超限，不把上传路由变成任意代理。集中客户端新增 uploadCoverImage，保持 credentials 和 CSRF；不要使用 Authorization/localStorage token。

ArticleFormModal 的封面区域改为 Naive UI Upload 风格：单文件选择、类型/大小提示、本地预览、上传进度/禁用状态、失败后重试和移除/重新选择。上传成功后只把后端返回的可信 URL 写入 draft.coverUrl；文章尚未保存时明确提示“图片已上传，文章仍未保存”。保留手动可信 URL 是否可编辑，以 A5.2 决策为准。保存失败不得清空已填写三语内容；关闭未保存弹窗继续确认。

后端测试覆盖伪造 MIME、错误魔数、SVG、超限、超大像素、未登录、CSRF、路径穿越、存储失败清理和成功元数据；前端覆盖上传成功/失败/重试/预览/保存。验证公开站使用真实媒体 URL SSR 渲染且不破坏 SEO 构建。运行前后端 typecheck/lint、OpenAPI 校验、必要测试、admin build 与 web 真实模式构建；无真实 R2 凭据时只验证本地适配器并如实记录。更新 STATUS 后停止，不执行 A6。
```

## A6 / B9.4：发布、下线与公开预览闭环

```text
仅执行 A6 / B9.4。应用通用接手提示词，确认 A5.0～A5.3 已按用户要求完成，草稿编辑、删除和封面上传均已联调。后端实现发布和下线状态流转：发布前强制三语完整、分类有效、正文安全、发布时间合法；重复命令幂等；并发版本冲突返回 409。事务成功后写 AuditLog 与待处理 BuildEvent，但本阶段不调用 GitHub/Cloudflare。

管理端增加发布确认、下线确认、状态标签、校验错误定位和公开页预览链接。明确显示“内容已发布，自动部署尚未接入/等待部署”，不得把数据库发布显示为线上部署成功。验证草稿不可公开、发布后公开接口可见、下线后不可见、三语缺失不能发布及审计记录完整。同步契约、OpenAPI、STATUS 后停止。
```

## A7 / B9.5：GitHub Actions 构建触发与部署状态

```text
仅执行 A7 / B9.5。应用通用接手提示词，确认 A6 会产生 BuildEvent。设计并实现服务端构建触发 worker：处理首次发布、已发布内容修改、下线、期次数据发布和下一计划更新事件；使用幂等键与 1～3 分钟合并窗口，避免连续编辑或多个访问者重复构建。浏览器不得直接调用 GitHub 或保存部署密钥。

增加 GitHub Actions workflow：北京时间每天凌晨 1 点的 cron（UTC 17:00）、手动触发、repository_dispatch 内容事件。真实模式构建必须依次执行内容目录获取、Nuxt build、SSR/SEO/sitemap 审计，全部成功后才部署 Cloudflare Pages；失败保留上一线上版本并记录日志。所有外部 token 使用 GitHub Secrets/后端环境变量；不在日志打印 Hook 或 Token。

BuildEvent/Deployment 状态至少区分 queued/running/succeeded/failed/skipped，保存触发原因、相关文章或期次、时间、外部运行 ID 和安全错误摘要。管理端 `/deployments` 只读显示真实状态并链接到允许公开的运行页面。无法在本地真实调用外部平台时，完成可审查配置与本地 dry-run，明确未验证项，不能声称已部署。更新文档和 STATUS 后停止。
```

## A8：管理端收尾与面试导览

```text
仅执行 A8。应用通用接手提示词，确认用户指定的前置阶段已完成。全量复盘管理端路由、API 白名单、鉴权、文章状态、错误状态、响应式桌面布局、无障碍键盘操作、敏感信息、注释和死代码；只按证据修复，不做大范围重写。

完成真实接口模式 typecheck、lint、build 和关键浏览器回归。新增简洁的管理端代码导览与文字面试问答，重点说明 HttpOnly 会话、BFF、乐观锁、三语事务、发布与部署分离、事件去重、失败保留旧站；每处关键代码最多用一两句中文注释引导，不机械添加注释。更新 README、docs 导航和 STATUS，列明仍未实现的能力后停止。
```
