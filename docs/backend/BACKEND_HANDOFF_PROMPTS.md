# 后端逐项接手提示词

每次只复制下面一个代码块。每段都有读取入口和停止条件；完成后由用户检查结果，再给下一段。不能复制整份文档要求 AI 连续执行全部步骤。没有数据库时，可以完成不依赖连接的工作，连接验证必须标为未完成。

当前 B1～B7.4 已完成，B8 统计契约设计已完成。下一步只执行 **B8.1 数据模型与种子**；此后每次由用户检查，再复制下一段，不连续实现全部统计接口。

## B1：工程基础（第一个执行）

```text
接手 E:/project/nuxt-content-platform，仅执行 B1 后端工程基础。先读适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json、docs/backend/MYSQL_SETUP.md，并检查 Git 状态。
只在 nuxt-content-platform-backend 建 TypeScript + Express 模块化单体基础，核实并固定兼容的 Node/Express/Prisma/包管理器版本，提交对应锁文件到工作区但不执行 git commit/push。独立子项目，不另建 Git，不改前端、不改 AI 多模态或公司项目。仅提供启动、构建、类型检查、适度 lint、环境变量验证、统一错误和请求标识基础；提供无凭据 .env.example。不安装或启动 MySQL，不运行迁移，不实现文章业务，不临时把 /health 冒充数据库已就绪。
记录版本依据、目录和验证命令；已有用户改动不覆盖。完成后更新 STATUS.md，说明已完成/未验证及 B2 下一步，然后停止，不自动执行 B2。
```

## B2：数据库模型与迁移

```text
仅执行 B2。先读适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json、docs/backend/MYSQL_SETUP.md，确认 B1 已完成并检查 Git 状态。依第一批四个模型实现 Prisma schema，索引、外键、枚举、三语联合唯一键与契约一致。生成迁移与脱敏幂等种子，保留原演示文章 ID，时区转换明确；种子默认不覆盖已有内容，不清库。
先核对本地专用数据库、影子库与环境配置，不打印连接串，不连接其他项目数据库。数据库未准备好时先完成静态校验和代码，明确迁移/种子未验证；不要伪造完成。数据库已获用户授权并准备好后审查迁移再应用；禁止 reset、危险 db push 或丢数据选项。提供数据库生命周期管理和真实 SELECT 就绪检查 /health，错误遵循 OpenAPI。
验证建表约束、种子重复执行和 /health 的数据库失败行为，更新 STATUS.md 和必要模型说明后停止。不要实现分类或文章接口。
```

## B3：分类查询

```text
仅执行 B3。读取适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md 和 docs/backend/openapi.json，确认 B2 完成。实现 GET /api/categories，从数据库查询九个子分类与指定语言名称，支持三种语言及别名，统一拒绝未知/重复/数组/空参数。不得读前端 Mock 代替数据库查询。
验证三语与别名、排序、非法参数和数据库失败的错误格式。没有运行环境则标明未验证，不推进下一项。更新 STATUS.md，停止；不要实现文章接口或改前端。
```

## B3.1：统一所有响应外壳

