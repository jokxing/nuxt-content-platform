# 资讯管理接口与认证契约

日期：2026-09-22。阶段：A5.1 删除已实现；A5.2 封面上传为**已定稿设计、未实现**（详见 [MEDIA_UPLOAD_DESIGN.md](./MEDIA_UPLOAD_DESIGN.md)）；发布 / 部署仍为设计。机器可读契约见 [admin-openapi.json](./admin-openapi.json)。公开查询接口继续以 [BACKEND_CONTRACT.md](../backend/BACKEND_CONTRACT.md) 为准。

## 1. 范围与边界

第一版只服务一个预先创建的管理员，提供登录、退出、会话恢复、只读分类选项、文章列表/详情/创建/修改、受限硬删除、封面图片上传（设计见 A5.2，实现见 A5.3），以及后续的发布/下线和部署状态查询。不开放注册、分类维护、找回密码、OAuth、多租户或复杂 RBAC。

浏览器只访问管理站同源 `/api/admin/*`。Nuxt Nitro BFF 按“方法 + 固定路径”白名单代理到 Express，后端上游地址保存在私有 runtimeConfig。浏览器、localStorage、public runtimeConfig 和日志均不得出现会话令牌、密码、GitHub Token、Cloudflare / R2 凭据。

管理接口与公开 `/api/articles` 分开。公开接口仍只返回已发布、发布时间已到且三语完整的文章；管理接口可读取草稿和已下线内容。数据库内容状态与站点部署状态必须分开展示：文章写入成功不代表 Cloudflare 已更新。

## 2. 通用 HTTP 规则

- JSON UTF-8；除媒体上传外，请求体只接受 `application/json`。未知字段、未知/重复/数组/空 query 参数均拒绝。
- 媒体上传：`POST /api/admin/media/images` 使用 `multipart/form-data`，单文件字段 `file`；其余管理写接口仍为 JSON。
- 成功：`{ "code": 0, "msg": "ok", "data": T }`；成功响应不含 `requestId`。
- 失败：`{ "code": 非零数字, "msg": "安全的中文说明", "data": null, "requestId": "..." }`；HTTP 状态仍表达协议语义。
- 所有业务时间均为 13 位 Unix 毫秒。数据库继续用 UTC `DateTime(3)`。
- ID 是 1～2147483647 的十进制正整数。分页默认 `page=1&page_size=10`，`page_size` 最大 50。
- 写接口必须带 `X-CSRF-Token`；修改、删除、发布和下线请求必须带当前 `version`。
- 同一 HTTP 方法和资源的重复安全命令应幂等；不以全部返回 HTTP 200 掩盖失败。

### 2.1 管理业务码

公开接口已有业务码继续保留；管理接口新增：

| code | 符号名 | HTTP | 用途 |
| --- | --- | --- | --- |
| 40100 | AUTH_REQUIRED | 401 | 未登录、会话过期或已撤销 |
| 40101 | INVALID_CREDENTIALS | 401 | 用户名或密码错误，不能暴露账号是否存在 |
| 40300 | FORBIDDEN | 403 | 账号禁用或无权执行操作 |
| 40301 | CSRF_INVALID | 403 | CSRF 缺失、错误或来源不可信 |
| 40410 | ADMIN_ARTICLE_NOT_FOUND | 404 | 管理侧文章不存在 |
| 40900 | VERSION_CONFLICT | 409 | 乐观并发版本不匹配 |
| 40901 | ARTICLE_STATE_CONFLICT | 409 | 当前状态不允许该命令 |
| 40902 | UNIQUE_CONFLICT | 409 | slug 等唯一字段冲突 |
| 41300 | PAYLOAD_TOO_LARGE | 413 | 上传原始文件超过 5 MiB |
| 42200 | PUBLISH_VALIDATION_FAILED | 422 | 发布前完整性校验失败 |
| 42900 | LOGIN_RATE_LIMITED | 429 | 登录尝试过多 |

校验错误仍使用 `40000 INVALID_ARGUMENT`。为了保持现有统一错误外壳，第一版不在响应中新增任意结构；字段错误使用稳定、可定位的 `msg`，例如“简体中文标题不能为空”。后续确有批量字段错误需求时再统一扩展 ErrorEnvelope，不能单个接口私自变形。
## 3. 认证与会话

### 3.1 登录方式

