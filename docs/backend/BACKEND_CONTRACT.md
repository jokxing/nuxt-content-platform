# 后端接口契约：第一批资讯查询

日期：2026-09-19。状态：设计完成，接口尚未实现。机器可读契约为 [openapi.json](./openapi.json)，实现若需修改字段，先同步契约并记录原因。

## 范围和衔接

第一批只实现健康检查、分类、文章列表、文章详情、构建内容目录。管理员登录、编辑发布、历史统计的契约分别在后续单任务中确定，不允许接手 AI 根据本文一次性完成全栈。执行入口见 [后端逐项提示词](./BACKEND_HANDOFF_PROMPTS.md)。

依据：前端 app/mock/index.ts、app/mock/data/catalog.ts、app/api/client.ts、server/api/[...].ts、新闻页面及 scripts/content-directory.ts。列表和详情沿用现有字段，不新增 data 外壳；新分类/目录接口不代表前端已接入。

后端开发地址拟为 http://127.0.0.1:4000。Nuxt 仍使用同源 /api，由 Nitro 在后续联调任务代理到 Express。服务端私有配置 CONTENT_API_BASE_URL，不进入 public runtimeConfig。第一批仅资讯切换，统计仍为 Mock，明确展示这种阶段状态。上游失败返回错误，禁止静默回退 Mock。

## 通用规则

- 公开 GET，无登录要求；不支持公开写入。JSON UTF-8，正常返回 200；参数错误 400、文章不可见 404、内部错误 500、数据库不可用 503。
- 错误统一为 `{ "error": { "code": "INVALID_ARGUMENT", "message": "参数不合法", "requestId": "服务端生成的请求标识" } }`。不得返回 SQL、数据库地址、密码或堆栈。
- GET query 只允许契约参数；未知、重复、数组、空值参数均 400。分页只接受十进制正整数字符串；page 最大 1000000，page_size 最大 50，默认分别为 1、10。越界页面返回空数组，total_pages 至少为 1，兼容当前页面。
- lang 默认 zh-HK，接受 zh-HK/zh-CN/en-US 及 tc/sc/en 别名，内部统一为前三者；非法值 400。不读取用户输入的任意语言列名。
- 第一版每篇可发布文章必须有三语非空 title/content，分类也有三语名称。列表、详情、目录共用可见条件：PUBLISHED、publishedAt <= 当前 UTC 时间且三语齐全；缺译、草稿、下线、未来时间的详情一律 404，不做隐式语言回退。
- 时间数据库按 UTC 保存；API publish_date 输出 ISO 8601 UTC（例 2026-09-10T02:00:00.000Z），与旧 Mock 无时区字符串不同，联调时验证展示时区。ID 为正整数且不超过 MySQL 有符号 INT 上限 2147483647；详情接受数字 ID，不提供 slug 查询。
- 返回 content 为经过服务端白名单清理的 HTML；不得含脚本、事件属性、危险 URL。外部图片不由服务器任意抓取。第一版 cover_image 仅本站 /images/ 下无 .. 的相对资源路径或 /logo.svg，资源部署在前端 public；不实现上传。
- 列表排序 publishedAt DESC、id DESC；统计 total 与列表使用同一筛选和一致读事务。不保证多次请求期间内容发生变化时的跨页快照一致。

## 五个接口

| 方法/路径 | 参数 | 返回/行为 |
| --- | --- | --- |
| GET /health | 无 | 服务和数据库就绪返回 status=ok；数据库失败 503 |
| GET /api/categories | lang | data 数组，按父分类固定顺序和子分类 sortOrder 排序；返回 slug/name/parent_route |
| GET /api/articles | lang/category/page/page_size | data,total,page,page_size,total_pages；data 内保留正文，兼容当前列表提取摘要 |
| GET /api/articles/{id} | id 路径参数、lang | 单个 Article；不可见与不存在使用同一 ARTICLE_NOT_FOUND |
| GET /api/content-directory | 无 | generated_at + articles（id,parent_route,status,publish_date），固定 id ASC，一次完整快照 |

