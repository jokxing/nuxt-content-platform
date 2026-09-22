# 封面上传与媒体存储设计（A5.2 / B9.3.2）

日期：2026-09-22。状态：**仅设计，未实现**。实现阶段为 A5.3。机器契约见 [admin-openapi.json](./admin-openapi.json)；文字契约见 [ADMIN_CONTRACT.md](./ADMIN_CONTRACT.md)。

## 1. 目标与边界

- 管理端通过同源 BFF 上传单张封面图；浏览器不持有 R2/S3 密钥，不使用预签名管理能力。
- 文章表继续只存 `cover_image`（可信 URL 字符串，最长 500）；不把二进制塞进文章行。
- 不接受 SVG、任意外链抓取、用户自定义对象 key、路径穿越。
- 删除文章或替换封面时**不立即删除**对象文件（可能被其他文章复用）；首版用 MediaAsset 记录 + 定时孤儿清理。

## 2. 现状基线（审查结论）

| 项 | 现状 |
| --- | --- |
| `isValidCoverImage` | 仅 `/logo.svg` 或 `/images/...`，拒绝 `http(s)` |
| Express | `express.json({ limit: '1mb' })`，无 multipart |
| Admin BFF | `readRawBody` 透传；白名单无 media；超时 15s；无显式体大小上限 |
| 公开站 | `<img :src="cover_image">` 相对路径；SEO og:image 经 `getFullUrl` 绝对化 |
| 依赖 | backend 无 sharp/multer；web 经 `@nuxt/image` 传递 sharp（与上传无关） |
| 部署 | 现行文档为 Node/Nitro SSR；Cloudflare Pages + R2 为后续目标，媒体 URL 不进静态产物亦可 SSR 引用 |

## 3. 接口：`POST /api/admin/media/images`

- **Content-Type**：`multipart/form-data`
- **字段**：唯一文件字段名 `file`（不得多文件、不得额外业务字段）
- **鉴权**：有效会话 + `Origin` 精确匹配 + `X-CSRF-Token`
- **原始上传上限**：5 MiB（字节，含 multipart 开销前的文件部分；BFF/网关略高，见 §6）
- **允许格式**：JPEG / PNG / WebP；必须以魔数判定，不能只信扩展名或声明的 Content-Type
- **禁止**：SVG、GIF、BMP、ICO、HEIC、PDF、任意可执行内容

### 3.1 服务端处理流水线

1. 解析 multipart，拒绝未知字段与多文件。
2. 检查原始字节长度 ≤ 5 MiB。
3. 魔数嗅探 MIME；与允许集合比对。
4. 用图像库（实现阶段建议 `sharp`）解码；限制最长边 **2048px**，像素总量 ≤ **8_388_608**（约 2048²）；超限拒绝（不解压炸弹拖垮内存：先读 metadata，再按策略 resize）。
5. **统一重编码为 WebP**（quality ≈ 80），剥离 EXIF/ICC 等元数据。
6. 生成对象 key：`covers/{yyyy}/{mm}/{ulid}.webp`（服务端 ULID/UUID，不用用户文件名）。
7. 经 `StorageAdapter.put` 写入；成功后写入 `MediaAsset` 行。
8. 返回 `MediaAsset` DTO。任一步失败：删除本次已写入的临时/对象，不落半成品库记录（或事务回滚后补偿删除）。

### 3.2 成功 DTO

```json
{
  "id": 1,
  "key": "covers/2026/09/01HZYX….webp",
  "url": "https://media.example.com/covers/2026/09/01HZYX….webp",
  "mime_type": "image/webp",
  "width": 1200,
  "height": 630,
  "size": 87654,
  "created_at": 1727000000000
}
```

`url` 必须等于 `MEDIA_PUBLIC_BASE_URL`（无尾斜杠）+ `/` + `key`，不得返回任意用户可控 host。实现时必须用 `URL` 解析后比较协议、origin 和路径边界，不能只用字符串 `startsWith`，避免 `https://media.example.com.evil.test/...` 通过前缀判断。

### 3.3 错误码（上传专用）

| code | 符号名 | HTTP | 典型 msg |
| --- | --- | --- | --- |
| 40000 | INVALID_ARGUMENT | 400 | 缺少 file / 格式不支持 / 不是合法图片 / 尺寸超限 / 字段非法 |
| 40100 | AUTH_REQUIRED | 401 | 请先登录 |
| 40301 | CSRF_INVALID | 403 | 请求来源校验失败 |
| 41300 | PAYLOAD_TOO_LARGE | 413 | 图片超过 5 MiB 上限 |
| 50000 | INTERNAL_ERROR | 500 | 内部服务错误（不泄存储细节） |
| 50300 | SERVICE_UNAVAILABLE | 503 | 媒体存储暂不可用 |

日志不得记录文件二进制、Cookie、CSRF、R2 密钥。

## 4. `cover_image` 校验放宽（A5.3 与文章写入同步）

允许以下之一：

1. `/logo.svg`
2. `/images/` 开头的站内相对路径（沿用现规则，禁止 `..` `\` `//`）
3. 以配置的 `MEDIA_PUBLIC_BASE_URL` 为前缀的 **https** URL（生产），或本地媒体基址（如 `http://127.0.0.1:4000/media`）——精确前缀匹配，拒绝其他 `http(s)`

管理端表单：Upload 成功后只写入返回的 `url`；**保留**手动输入框，但只能填上述可信值（便于用 `/logo.svg` 或已有媒体 URL）。不得开放任意外链。