- `POST /api/admin/auth/login` 接收 `username`、`password`，不提供注册。
- 密码使用成熟哈希库（实施阶段在 Argon2id 或 bcrypt 中按运行环境核实），数据库只保存 `passwordHash`。
- 登录失败统一返回 `40101` 和“用户名或密码错误”；响应、日志和计时差异不能用于确认账号是否存在。
- 按客户端 IP + 规范化用户名组合限速：连续失败 5 次后进入 15 分钟窗口；成功登录清理该组合的失败计数。若部署在反向代理后，只信任明确配置的代理层，不直接信任任意 `X-Forwarded-For`。

### 3.2 Cookie 和会话

- 登录成功生成至少 256 bit 安全随机 opaque token；Cookie 名固定为 `cp_admin_session`。
- Cookie 属性：`HttpOnly; SameSite=Lax; Path=/`；生产环境必须 `Secure`。不设置 `Domain`，使用 host-only Cookie，避免扩大到公开站子域。
- 数据库只保存 `SHA-256(token)`，不能保存原 token。每个会话保存 `idleExpiresAt`（最后活动后 12 小时）和 `absoluteExpiresAt`（创建后 7 天）；任一到期即失效。
- `GET /api/admin/auth/session` 返回管理员资料、两个过期时间和 CSRF token。CSRF token 可以进入内存状态，但不得写 localStorage；刷新后重新从 session 接口获取。
- 退出撤销当前会话并清除 Cookie。撤销、过期、账号禁用后均返回 `40100`；退出接口在已有/已失效会话下都可幂等成功并清 Cookie。
- 写请求成功验证会话后，可节流更新 `lastSeenAt/idleExpiresAt`，例如每 5 分钟最多写一次，避免每个请求都更新数据库。

### 3.3 CSRF 与来源

- 除登录和只读 GET 外，所有管理写请求必须同时满足：有效会话、`X-CSRF-Token` 与会话保存的 token 哈希常量时间匹配、`Origin` 精确匹配允许的管理站 origin。
- 登录没有既有会话，仍要求 JSON Content-Type，并校验 `Origin`；缺少 Origin 的非浏览器请求仅在明确的本地/测试配置中允许。
- SameSite=Lax 是额外防线，不能替代 CSRF token。CORS 默认不开放；管理站和 BFF 同源。生产建议管理站使用独立域名（如 `admin.example.com`），公开站使用另一 host，Cookie 因 host-only 不发送给公开站。

本地推荐 `http://localhost:3670`（管理站）→ Nitro 私有代理 → `http://127.0.0.1:4000`（Express）。本地 Cookie 不带 Secure；生产必须 HTTPS + Secure。不得在浏览器直接跨域请求 4000 端口。

## 4. 文章 DTO 与状态流转

### 4.1 字段

管理文章详情包含：

- `id`、`slug`、`author`、`cover_image`
- `category: { id, slug, parent_route, name }`，其中 `name` 使用简体中文供后台显示
- `status`: `DRAFT | PUBLISHED | ARCHIVED`
- `translations`: 固定包含 `zh-CN`、`zh-HK`、`en-US`，每项为 `{ title, content }`
- `published_at`: 首次/最近一次从非发布态进入发布态的时间，可空
- `created_at`、`updated_at`: 毫秒时间戳
- `version`: 从 1 开始的正整数，每次成功修改、发布或下线原子加 1；删除请求携带客户端最近读取的 version，成功后记录消失，不递增。

创建/修改请求使用 `slug`、`author`、`cover_image`、`category_id`、三语 `translations`。slug 为小写字母、数字和单连字符组成，长度 1～160；author 长度 1～100；标题最大 200；正文写入前最大 100000 字符并执行服务端 HTML 白名单清理。

**`cover_image` 合法值（A5.2 定稿，A5.3 起生效）**：

1. `/logo.svg`；或
2. 以 `/images/` 开头的站内相对路径（禁止 `..`、`\`、`//`）；或
3. 以环境配置 `MEDIA_PUBLIC_BASE_URL`（无尾斜杠）为精确前缀的媒体 URL（本地例如 `http://127.0.0.1:4000/media/...`，生产为 R2 公开 https 基址）

不接受任意其他 `http(s)`、远程抓取或用户指定对象 key。封面上传见 §5.1；文章行只存 URL 字符串。

草稿允许翻译标题/正文为空，但三个 locale 键仍必须存在，便于契约稳定。发布时三语标题和清理后的正文都必须非空，分类必须是现有九个固定子类，slug、author、cover_image 必须合法。

### 4.2 状态机

```text
DRAFT --发布--> PUBLISHED --下线--> ARCHIVED
   ^                  |                 |
   |                  | 修改            | 发布
   |                  v                 v
   +--草稿修改--    PUBLISHED        PUBLISHED
```