```text
仅执行 B3.1 响应格式统一，不实现文章列表或其他新业务。先读取适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json，并检查当前后端实现和 Git 状态。B1～B3 已完成；当前只有 categories 成功体含 code/msg，health 和错误体仍不统一。

将所有 HTTP JSON 响应统一为固定外壳，code 始终为 number、msg 始终为 string，禁止同一字段一会儿 number、一会儿 string：
- 成功：`{ "code": 0, "msg": "ok", "data": T }`。
- 失败：`{ "code": 非零数字业务码, "msg": "可展示但不泄密的错误说明", "data": null, "requestId": "请求标识" }`。
- HTTP 状态码仍表达协议结果，不能因为有业务 code 就全部返回 200。
- 第一批业务码固定为：40000 INVALID_ARGUMENT、40400 ROUTE_NOT_FOUND、40401 ARTICLE_NOT_FOUND、50000 INTERNAL_ERROR、50300 SERVICE_UNAVAILABLE、50301 CONTENT_DIRECTORY_LIMIT_EXCEEDED。符号名可以作为代码常量名和文档说明，不再作为 JSON code 的字符串值。

改造统一 response helper 和全局错误处理中间件，禁止每个路由手写另一套外壳。`GET /health` 成功改为 `{ code: 0, msg: "ok", data: { status: "ok", database: "up" } }`；`GET /api/categories` 保持 code/msg，并确认 data 是分类数组。未知路由、非法参数、数据库不可用和未处理异常都使用失败外壳；错误不得返回 SQL、连接串、密码或堆栈。

同步修改 docs/backend/BACKEND_CONTRACT.md 和唯一的 docs/backend/openapi.json：所有五个接口的成功响应都套 SuccessEnvelope，所有错误都套 ErrorEnvelope；文章列表的分页字段放进 data 对象，不散落到 code/msg 同级，即 `data: { items, total, page, page_size, total_pages }`；文章详情的 data 是 Article；content-directory 的 data 是目录对象。更新 Apifox 示例和 schema required 字段，确保所有 `$ref` 有效。

验证 categories、health、非法参数、未知路由、错误数据库凭据和未处理异常的 HTTP 状态、数字 code、msg、data、requestId；成功响应不带 requestId，失败响应必须带 requestId。执行 typecheck、lint、build 和必要的 HTTP 检查。更新 docs/STATUS.md，写明修改及验证结果，然后停止。不要执行 B4，不改前端，不提交或推送 Git。
```

## B4：文章列表

```text
仅执行 B4。读取适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json，确认 B3.1 已完成并检查 Git 状态。实现 GET /api/articles，数据库过滤已发布、发布时间和三语完整性；兼容父/子分类与旧别名；稳定排序、分页、total 与 total_pages 遵循契约，列表保持 content 字段，HTML 按白名单清理。共享可见性与 DTO 映射放在服务层，不在各路由复制。
成功体必须复用统一 helper，格式为 `{ code: 0, msg: "ok", data: { items, total, page, page_size, total_pages } }`；失败体必须复用数字业务码 ErrorEnvelope，保留正确 HTTP 状态与 requestId，禁止恢复旧 `{ error: ... }` 结构。用专用测试数据验证分页边界、超页、分类、语言、隐藏草稿/未来文章/缺译和错误响应。测试不得清空用户开发库。同步 docs/STATUS.md，然后停止；不要实现详情、管理端或前端联调。
```

## B5：文章详情

```text
仅执行 B5。先读适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json，确认 B3.1/B4 已完成。实现 GET /api/articles/{id}，复用列表可见性与 DTO，非法 ID 为 HTTP 400 + code 40000，不存在/草稿/下线/未来/缺译统一 HTTP 404 + code 40401。成功体必须为 `{ code: 0, msg: "ok", data: Article }`，失败体复用统一 ErrorEnvelope；不能直接返回 Prisma 完整对象，不能泄露内部字段。验证三语内容、HTML 清理、ID 边界和不可见记录。更新 docs/STATUS.md 后停止，不继续内容目录或前端改动。
```

## B5.1：拆分 Route 与 Controller

