# 后端逐项接手提示词

每次只复制下面一个代码块。每段都有读取入口和停止条件；完成后由用户检查结果，再给下一段。不能复制整份文档要求 AI 连续执行全部步骤。没有数据库时，可以完成不依赖连接的工作，连接验证必须标为未完成。

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

## B4：文章列表

```text
仅执行 B4。读取适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json，确认前置项完成。实现 GET /api/articles，数据库过滤已发布、发布时间和三语完整性；兼容父/子分类与旧别名；稳定排序、分页、total 与 total_pages 遵循契约，列表保持 content 字段，HTML 按白名单清理。共享可见性与 DTO 映射放在服务层，不在各路由复制。
用专用测试数据验证分页边界、超页、分类、语言、隐藏草稿/未来文章/缺译和错误响应。测试不得清空用户开发库。同步 STATUS.md，然后停止；不要实现详情、管理端或前端联调。
```

## B5：文章详情

```text
仅执行 B5。先读适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json。实现 GET /api/articles/{id}，复用列表可见性与 DTO，非法 ID 为 400，不存在/草稿/下线/未来/缺译统一 404。不能直接返回 Prisma 完整对象，不能泄露内部字段。验证三语内容、HTML 清理、ID 边界和不可见记录。更新 docs/STATUS.md 后停止，不继续内容目录或前端改动。
```

## B6：构建内容目录与契约验收

```text
仅执行 B6。读取适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json。实现 GET /api/content-directory，使用一致读快照和同一可见性条件，返回稳定排序的完整集合；超限明确报错，不截断。不要运行前端构建/部署命令，不提供任意 shell 执行接口。
核对第一批五个接口的实际响应、示例、错误、语言和日期与 OpenAPI 一致；验证所有 $ref 和文档结构，有条件用 OpenAPI 校验器。更新 Apifox 调试步骤与 STATUS.md，明确测试结果后停止。不得把这一批称为完整后端。
```

## B7：资讯前后端联调

```text
仅执行 B7。先读适用 AGENTS.md、docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json、docs/frontend/API_CLIENT.md、docs/frontend/ROUTES_AND_SITEMAP.md、docs/frontend/SEO_REACTIVITY.md。前提是 B1-B6 已验证。通过 Nuxt 服务端私有配置与 Nitro 代理将文章列表/详情切到真实 Express，不把后端内部地址暴露到 public，不破坏 SSR 实例隔离。仅允许固定上游路径/查询参数，不透传任意 URL 或认证头；上游超时/错误明确转换，不回退 Mock。统计继续 Mock，按资讯范围配置切换。
构建真实模式读取一次 content-directory 快照，供预渲染与 sitemap 共用；失败必须中止构建，不能生成残缺目录。Mock 模式仍能离线构建。校验 API 日期改为 UTC 后页面显示，三语列表/详情、404、跳转与 SEO；按实际改动运行 lint/typecheck/build 和必要浏览器验证。记录 API 直连和 Nuxt 代理差异，更新导览和 STATUS.md，然后停止。不要实现登录、发布或推送部署。
```

## B8：统计契约设计（只设计）

```text
仅执行 B8 设计，不写统计后端。读取 docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md、docs/backend/openapi.json、docs/frontend/MOCK_DATA_CONTRACT.md、前端 app/mock/statistics.ts 和统计页面实际调用。逐字段设计 latest/history/analysis/advanced-stats/number-miss，以及明确为固定示例的组合接口；确定数据库模型、范围、公式、空数据与参数规则。兼容已有字段必须有映射依据，不宣称 AI 推理能力。将本批契约追加进唯一 docs/backend/openapi.json，并补每次只实现一个接口的后续独立提示词，更新 docs/STATUS.md 后停止，等待用户选择下一任务。
```

## B9：认证与编辑发布契约设计（只设计）

```text
仅执行 B9 设计，不写管理接口。读取 docs/STATUS.md、docs/backend/BACKEND_CONTRACT.md 和 docs/backend/openapi.json，独立设计单管理员登录/退出/会话、文章草稿编辑、三语校验、发布/下线、并发编辑冲突和操作记录。明确认证、会话失效、密码哈希、授权和请求校验，不提供公开注册，不拿 AI 多模态 token 直接复用。选定认证方式后更新 OpenAPI securitySchemes、错误、请求/响应及验收用例。
前端目前是预渲染，发布状态与部署状态必须区分；设计受控重建的授权、固定命令、并发/失败/重试与旧站保留，不允许用户输入 shell 命令。第一版若采用手动部署，明确发布不会自动更新线上，不伪造完整自动闭环。拆成登录、草稿、发布、部署等一次一个的实现提示词。更新 STATUS.md 后停止，不直接实施全部功能。
```