- 创建固定为 `DRAFT`，不能由客户端指定状态。
- 修改 `DRAFT/ARCHIVED` 只保存内容，不触发构建；修改 `PUBLISHED` 保持发布状态并产生内容变更事件。
- 发布 `DRAFT/ARCHIVED`：校验完整性，设置 `publishedAt=now`，状态改为 `PUBLISHED`；重复发布已经发布且版本一致的内容视为状态冲突，不伪造一次新部署。
- 下线 `PUBLISHED`：状态改为 `ARCHIVED`；已下线或草稿执行下线返回 `40901`。
- 受限硬删除：仅允许删除 `DRAFT` 或 `ARCHIVED`。请求体为 `{ version }`；`ArticleTranslation` 随外键级联删除。`PUBLISHED` 返回 `40901` 并提示先下线，避免公开站仍可见而数据库记录已消失。不接受批量 ID，不提供 query 绕过，不新增公开删除接口。
- `ARCHIVED` 是已下线内容，可编辑或删除；不等同于可编辑草稿以外的第三种业务态。

### 4.3 乐观并发

修改、删除、发布、下线必须携带客户端最近读取的 `version`。事务更新/删除条件必须同时包含 `id + version`（删除另限允许状态），成功后修改类操作 `version += 1`。零行更新时重新判断：文章不存在返回 `40410`；存在但版本不同返回 `40900`；存在且版本匹配但状态不允许返回 `40901`。409 响应不自动覆盖，管理端应保留本地输入并提示用户重新载入最新内容。

## 5. 接口清单

| 方法与路径 | 用途 | 主要输入 | 成功 data |
| --- | --- | --- | --- |
| POST `/api/admin/auth/login` | 登录 | username/password | `AdminSession` |
| POST `/api/admin/auth/logout` | 退出 | CSRF header | `{ logged_out: true }` |
| GET `/api/admin/auth/session` | 恢复会话 | Cookie | `AdminSession` |
| GET `/api/admin/categories` | 表单分类选项 | 无 | `{ items: AdminCategory[] }` |
| GET `/api/admin/articles` | 管理列表 | status/category/q/page/page_size | 分页摘要 |
| GET `/api/admin/articles/{id}` | 编辑详情 | id | `AdminArticle` |
| POST `/api/admin/articles` | 创建草稿 | `ArticleWriteInput` | `AdminArticle`，HTTP 201 |
| PUT `/api/admin/articles/{id}` | 修改内容 | `version + ArticleWriteInput` | `AdminArticle` |
| DELETE `/api/admin/articles/{id}` | 受限硬删除 | `{ version }` | `{ id, deleted: true }` |
| POST `/api/admin/media/images` | 上传封面图 | multipart `file` | `MediaAsset`，HTTP 201 |
| POST `/api/admin/articles/{id}/publish` | 发布/重新发布 | version | `ArticleMutationResult` |
| POST `/api/admin/articles/{id}/unpublish` | 下线 | version | `ArticleMutationResult` |
| GET `/api/admin/deployments` | 部署事件列表 | status/reason/page/page_size | 分页部署状态 |
| GET `/api/admin/deployments/{id}` | 部署事件详情 | id | `DeploymentDetail` |

列表筛选：`status` 可空或三种枚举；`category` 使用分类 slug；`q` 去首尾空格后长度 1～100，只匹配 slug/author/三语标题，不对 HTML 正文做模糊查询；排序固定为 `updatedAt DESC, id DESC`。部署列表排序固定为 `createdAt DESC, id DESC`。

### 5.1 封面上传（A5.2 设计 / A5.3 实现）

- `POST /api/admin/media/images`：`multipart/form-data`，字段 `file`；须登录 + Origin + CSRF。
- 原始文件 ≤ 5 MiB；仅 JPEG/PNG/WebP；魔数校验；服务端解码后统一重编码为 WebP，最长边 2048、像素总量上限见 [MEDIA_UPLOAD_DESIGN.md](./MEDIA_UPLOAD_DESIGN.md)；禁止 SVG；对象 key 由服务端随机生成。
- 成功 HTTP **201**：`MediaAsset`（`id`、`key`、`url`、`mime_type`、`width`、`height`、`size`、`created_at`）。
- 存储：`StorageAdapter`；本地写入 gitignore 的 `.data/media` 并由 `GET /media/*` 读取；生产用 Cloudflare R2，凭据仅后端环境变量。`url` 必须落在 `MEDIA_PUBLIC_BASE_URL` 下。
- 追加 `MediaAsset` 表记录上传元数据；文章删改封面不立即删对象；孤儿由定时/脚本清理。
- BFF：白名单仅该路径；体上限约 6 MiB；上传超时约 60s；禁止把 R2 密钥或预签名管理交给浏览器。
- 管理端 UI（A5.3）：Naive Upload；成功只写入返回的可信 `url`；可保留手动输入但同样受 `cover_image` 规则约束；未保存文章时提示“图片已上传，文章仍未保存”。

