# 后端接口契约：第一批资讯查询

日期：2026-09-20。状态：第一批五个资讯查询接口已实现；前端 B7 已可通过 Nitro 代理联调。机器可读契约为 [openapi.json](./openapi.json)，实现若需修改字段，先同步契约并记录原因。

## 范围和衔接

第一批只实现健康检查、分类、文章列表、文章详情、构建内容目录。管理员登录、编辑发布、历史统计的契约分别在后续单任务中确定，不允许接手 AI 根据本文一次性完成全栈。执行入口见 [后端逐项提示词](./BACKEND_HANDOFF_PROMPTS.md)。

依据：前端 app/mock/index.ts、app/mock/data/catalog.ts、app/api/client.ts、server/api/[...].ts、新闻页面及 scripts/content-directory.ts。列表和详情字段沿用现有语义；响应统一为 SuccessEnvelope / ErrorEnvelope（B3.1）。新分类/目录接口不代表前端已接入。

后端开发地址拟为 http://127.0.0.1:4000。Nuxt 使用同源 /api，由 Nitro 在 `NUXT_CONTENT_API_USE_REAL=true` 时按白名单代理资讯路径到 Express。服务端私有配置 `NUXT_CONTENT_API_BASE_URL`，不进入 public runtimeConfig。第一批仅资讯切换，统计仍为 Mock。上游失败返回错误，禁止静默回退 Mock。

## 通用规则

- 公开 GET，无登录要求；不支持公开写入。JSON UTF-8；HTTP 状态码仍表达协议结果：正常 200、参数错误 400、未知路由 404、文章不可见 404、内部错误 500、数据库不可用或目录超限 503。**不得**因存在业务 `code` 而全部返回 HTTP 200。
- 成功外壳（所有接口）：`{ "code": 0, "msg": "ok", "data": T }`。成功响应**不**带 `requestId`。
- 失败外壳（所有接口）：`{ "code": 非零数字业务码, "msg": "可展示但不泄密的说明", "data": null, "requestId": "请求标识" }`。不得返回 SQL、数据库地址、密码或堆栈。
- 第一批业务码（`code` 始终为 number；符号名仅用于常量与文档）：

| code | 符号名 | 典型 HTTP |
| --- | --- | --- |
| 0 | OK | 200 |
| 40000 | INVALID_ARGUMENT | 400 |
| 40400 | ROUTE_NOT_FOUND | 404 |
| 40401 | ARTICLE_NOT_FOUND | 404 |
| 50000 | INTERNAL_ERROR | 500 |
| 50001 | DATA_INTEGRITY_ERROR | 500 |
| 50300 | SERVICE_UNAVAILABLE | 503 |
| 50301 | CONTENT_DIRECTORY_LIMIT_EXCEEDED | 503 |

- GET query 只允许契约参数；未知、重复、数组、空值参数均 HTTP 400 + code 40000。分页只接受十进制正整数字符串；page 最大 1000000，page_size 最大 50，默认分别为 1、10。越界页面返回空 `items`，total_pages 至少为 1，兼容当前页面。
- lang 默认 zh-HK，接受 zh-HK/zh-CN/en-US 及 tc/sc/en 别名，内部统一为前三者；非法值 400 + 40000。不读取用户输入的任意语言列名。
- 第一版每篇可发布文章必须有三语非空 title/content，分类也有三语名称。列表、详情、目录共用可见条件：PUBLISHED、publishedAt <= 当前 UTC 时间且三语齐全；缺译、草稿、下线、未来时间的详情一律 HTTP 404 + code 40401，不做隐式语言回退。**`GET /api/categories` 必须返回全部九个子类**；分类数量、slug、parent_route、sortOrder 或请求语言名称任一不符合固定目录时，返回 HTTP 500 + code **50001**（`DATA_INTEGRITY_ERROR`），不得静默返回错误目录。
- 时间：数据库按 UTC `DateTime(3)` 保存；**API 业务时间字段**（当前为 `publish_date`、`generated_at`；以后 `created_at`/`updated_at`/登录时间等同理）统一输出 **13 位 Unix 毫秒时间戳（number）**。例：上海 `2026-09-10 10:00:00` 入库为 UTC 后，API 为 `1789005600000` 这类毫秒整数（以实际 `Date#getTime()` 为准）。日志字段 `time` 不属于业务 API，可继续使用 ISO 字符串便于阅读。ID 为正整数且不超过 MySQL 有符号 INT 上限 2147483647；详情接受数字 ID，不提供 slug 查询。
- 返回 content 为经过服务端白名单清理的 HTML；不得含脚本、事件属性、危险 URL。外部图片不由服务器任意抓取。第一版 cover_image 仅本站 /images/ 下无 .. 的相对资源路径或 /logo.svg，资源部署在前端 public；不实现上传。
- 列表排序 publishedAt DESC、id DESC；统计 total 与列表使用同一筛选和一致读事务。不保证多次请求期间内容发生变化时的跨页快照一致。

## 五个接口

