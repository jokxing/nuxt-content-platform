# 路由与 sitemap 共用内容目录

更新：2026-09-20。Mock 模式离线读 catalog；真实模式构建前拉取一次 content-directory 快照。

## 数据流与文件导览

- Mock：`app/mock/data/catalog.ts` → `scripts/prepare-content-directory.ts` 写入快照 → `createContentDirectory` → 预渲染 / sitemap
- 真实：`NUXT_CONTENT_API_USE_REAL=true` 时 prepare **一次**请求 Express `GET /api/content-directory`，失败则中止构建；预渲染与 sitemap 只读同一份 `.nuxt/content-directory-snapshot.json`，禁止各自独立请求

- `createContentDirectory` 是纯函数：固定页面加上已发布文章，再展开三语。`publish_date` 支持 13 位毫秒或 Mock 本地时间字符串；lastmod 经 `toSitemapLastmod` 转为 `YYYY-MM-DD`（Asia/Hong_Kong）。
- `nuxt.config.ts` 通过 `resolveContentArticlesForBuild()` 读快照（或 Mock 回退）；真实模式无快照会直接抛错。
- `scripts/sitemap-content.ts` 负责站点地址校验、去重检查和 XML 转义；`generate-sitemaps.ts` 读取与 prerender 相同的文章列表。
- build：`prepare-content-directory → generate-sitemaps → nuxt build`；失败则中止。单独更新使用 `pnpm update-sitemaps`。

## 收录策略

目录标记决定哪些路径进入 sitemap，而不是将所有可访问路径一股脑收录。当前共 66 个 URL：三语首页、三个统计模块、组合工具、三个资讯父分类、九个资讯子分类和五篇文章。资讯 type 子路由有独立筛选结果、title/description、canonical、hreflang 与 CollectionPage JSON-LD，因此纳入 sitemap；重定向入口与旧详情入口不进入 sitemap，但保留预渲染兼容。

三语都有独立 URL。页面输出 canonical 及 zh-HK/zh-CN/en-US/x-default 四组 hreflang；sitemap 暂不使用 xhtml hreflang 扩展，三语 URL 分别列出。

文章 lastmod 使用发布日（精确到日，由毫秒时间戳显式转换）；没有更新时间的固定页省略 lastmod，不用构建当天冒充内容更新时间。后端接入后应优先提供可靠的 updated_at。Mock 三种语言目前均完整；后续应按文章实际可用语言展开。

NUXT_PUBLIC_SITE_URL 必须是 HTTP(S) 站点根地址，可有末尾斜杠，不允许账号密码、子路径、查询串或片段。默认 `http://localhost:3666`，与当前本地演示配置一致；构建脚本会读取项目 `.env`。构建与运行部署应使用同一站点地址。

删除旧 ALLOW_LEGACY_DEPLOY / ALLOW_SITEMAP_GENERATE 生成门槛：本命令只有本地文件生成，不发布、不联网（Mock）；真实模式仅请求配置的 NUXT_CONTENT_API_BASE_URL。robots 的 Disallow 与页面 noindex 保持不变，sitemap 只是演示产物，当前不能宣称允许搜索收录。

## 后端接入边界（B7 已落地）

真实接口下，构建开始获取一次已发布内容快照，校验 ID、分类和时间。预渲染与 sitemap 读取同一份快照。接口失败中止构建，避免发布不完整目录。运行时列表/详情经 Nitro 白名单代理；统计仍 Mock。不包含定时部署或发布触发器。

## 验证与文字面试说明

`pnpm exec tsx scripts/check-content-directory.ts` 验证新增文章自动扩展三语路由与 sitemap、草稿排除、重复 ID/非法分类/非法日期拒绝、毫秒 lastmod、站点地址约束、XML 转义和确定性输出。

`npm run audit:seo` 审计 `.output/public`：逐个 sitemap URL 核对预渲染 HTML、唯一 canonical、四组 hreflang 和可解析 JSON-LD，并列出仅用于重定向/兼容而未收录的路由。

面试短答：动态详情路由不能只靠手写清单。我把已发布内容转为共享目录，预渲染和 sitemap 从同一份数据派生；只有具有独立内容和 SEO 的页面进入 sitemap，重定向和兼容页明确排除。真实模式只拉一次目录快照，避免两边版本漂移。