## 6. 发布事件、审计与部署

文章事务包含文章/翻译修改、版本递增、AuditLog 和 BuildEvent(outbox) 写入。只有下列情况产生 BuildEvent：

| 操作 | 事件类型 | reason |
| --- | --- | --- |
| 首次发布或重新发布 | `ARTICLE_PUBLISHED` | `article_published` |
| 修改已发布文章 | `ARTICLE_UPDATED` | `article_updated` |
| 下线已发布文章 | `ARTICLE_UNPUBLISHED` | `article_unpublished` |

保存草稿不触发构建。删除草稿或已下线文章也不产生 BuildEvent（公开站本不可见这些内容）。文章数据与 outbox 必须在同一数据库事务中提交，确保已发布变化不会漏事件；事务提交后的 GitHub/Cloudflare 调用由后续 worker 处理。外部调用失败不能回滚已提交文章，而是把 BuildEvent 标为 `FAILED`，记录安全错误摘要并按策略重试。

**与 A6 审计的衔接**：A5.1 删除接口本身不写 `AuditLog` / `BuildEvent`（审计模型在 A6 迁移）。A6 实现发布事务时，应为删除补写 `AuditLog`（action 建议 `ARTICLE_DELETED`，记录 id/version/status/slug），仍不得为草稿/已下线删除写入 BuildEvent；若未来允许删除已发布内容，必须先下线并产生 `ARTICLE_UNPUBLISHED` 事件，再删除。

BuildEvent 状态：`QUEUED | RUNNING | SUCCEEDED | FAILED | SKIPPED`。幂等键建议为 `article:{id}:version:{version}:{eventType}` 并设唯一索引；worker 重试复用同一事件，不能重复新建。A7 可在 1～3 分钟窗口合并多个待处理事件，但原始事件仍可审计。`externalRunId/externalRunUrl` 可空，URL 只允许可信 GitHub 仓库运行页。

管理端发布成功文案应为“内容已发布，等待站点部署”；只有对应 BuildEvent 为 `SUCCEEDED` 才显示“站点部署成功”。`FAILED` 必须允许后续安全重试，但本阶段不设计浏览器传 shell 命令或任意 webhook URL。

AuditLog 记录 actor、action、entityType/entityId、文章版本、requestId、IP 摘要和时间。metadata 只记录状态、分类、slug 等必要差异，不保存密码、Cookie、CSRF token、完整正文或部署密钥。

## 7. 最小 Prisma 追加模型

不得修改已应用迁移；按以下顺序追加迁移：

1. **认证迁移**：`AdminUser`、`AdminSession`。先创建管理员模型与会话索引，不写默认密码。
2. **文章并发迁移**：`Article.version Int @default(1)`；现有行自动为 1。
3. **媒体资源迁移（A5.3）**：`MediaAsset`（id、key unique、url、mimeType、width、height、sizeBytes、adminUserId?、createdAt；可选 orphanedAt）。
4. **发布审计迁移（A6）**：`AuditLog`、`BuildEvent` 及枚举/唯一键/索引。

建议字段：

- `AdminUser`: id、username(unique)、passwordHash、displayName、isActive、lastLoginAt?、createdAt、updatedAt。
- `AdminSession`: id、adminUserId、tokenHash(unique)、csrfTokenHash、idleExpiresAt、absoluteExpiresAt、lastSeenAt、revokedAt?、createdAt；索引 user/expiry/revoked。
- `Article.version`: Int，默认 1。
- `MediaAsset`: 见上；与 `Article.cover_image` 无外键，靠 URL/key 扫描引用。
- `AuditLog`: id Int、adminUserId?、action、entityType、entityId、entityVersion?、requestId、ipHash?、metadata Json?、createdAt；不与文章做级联删除依赖。
- `BuildEvent`: id Int、eventType、reason、status、articleId?、articleVersion?、dedupeKey(unique)、attempts、nextAttemptAt?、externalRunId?、externalRunUrl?、errorSummary?、createdAt、startedAt?、finishedAt?、updatedAt；按 status/nextAttemptAt 与 createdAt 建索引。当前作品规模使用 MySQL 有符号 Int 足够，也避免 JavaScript/JSON 的 BigInt 序列化分支。