```text
仅执行 B5.1 结构整理，不新增接口、不改变数据库、不推进 B6。先读取适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json，检查 Git 状态和 nuxt-content-platform-backend/src 当前实现。确认 B3.1～B5 已完成；保留其他 AI 和用户现有改动。

把现有后端整理为清晰的 `Route → Controller → Service → Prisma`：
- `src/routes/*.ts` 只定义 URL、HTTP 方法、路由级中间件并绑定 controller，不再内联 async 业务回调、参数解析、响应发送或数据库错误映射。
- 新增 `src/controllers/healthController.ts`、`categoryController.ts`、`articleController.ts`。Controller 负责读取和校验 HTTP 输入、调用 service、使用统一 okResponse 返回结果，并把错误交给全局错误处理。
- `src/services/*.ts` 继续承载业务规则和 Prisma 查询；service 不得依赖 Express 的 Request/Response/NextFunction。health 的数据库就绪检查也通过轻量 service 封装，不在 controller 直接写 Prisma 查询。
- Prisma 生命周期和连接保留在 `src/db/prisma.ts`。本项目规模下不新增 Repository/DAO/UseCase/DI 框架，不为了分层复制已有逻辑。

优先采用现有顶层 `routes/controllers/services/db` 结构，避免此时大规模搬成 modules 目录。共享的语言、分页、分类、HTML 清理和错误映射继续放在已有 lib/middleware 中；不要把 service 业务规则搬进 controller。若多个 controller 的 try/catch 完全重复，可复用一个类型安全的 async handler，但不要引入新框架。

保持接口、OpenAPI 和返回内容完全不变：GET /health、GET /api/categories、GET /api/articles、GET /api/articles/{id} 的路径、参数、HTTP 状态、数字 code、msg、data、requestId、排序、分页、可见性和清理规则都不得变化。本轮通常无需修改 BACKEND_CONTRACT.md 或 openapi.json；若发现现有实现与契约不一致，只记录，不借结构整理扩大业务范围。

验证上述四个接口的成功场景，以及非法参数、未知文章、未知路由和数据库不可用；确认 routes 文件中只剩路由注册/中间件绑定，controller 不直接使用 Prisma，service 不引用 Express。运行 typecheck、lint、build 和必要的 HTTP 回归。更新 docs/STATUS.md，记录移动文件、验证结果和限制，然后停止。不要执行 B6，不改前端，不 commit/push。
```

## B6：构建内容目录与契约验收

```text
仅执行 B6。读取适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json，确认 B3.1～B5.1 已完成。按既有 `Route → Controller → Service → Prisma` 分层实现 GET /api/content-directory：route 只绑定 controller，controller 处理 HTTP 输入/输出，service 负责一致读快照、可见性和 Prisma 查询。返回稳定排序的完整集合；成功体为 `{ code: 0, msg: "ok", data: { generated_at, articles } }`。超限返回 HTTP 503 + code 50301，不截断；其他失败复用统一 ErrorEnvelope。不要运行前端构建/部署命令，不提供任意 shell 执行接口。
核对第一批五个接口的实际响应、示例、HTTP 状态、数字 code、msg、data、requestId、语言和日期与 OpenAPI 一致；验证所有 $ref 和文档结构，有条件用 OpenAPI 校验器。更新 Apifox 调试步骤与 docs/STATUS.md，明确测试结果后停止。不得把这一批称为完整后端。
```

## B6.1：时间戳、关键中文注释与文档收尾（当前下一步）

```text
仅执行 B6.1 规范收尾，不进行前端联调、不新增业务接口、不修改数据库表结构。先读取适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json、nuxt-content-platform-backend/README.md，并检查 Git 状态及 B1～B6 的当前实现。保留用户和其他 AI 的现有改动。

一、统一 API 时间字段为 Unix 毫秒时间戳：
- API 中 `publish_date`、`generated_at` 改为 number 类型的 13 位 Unix 毫秒时间戳；以后新增的 created_at、updated_at、登录时间等业务时间字段也遵守同一规则。
- MySQL/Prisma 继续使用 UTC DateTime(3)，不创建数据库迁移；只统一 DTO/接口序列化。集中提供语义明确、可复用的 Date→毫秒转换函数，禁止页面或各 service 各写一套。
- 内容目录的 generated_at 与本次可见性查询使用同一个 now，避免快照时间和生成时间来源不一致；测试允许注入固定 now，HTTP 入口仍使用当前时间。
- 日志中的 time 不属于业务接口，可继续使用 ISO 字符串以方便阅读；文档明确这一例外。
- 同步 ArticleDto、ContentDirectoryDto、BACKEND_CONTRACT.md、openapi.json 和全部示例；OpenAPI 时间字段使用 `{ type: "integer", format: "int64" }`，说明单位为毫秒。不得遗留 date-time 字符串示例。

二、按面试阅读价值整理代码注释，不做机械全量翻译：
- 能解释设计取舍、职责边界、数据可见性、事务一致性、安全限制、SSR/构建用途或“为什么这样做”的注释，改为简洁中文，通常一至两句，方便面试官快速理解。
- 普通技术提示、第三方 API/协议名、正则含义明显的短注释、变量/函数/类型名继续保留英文；不要把代码标识符翻译成中文，不添加“定义变量/返回数据”等无价值注释。
- 优先复查 articleVisibility、contentDirectoryService、healthService、response/errors、asyncHandler、queryGuard、htmlSanitize、env、app 和 routes/index；注释必须与实际行为一致。

三、更新 nuxt-content-platform-backend/README.md：改为中文项目说明，删除“分类/文章接口尚未实现”等过期内容；列出现有五个接口、统一响应外壳、分层结构、MySQL/迁移命令、毫秒时间戳约定、当前验证和未完成的 B7 联调。不得在 README 写入 .env 凭据。

验证：typecheck、lint、build；实际请求 articles 列表、articles/101 和 content-directory，断言所有业务时间字段为安全整数毫秒时间戳且与数据库 UTC 时刻一致；固定 now 验证 generated_at；扫描 OpenAPI 不再将这两个字段声明为 string/date-time；复验统一 code/msg/data、错误外壳、排序与可见性未变化。更新 docs/STATUS.md，记录修改、验证和例外，然后停止。不要执行 B7，不改前端，不 commit/push。
```

## B7：资讯前后端联调

```text
仅执行 B7。先读适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json、docs/frontend/API_CLIENT.md、docs/frontend/ROUTES_AND_SITEMAP.md、docs/frontend/SEO_REACTIVITY.md。前提是 B1～B6.1 已验证，后端继续遵循 `Route → Controller → Service → Prisma`，不得为联调把业务逻辑写回 route。通过 Nuxt 服务端私有配置与 Nitro 代理将文章列表/详情切到真实 Express，不把后端内部地址暴露到 public，不破坏 SSR 实例隔离。前端 API 适配层统一检查数字 code，code=0 时提取 data，非零时保留 HTTP 状态、msg、requestId 形成可判断错误；禁止页面各自重复解包。仅允许固定上游路径/查询参数，不透传任意 URL 或认证头；上游超时/错误明确转换，不回退 Mock。统计继续 Mock，按资讯范围配置切换。
构建真实模式读取一次 content-directory 快照，供预渲染与 sitemap 共用；失败必须中止构建，不能生成残缺目录。Mock 模式仍能离线构建。前端集中把 13 位毫秒时间戳格式化为对应语言/时区的展示值，并在生成 sitemap lastmod 时显式转换，禁止把毫秒数直接当日期字符串。校验三语列表/详情、404、跳转、SEO 和时间展示；按实际改动运行 lint/typecheck/build 和必要浏览器验证。记录 API 直连和 Nuxt 代理差异，更新导览和 STATUS.md，然后停止。不要实现登录、发布或推送部署。
```

## B7.1：文章 HTML 清理安全加固

```text
仅执行 B7.1，不推进统计、认证或管理端。读取 docs/STATUS.md、后端契约和当前 htmlSanitize 实现，检查 Git 状态。用成熟、仍维护且适合 Node 服务端的 HTML 清理库替换手写正则解析；先核实版本兼容性并固定依赖。保留项目现有允许标签、a.href 协议和 cover_image 规则，拒绝脚本、事件属性、危险协议、SVG/MathML、畸形标签和编码绕过；不要扩大允许范围。
清理行为集中在 service/公共安全模块，不写回 route/controller。增加必要的安全回归用例，覆盖大小写、实体编码、嵌套危险标签、不完整标签和安全相对/HTTPS/mailto 链接；确认现有种子文章展示内容不被意外破坏。运行 typecheck、lint、build 和文章接口回归，更新依赖说明与 docs/STATUS.md 后停止。不要执行 B7.2，不改数据库或推送 Git。
```

## B7.2：接口契约自动化验证

```text
仅执行 B7.2。读取 docs/STATUS.md、docs/backend/openapi.json 和现有 HTTP 验证记录。引入轻量、可维护的 OpenAPI 3.0 校验工具并增加 `pnpm openapi:validate`；再增加少量可重复的接口集成测试，覆盖统一成功/失败外壳、HTTP 状态与数字 code、毫秒时间戳、草稿/未来/缺译不可见、列表/详情 DTO 一致、内容目录排序/上限、数据库失败不泄密。不要为每个简单 helper 写镜像实现式测试。
测试使用独立测试数据或可回滚事务，不清空用户开发库，不依赖执行顺序，不打印凭据。验证 typecheck、lint、build、OpenAPI 校验和新增测试；同步 README/STATUS，说明 Apifox 人工导入是否实际执行，然后停止。不要执行 B7.3，不新增业务接口。
```

## B7.3：数据完整性与领域常量收口

```text
仅执行 B7.3。读取 docs/STATUS.md、契约、Prisma schema、分类/语言/可见性实现。处理三个已识别问题：分类缺少请求语言翻译时不得静默少返回一项，应按契约给出明确的数据完整性错误或在写入/发布边界阻止；集中维护三种 locale、三个 parent_route、九个 category slug 及旧别名，减少 seed/query/service 间漂移并保留明确 TypeScript 联合类型；将 /__debug/unhandled 改为 test 或显式开关启用，不能仅凭非 production 环境公开。
保持现有 API 字段、数字业务码、毫秒时间戳和分层结构；如新增数据完整性业务码，先更新契约/OpenAPI，保持 HTTP 状态语义。不要为了常量共享让后端直接依赖前端文件，也不引入 Repository/DAO/DI。运行现有全部验证，更新 STATUS 后停止，再由用户决定 B8。
```

## B8：统计契约设计（已完成，勿重复）

```text
B8 设计已经完成，结果在 docs/backend/STATISTICS_CONTRACT.md、BACKEND_CONTRACT.md 和唯一 openapi.json。不要重新设计或一次性执行 B8.1～B8.8；从用户指定的单段开始。
```

## B8.1：数据期次模型、迁移与脱敏种子

```text
仅执行 B8.1，不实现任何统计 HTTP 接口、不改前端。先读取适用 AGENTS.md、docs/STATUS.md、docs/backend/STATISTICS_CONTRACT.md、BACKEND_CONTRACT.md、openapi.json、MYSQL_SETUP.md，并检查 Git 状态与现有 Prisma 迁移。以契约为准新增 DatasetPeriod、DatasetSchedule 及必要枚举、索引和数据库检查约束；字段映射、UTC DateTime(3)、7 个 1～49 互异值、金额精度和可见状态必须符合设计。不要改已有 Article/Category 行为。

把前端当前 120 条脱敏 MOCK_HISTORY 转为后端幂等 seed；保留 periodCode/时间/数值，首批 8 条可补契约允许的展示金额，合成记录金额保持 null。新增一个脱敏的未来 DatasetSchedule。种子只补缺失记录，不覆盖人工修改，不清表，不读取或连接其他项目数据库。检查迁移 SQL 后才应用到用户已配置的专用开发库和 shadow 库；禁止 reset、危险 db push。

验证 schema/typecheck/lint/build、迁移状态、种子重复执行、120 条已发布期次、数值范围/互异、UTC 时间转换和下一计划；测试/输出不得泄露连接串。更新 STATUS.md，注明尚无统计接口，然后停止，等待 B8.2。
```

## B8.2：最新数据接口

```text
仅执行 B8.2：GET /api/latest。读取 STATUS、STATISTICS_CONTRACT、openapi 和 B8.1 实际模型，确认迁移/种子完成。严格按 Route → Controller → Service → Prisma：route 只注册；controller 拒绝全部 query、调用 service、统一 okResponse；service 用同一个 now 查询最新可见 DatasetPeriod 和最早未来 SCHEDULED 计划并映射 DTO。draw_date/next_draw_date 输出 13 位毫秒；金额遵循契约；不返回 _mock_clock。没有可见期次时新增并复用 40402 DATASET_NOT_FOUND，正确 HTTP 404/ErrorEnvelope；没有下一计划只返回三个 null。

增加不破坏开发库的集成测试，覆盖成功、排序、草稿/未来/归档不可见、next 可空、未知 query、40402 和数据库失败不泄密。同步 errors 常量、BACKEND_CONTRACT/openapi 的“已实现”状态及 README；运行 typecheck/lint/openapi/test/build，更新 STATUS 后停止。不要实现 history 或改前端。
```

## B8.3：历史数据接口

```text
仅执行 B8.3：GET /api/history。读取 STATUS、STATISTICS_CONTRACT、openapi，确认 B8.2 完成。沿用 Route → Controller → Service → Prisma 和统一外壳。实现 page/page_size/year/draw_number/number/periods 的严格 query 校验；未知、重复、数组、空值、非十进制整数和越界统一 40000。year 按 Asia/Hong_Kong 日历边界转换为 UTC 查询；过滤顺序、periods 窗口、稳定 releasedAt DESC/id DESC 排序、total 和 total_pages 严格按契约。不要静默截断 page_size。

列表 DTO 只含契约字段，draw_date 为毫秒；同一一致读事务返回 filter_options：全部可见年份降序及最新 120 个 periodCode，不受当前筛选影响。用固定探测记录验证组合筛选、年份边界、任一 7 值匹配、periods 后分页、空集、超页、稳定排序、可见性和筛选选项；不要清空开发库。同步 OpenAPI 状态、README/STATUS，运行全部既有验证后停止。不要实现 analysis 或改前端。
```

## B8.4：统计公共窗口与频次分析接口

```text
仅执行 B8.4：统计公共计算模块和 GET /api/analysis，不实现 advanced-stats/number-miss。读取 STATUS、STATISTICS_CONTRACT、openapi、前端 app/mock/statistics.ts。建立可复用的 period 参数校验、统一 now/可见窗口查询和纯函数计算模块；默认 10、最大 120，响应含 requested_period 与实际 period。公式必须按契约覆盖全部 7 个值：hot/cold、从最新开始连续出现、同尾期数和升序相邻对；所有并列排序稳定。period=0 返回五个空数组，不伪造冷热数据。

公式用小型固定数组做单元测试，接口集成测试覆盖默认/边界/超样本/非法 period、隐藏记录和统一外壳。禁止在 controller 计算统计，禁止复制 Mock 函数后不核对口径。同步 OpenAPI 状态和 STATUS，执行 typecheck/lint/openapi/test/build 后停止。
```

## B8.5：进阶统计接口

```text
仅执行 B8.5：GET /api/advanced-stats。复用 B8.4 的参数、可见窗口与相邻组合纯函数，不重复查询/复制公式。严格实现尾数 0～9、中性 G01～G12、奇偶数量与百分比、含相邻值的期次数/比例、相邻组合频次，以及前 6 个普通值完整组合的 top 5；不得把 G 分组描述为真实生肖，不得计算任意子集。百分比保留 2 位、排序稳定；period=0 时固定分布键为 0、组合为空。

补纯函数和 HTTP 测试，覆盖分母为 0、重复完整组合、多个相邻对、并列排序和非法参数。同步 OpenAPI 状态/STATUS，运行全部验证后停止。不要实现 number-miss 或改前端。
```

## B8.6：遗漏与连续命中接口

```text
仅执行 B8.6：GET /api/number-miss。复用 B8.4 的 period 与可见窗口。按 STATISTICS_CONTRACT 对 1～49 计算 current_miss、max_miss、avg_miss、most_freq_miss、max_streak；窗口按最新到最旧，遗漏段包含两端截断段和连续命中间的 0，众数并列取较小值。period=0 返回空 number_stats；有样本时按 number 升序恰好 49 项。

用易人工验算的小型序列覆盖从未出现、最新出现、连续出现、首尾遗漏、0 间隔和众数并列；再做 HTTP 参数/外壳测试。同步 OpenAPI 状态和 STATUS，运行 typecheck/lint/openapi/test/build 后停止。不要实现固定组合或改前端。
```

## B8.7：固定演示组合接口

```text
仅执行 B8.7：GET /api/legacy-analysision 与 GET /api/legacy-featured-combination。它们是兼容旧前端路径的固定作品样例，不调用 AI、不读取统计表、不根据刷新随机生成。将脱敏的 5 组和首页 1 组放入后端受版本控制常量，三语 reason/tags 显式编写；返回 source=fixed_demo、is_generated=false。numbers 必须 6 个互异 1～49 升序整数；legacy-featured-combination.generated_at 使用固定样例版本毫秒时间，不用 Date.now() 伪装更新。

lang 复用既有三语和别名解析，未知/重复/数组/空 query 为 40000。增加结构、三语、固定可复现和非法参数测试；文档不得宣称预测准确率或模型能力。同步 OpenAPI 状态/README/STATUS，运行全部验证后停止。不要改前端或实现管理接口。
```

## B8.8：统计前后端联调与 Mock 收口

```text
仅执行 B8.8 前后端联调。确认 B8.2～B8.7 及 B8.7.1 契约脱敏均已完成；以 STATISTICS_CONTRACT 和 openapi 为准，不恢复旧兼容字段。扩展 Nitro 白名单代理 latest/history/analysis/advanced-stats/number-miss/demo-combinations，继续不转发认证头、不允许任意路径、真实失败不回退 Mock。所有统计 Mock 改成统一 SuccessEnvelope，页面继续只由 useContentApi 解包。

新增前端共享 DTO，移除统计页面的 Record<string, any>/旧 data 嵌套假设。latest/history 只使用 period_code、released_at、values、extra_value、next_release；高级统计只使用 group_distribution；集中把 released_at、scheduled_at、generated_at 格式化为当前语言和 Asia/Hong_Kong。历史筛选读取 filter_options.period_codes/years，不再直接导入 MOCK_HISTORY。首页与工具页共用 demo-combinations 的 featured/items，并明确显示固定样例及 is_generated=false。

验证真实模式下首页、历史筛选/分页、三个统计模块、三语固定样例、SSR 与生产构建；Mock 模式仍能离线运行。运行前后端 lint/typecheck/OpenAPI/测试/build 和必要浏览器回归，更新导览及 STATUS 后停止。不要进入 B9、认证、发布或部署。
```

## B9：认证与编辑发布契约设计（只设计）

```text
仅执行 B9 设计，不写管理接口。读取 docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md 和 docs/backend/openapi.json，独立设计单管理员登录/退出/会话、文章草稿编辑、三语校验、发布/下线、并发编辑冲突和操作记录。明确认证、会话失效、密码哈希、授权和请求校验，不提供公开注册，不拿 AI 多模态 token 直接复用。选定认证方式后更新 OpenAPI securitySchemes、错误、请求/响应及验收用例。所有新增响应复用 B3.1 的统一外壳，code 始终为 number，业务时间统一为 13 位毫秒时间戳；补充 40100/40300 等稳定业务码，但不能改成 HTTP 200 承载所有错误。后续实现提示词沿用 `Route → Controller → Service → Prisma`，不提前增加 Repository/DAO/DI 层。
前端目前是预渲染，发布状态与部署状态必须区分；设计受控重建的授权、固定命令、并发/失败/重试与旧站保留，不允许用户输入 shell 命令。第一版若采用手动部署，明确发布不会自动更新线上，不伪造完整自动闭环。拆成登录、草稿、发布、部署等一次一个的实现提示词。更新 STATUS.md 后停止，不直接实施全部功能。
```