| 方法/路径 | 参数 | 成功 data |
| --- | --- | --- |
| GET /health | 无 | `{ status: "ok", database: "up" }`；数据库失败 HTTP 503 + 50300 |
| GET /api/categories | lang | 恰好 9 项分类数组；按父分类固定顺序和子分类 sortOrder 排序；项为 slug/name/parent_route；缺译或条数不对 → 50001 |
| GET /api/articles | lang/category/page/page_size | `{ items, total, page, page_size, total_pages }`；items 内保留正文 |
| GET /api/articles/{id} | id 路径参数、lang | 单个 Article；不可见与不存在同一 40401 |
| GET /api/content-directory | 无 | `{ generated_at, articles }`；articles 为 id/parent_route/status/publish_date，固定 id ASC |

category 支持父分类 education/analysis/story、下表九种子类，以及旧父分类别名 lottery-teach→education、ai-predict→analysis、news-story→story。不传则全部；未知值 400。第一版不支持 q、任意排序和新分类写入。

| parent_route | category_slug（兼容既有页面） | 中文语义 |
| --- | --- | --- |
| education | how-to-play / skills / play-desc | 新手指南 / 进阶技巧 / 功能说明 |
| analysis | this-predict / last-review / tema-rule | 本期分析 / 往期回顾 / 指标规则 |
| story | lottery-news / win-story / activity-news | 平台动态 / 用户故事 / 活动资讯 |

Article 必填字段：id、title、slug、content、publish_date、author、cover_image、status、category、category_slug、parent_route。category 是请求语言的子类名称，status 在公开响应中恒为 1。字段类型、长度和示例见 OpenAPI。

构建目录从同一可见集合输出三语齐全文章。第一版上限 10000 篇；超过返回 HTTP 503 + code 50301，不得截断导致漏路由。generated_at 只是快照获取时间，不作为文章 lastmod。前端现有 lastmod 取发布日期，未来编辑发布时须单独设计 updatedAt 与版本策略。

## 数据模型（设计，不是已建表）

| 模型 | 字段与约束 |
| --- | --- |
| Category | id Int 自增主键；slug varchar(50) 唯一；parentRoute varchar(20) 为三种父类之一；sortOrder Int；固定九条，应用校验父子映射 |
| CategoryTranslation | categoryId 外键；locale varchar(10)；name varchar(100)；联合主键(categoryId,locale) |
| Article | id Int 自增；slug varchar(160) 唯一；categoryId 外键；author varchar(100)；coverImage varchar(500) 默认 /logo.svg；status 枚举 DRAFT/PUBLISHED/ARCHIVED 默认 DRAFT；publishedAt DateTime(3) 可空；createdAt/updatedAt DateTime(3) |
| ArticleTranslation | articleId 外键；locale varchar(10)；title varchar(200)；content MediumText（接口/应用限制最多 100000 字符）；联合主键(articleId,locale) |

正文先校验长度再做 HTML 白名单清理。超过 100000 字符视为数据完整性错误并返回 50001，不通过字符串截断生成残缺 HTML；后续管理端写入接口还需在写入边界返回参数错误。

Prisma 模型和代码字段 camelCase，通过 @map/@@map 映射 snake_case 表列。业务外键 Category→Article 删除限制 RESTRICT；翻译从属记录可随主记录级联删除，但本批无删除接口。索引 Article(status,publishedAt,id) 与 Article(categoryId,status,publishedAt,id)，先不添加其他重复索引。数据库外键不能证明三语齐全，必须在服务可见性查询和后续发布事务中落实。

种子只采用已脱敏 Mock 文章和九个分类，保留文章 ID 以稳定路由；原时间明确按 Asia/Shanghai 转 UTC。脚本幂等，默认只插入缺失记录，不覆盖后续人工编辑的内容，不清空库；三语分类名称明确编写，不调用外部 AI。统计、用户和发布日志表待对应任务再定。

## Apifox 与验收

在 Apifox 导入 `docs/backend/openapi.json`，基础地址设为 `http://127.0.0.1:4000`。真实调试前先启动后端（`pnpm dev` 或 `pnpm build && pnpm start`），并确认已 migrate/seed。自动化校验：后端目录执行 `pnpm openapi:validate`（`@apidevtools/swagger-parser`）；接口集成测试：`pnpm test:integration`（不清空开发库）。B7.2 记录中 **Apifox 人工导入未实际执行**。

建议调试顺序（均核对 HTTP 状态 + 数字 `code` + `msg` + `data`/`requestId`）：

1. `GET /health` → 200 / code 0，`data.status=ok`、`data.database=up`
2. `GET /api/categories?lang=sc` → 200 / code 0，9 条子类
3. `GET /api/articles?lang=sc&page=1&page_size=2` → 200 / code 0，`data.items` 分页
4. `GET /api/articles/101?lang=en` → 200 / code 0，`publish_date` 为毫秒时间戳
5. `GET /api/content-directory` → 200 / code 0，`articles` 按 id ASC，`generated_at`/`publish_date` 均为毫秒；任意 query → 40000

补查：`page=0`、`page_size=51`、`lang=xx`、重复 `lang`、未知分类、未知 ID；用测试数据验证草稿/未来时间/缺译不出现在列表、详情与目录。目录超过 10000 可见篇时为 HTTP 503 / code 50301，不得截断。不是仅检查 HTTP 200。

OpenAPI 采用 [3.0.3 规范](https://spec.openapis.org/oas/v3.0.3)。只描述第一批五个接口，后续每批在此文件追加，不另起互相冲突的契约。第一批接口已实现，不等于完整后端（统计、认证、发布等仍待后续批次）。
