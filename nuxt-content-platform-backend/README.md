# nuxt-content-platform-backend

ContentPulse 资讯后端（TypeScript + Express + Prisma + MySQL）。项目状态见 `docs/STATUS.md`，接口契约见 `docs/backend/`。

## 当前能力（第一批，不等于完整后端）

五个公开 GET：

| 路径 | 说明 |
| --- | --- |
| `GET /health` | 服务与数据库就绪 |
| `GET /api/categories` | 九个子分类本地化名称 |
| `GET /api/articles` | 已发布文章分页列表 |
| `GET /api/articles/{id}` | 文章详情 |
| `GET /api/content-directory` | 构建/sitemap 用完整可见快照 |

统一响应：

- 成功：`{ code: 0, msg: "ok", data: T }`（无 requestId）
- 失败：`{ code: 非零数字, msg, data: null, requestId }`，HTTP 仍用 400/404/500/503

业务时间字段（`publish_date`、`generated_at` 等）为 **13 位 Unix 毫秒时间戳**（number）。数据库仍存 UTC `DateTime(3)`，不在 API 返回 ISO 字符串。日志里的 `time` 例外，可继续用 ISO 便于阅读。

分层：`Route → Controller → Service → Prisma`（`src/routes` / `controllers` / `services` / `db`）。

## 版本固定

| 工具 | 版本 |
| --- | --- |
| Node.js | >=22.12.0 |
| pnpm | 10.11.0 |
| Express | 5.2.1 |
| Prisma / @prisma/client | 6.19.3 |
| TypeScript | 5.9.2 |
| Zod | 4.1.5 |

## 常用命令

```bash
pnpm install
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm build
pnpm dev          # 127.0.0.1:4000
pnpm start
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:status
```

复制 `.env.example` 为 `.env`，填写专用 `content_platform_dev` / `content_platform_shadow`（见 `docs/backend/MYSQL_SETUP.md`）。不要提交凭据，不要在日志打印连接串，不要对其他项目库执行 migrate reset / 随意 db push。

## 已验证 / 未完成

- 已验证：迁移与幂等种子、统一外壳、分类/列表/详情/内容目录、毫秒时间戳序列化（B6.1）。
- 未完成：前端联调（B7）、HTML 清理加固、OpenAPI 自动化测试、分类完整性收口、统计/认证/发布等后续批次。