category 支持父分类 education/analysis/story、下表九种子类，以及旧父分类别名 lottery-teach→education、ai-predict→analysis、news-story→story。不传则全部；未知值 400。第一版不支持 q、任意排序和新分类写入。

| parent_route | category_slug（兼容既有页面） | 中文语义 |
| --- | --- | --- |
| education | how-to-play / skills / play-desc | 新手指南 / 进阶技巧 / 功能说明 |
| analysis | this-predict / last-review / tema-rule | 本期分析 / 往期回顾 / 指标规则 |
| story | lottery-news / win-story / activity-news | 平台动态 / 用户故事 / 活动资讯 |

Article 必填字段：id、title、slug、content、publish_date、author、cover_image、status、category、category_slug、parent_route。category 是请求语言的子类名称，status 在公开响应中恒为 1。字段类型、长度和示例见 OpenAPI。

构建目录从同一可见集合输出三语齐全文章。第一版上限 10000 篇；超过返回 503 CONTENT_DIRECTORY_LIMIT_EXCEEDED，不得截断导致漏路由。generated_at 只是快照获取时间，不作为文章 lastmod。前端现有 lastmod 取发布日期，未来编辑发布时须单独设计 updatedAt 与版本策略。

## 数据模型（设计，不是已建表）

| 模型 | 字段与约束 |
| --- | --- |
| Category | id Int 自增主键；slug varchar(50) 唯一；parentRoute varchar(20) 为三种父类之一；sortOrder Int；固定九条，应用校验父子映射 |
| CategoryTranslation | categoryId 外键；locale varchar(10)；name varchar(100)；联合主键(categoryId,locale) |
| Article | id Int 自增；slug varchar(160) 唯一；categoryId 外键；author varchar(100)；coverImage varchar(500) 默认 /logo.svg；status 枚举 DRAFT/PUBLISHED/ARCHIVED 默认 DRAFT；publishedAt DateTime(3) 可空；createdAt/updatedAt DateTime(3) |
| ArticleTranslation | articleId 外键；locale varchar(10)；title varchar(200)；content MediumText（接口/应用限制最多 100000 字符）；联合主键(articleId,locale) |

Prisma 模型和代码字段 camelCase，通过 @map/@@map 映射 snake_case 表列。业务外键 Category→Article 删除限制 RESTRICT；翻译从属记录可随主记录级联删除，但本批无删除接口。索引 Article(status,publishedAt,id) 与 Article(categoryId,status,publishedAt,id)，先不添加其他重复索引。数据库外键不能证明三语齐全，必须在服务可见性查询和后续发布事务中落实。

种子只采用已脱敏 Mock 文章和九个分类，保留文章 ID 以稳定路由；原时间明确按 Asia/Shanghai 转 UTC。脚本幂等，默认只插入缺失记录，不覆盖后续人工编辑的内容，不清空库；三语分类名称明确编写，不调用外部 AI。统计、用户和发布日志表待对应任务再定。

## Apifox 与验收

在 Apifox 导入 `docs/backend/openapi.json`，基础地址设为 http://127.0.0.1:4000。导入可先查看文档和使用工具 Mock，真实调试必须等后端启动并完成迁移/种子。

验收顺序：health → categories?lang=sc → articles?lang=sc&page=1&page_size=2 → articles/101?lang=en → content-directory。补查 page=0、page_size=51、lang=xx、重复 lang、未知分类、未知 ID；用测试库数据验证草稿/未来时间/缺译不公开。不是仅检查 HTTP 200。

OpenAPI 采用 [3.0.3 规范](https://spec.openapis.org/oas/v3.0.3)。只描述第一批五个接口，后续每批在此文件追加，不另起互相冲突的契约。