公开站：若 `cover_image` 已是绝对 URL，`<img src>` 与 SEO `og:image` 直接使用，不再二次拼接 origin；相对路径行为保持不变。

## 5. StorageAdapter

```text
interface StorageAdapter {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  delete(key: string): Promise<void>   // 仅孤儿清理任务调用
  // 不暴露 listBuckets / 预签名管理 / 任意 key 覆盖给 HTTP 层
}
```

### 5.1 本地开发：`LocalDiskStorageAdapter`

- 根目录：`nuxt-content-platform-backend/.data/media/`（根 `.gitignore` 已含 `.data/`）
- 公开读取：Express **非管理**路由 `GET /media/*`，仅映射到该目录下 `covers/`，拒绝 `..`；`Cache-Control` 可长期缓存
- `MEDIA_PUBLIC_BASE_URL` 示例：`http://127.0.0.1:4000/media`
- 管理站/公开站开发时通过完整 URL 引用；公开站 SSR 可跨 origin 拉图（或文档约定本地 hosts）

### 5.2 生产：`R2StorageAdapter`（S3 兼容）

- 凭据仅后端环境变量：`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_ENDPOINT`（名称以实现为准）
- `MEDIA_PUBLIC_BASE_URL`：生产固定为 R2 自定义域（例如 `https://media.example.com`），写入 public runtime **仅此基址字符串**，不含密钥。`r2.dev` 仅供开发测试，不能作为生产媒体地址。
- 对象 ACL/公开读由桶策略保证；应用不把密钥下发浏览器
- 使用随机不可变 key，响应建议 `Cache-Control: public, max-age=31536000, immutable`；换封面产生新 key，不覆盖旧对象。
- 作品规模使用 R2 Standard；不要为少量封面引入 Infrequent Access 的读取计费与最短存储期语义。

### 5.3 与 Cloudflare Pages / SSR

- 静态构建产物不嵌入上传文件；页面 HTML/JSON 只引用媒体 URL。
- 现行公开站为 Node SSR 亦可；未来 Pages 静态 + 边缘 SSR 时，浏览器直接请求 `MEDIA_PUBLIC_BASE_URL`，构建流水线无需下载全部媒体。
- 内容目录/SEO 构建只要能解析文章 DTO 中的 URL 字符串即可，不要求构建机挂载 R2 私有盘。
- 公开站 `OptimizedImage` 对绝对 URL 已走原生 `<img>`，SEO 的 `new URL(absolute, siteOrigin)` 会保留绝对媒体 URL，因此不需要把 R2 域名加入 Nuxt Image 远程优化白名单。

## 6. BFF（管理端 Nitro）约束

- 白名单新增：`POST media/images`，`queryKeys: []`
- 仅该路由允许 `multipart/form-data`；继续不转发 Authorization
- **请求体上限**：业务文件 5 MiB，BFF/Nitro 建议 **6 MiB**（容纳 multipart 边界），超限直接 413，不转发
- **超时**：上传路由建议 **60s**（现全局 15s 不够）；其他管理 API 保持 15s
- Cookie / Origin / CSRF 原样转发；响应仍为 JSON 外壳

## 7. MediaAsset 最小模型（建议 A5.3 追加迁移）

在 A2/A4 之后、与 A6 审计迁移可并行顺序追加：

```text
MediaAsset
  id            Int @id
  key           String @unique   // 对象存储 key
  url           String           // 对外 URL（冗余便于查询，须与基址+key 一致）
  mimeType      String
  width         Int
  height        Int
  sizeBytes     Int
  adminUserId   Int?             // 上传人
  createdAt     DateTime
  // 可选：orphanedAt DateTime?  标记进入清理候选的时间
```

- 文章 `cover_image` **不**做数据库外键到 MediaAsset（URL 字符串保持简单；引用关系用 `url`/`key` 扫描）。
- 替换封面或删文章：只改文章字段，**不**删 MediaAsset/对象。
- 孤儿清理（首版可手工脚本或日后 cron）：
  1. 找出 `MediaAsset` 中 `createdAt` 早于 N 天（建议 7）的行；
  2. 若无任何 `Article.cover_image` 等于其 `url`，则 `storage.delete(key)` 并删行；
  3. 清理失败记安全摘要，可重试。

## 8. Apifox / 手工验收用例

1. 登录后 multipart 上传合法 JPEG ≤5MiB → 201，`mime_type=image/webp`，`url` 前缀为配置基址。
2. 伪造 `Content-Type: image/jpeg` 的 SVG/文本 → 40000。
3. 扩展名为 `.png` 但魔数为 SVG → 40000。
4. 文件 >5MiB → 41300。
5. 超大像素/炸弹图 → 40000，进程不 OOM。
6. 未登录 → 40100；无 CSRF → 40301。
7. 上传成功后把返回 `url` 写入草稿并保存文章 → 管理详情与公开页（若已发布）可显示。
8. 将 `cover_image` 改为 `https://evil.example/x.webp` → 文章写入 40000。
9. 存储写入失败 → 不产生 MediaAsset 行，临时对象已清理。
10. 浏览器 Network 与前端包中无 R2 密钥。

## 9. A5.3 实现清单（本阶段不执行）

- [ ] Prisma MediaAsset 迁移
- [ ] sharp 解码重编码 + StorageAdapter 本地/R2
- [ ] `POST /api/admin/media/images` + 公开 `GET /media/*`（本地）
- [ ] 放宽 `isValidCoverImage` / 管理端 types
- [ ] BFF 白名单、6MiB、60s
- [ ] `uploadCoverImage` 客户端 + ArticleFormModal Upload UI
- [ ] 集成测试与文档 STATUS