`AdminUser` 不需要 role/permission 表；单管理员也仍保留 `isActive` 以便紧急禁用。AdminSession 必须支持多设备与逐个撤销，不把 session 字段塞进 AdminUser。BuildEvent 不能复用 AuditLog，因为二者的重试状态、生命周期和查询目的不同。

## 8. 验收用例

1. 正确登录设置 host-only HttpOnly Cookie，响应不返回 session token；错误用户名和错误密码得到相同 `40101`。
2. 连续失败触发 `42900`；日志不含密码、Cookie 或哈希。
3. session 接口可恢复会话并返回 CSRF token；过期、撤销、禁用账号均为 `40100`。
4. 无 CSRF、错误 CSRF、错误 Origin 的写请求为 `40301`；合法同源请求成功。
5. 未登录访问全部管理文章和部署接口为 `40100`，公开 GET 行为不受影响。
6. 创建草稿允许空翻译内容但固定包含三语键，不产生 BuildEvent。
7. 两个客户端读取同一 version 后，先保存者成功并递增版本，后保存者得到 `40900`，数据库不被覆盖。
8. 三语缺失、危险 HTML、非法分类或封面不能发布；失败时文章、审计和事件均不产生半提交。
9. 首次发布、发布态修改、下线分别写唯一事件；草稿修改不写事件。重试不产生重复幂等键。
10. 发布后公开接口可见；下线后公开列表、详情、内容目录均不可见；管理详情仍可见。
11. 文章事务成功后外部部署失败，文章状态保持，BuildEvent 为 FAILED 且错误摘要不泄密。
12. 部署列表只返回真实事件；不存在事件时为空列表，不能制造成功记录。
13. 删除草稿或已下线文章：携带正确 version 成功，翻译级联消失，公开接口不受影响且不产生 BuildEvent。
14. 删除已发布文章返回 `40901`；错误 version 返回 `40900`；不存在返回 `40410`；无会话/无 CSRF 分别 `40100`/`40301`。
15. （A5.3）合法 JPEG/PNG/WebP ≤5MiB 上传成功返回 WebP 媒体 URL；伪造 MIME/SVG/超限/超像素失败且无半成品对象。
16. （A5.3）未登录/无 CSRF 不能上传；文章 `cover_image` 拒绝非可信基址的任意 URL；删文或换封面不立即删对象存储。

## 9. 实现进度

- **A2 / B9.2 已实现**：`AdminUser` / `AdminSession` 迁移；`POST /api/admin/auth/login`、`POST /api/admin/auth/logout`、`GET /api/admin/auth/session`；bcryptjs 密码哈希；HttpOnly Cookie；登录限速；Origin / CSRF 规则；`pnpm admin:ensure` 仅创建缺失管理员。
- **A3 已实现**：管理端 Nitro BFF、登录页、会话恢复与路由守卫（见 STATUS）。
- **A4 / B9.3 已实现**：`Article.version` 迁移；`GET /api/admin/categories`；`GET/POST /api/admin/articles`；`GET/PUT /api/admin/articles/{id}`；Zod 校验；HTML 清理；乐观并发；草稿允许空翻译；公开文章接口不泄露草稿。
- **A5 已实现**：管理端 `/articles` 列表（筛选/分页）、共用新建/编辑弹窗、三语 textarea、封面预览、未保存确认、版本冲突提示；无假发布按钮。
- **A5.0 已实现**：分类/详情可重试错误态；登录与保存失败以内联 alert 为主。
- **A5.1 / B9.3.1 已实现**：`DELETE /api/admin/articles/{id}` 受限硬删除（仅 DRAFT/ARCHIVED）；管理列表删除确认；BFF/客户端白名单。
- **A5.2 / B9.3.2 已定稿设计**：`POST /api/admin/media/images`、StorageAdapter、MediaAsset、错误码与验收用例见契约与 [MEDIA_UPLOAD_DESIGN.md](./MEDIA_UPLOAD_DESIGN.md)；**尚未写实现代码**。
- **尚未实现**：封面上传实现（A5.3）、发布/下线与 BuildEvent（A6）、外部构建（A7）。禁止用 Mock 冒充这些能力。

## 10. 明确未实现（相对完整后台）

本阶段没有实现媒体上传代码、发布事务、BuildEvent outbox，也没有调用 GitHub/Cloudflare/R2。删除也不写 AuditLog（待 A6）。A5.3 按本契约实现上传；A6/B9.4 实现发布事务与 outbox，并为删除补审计；A7/B9.5 才处理外部构建。