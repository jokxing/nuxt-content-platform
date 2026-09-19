# 路由与 sitemap 共用内容目录

更新：2026-09-18。本阶段仅使用本地 Mock，不调用远程接口。

## 数据流与文件导览

`app/mock/data/catalog.ts` 的文章 → `scripts/content-directory.ts` → Nuxt 预渲染路由 / sitemap。

- `createContentDirectory` 是纯函数：固定页面加上已发布文章，再展开三语。动态文章的 ID、分类和发布日期直接来自文章数据，不维护另一份 ID 表。
- `nuxt.config.ts` 直接调用目录函数，保留 75 条预渲染路由；`generate-routes` 仅打印目录，不再正则改写源码。
- `scripts/sitemap-content.ts` 负责站点地址校验、去重检查和 XML 转义；`generate-sitemaps.ts` 只负责读取环境变量与写文件，输出位置相对脚本确定，不依赖终端所在目录。
- build 先生成 sitemap，失败则中止构建；单独更新使用 `pnpm update-sitemaps`。后续部署整理已移除重复 build 别名与纯静态 generate 命令，统一使用 build/start（见 DEPLOYMENT.md）。

## 收录策略

目录标记决定哪些路径进入 sitemap，而不是将所有可访问路径一股脑收录。当前共 39 个 URL：三语首页、三个统计模块、组合工具、三个资讯父分类和五篇文章。资讯 type 子路由属于筛选展示，可能为空或与父分类重复；重定向入口与旧详情入口也不进入 sitemap，但保留预渲染兼容。

三语都有独立 URL。尚未添加 sitemap hreflang 扩展；页面已有的 hreflang/SEO 响应更新另属 P2，不因生成多语言 sitemap 就宣称已完成。

文章 lastmod 使用当前内容提供的发布日期（精确到日）；没有更新时间的固定页省略 lastmod，不用构建当天冒充内容更新时间。后端接入后应优先提供可靠的 updated_at。Mock 三种语言目前均完整；后续应按文章实际可用语言展开。

NUXT_PUBLIC_SITE_URL 必须是 HTTP(S) 站点根地址，可有末尾斜杠，不允许账号密码、子路径、查询串或片段。默认 `http://localhost:3666`，与当前本地演示配置一致。执行脚本时通过进程环境传入该变量；脚本不会自行读取 .env。构建与运行部署应使用同一站点地址。

删除旧 ALLOW_LEGACY_DEPLOY / ALLOW_SITEMAP_GENERATE 生成门槛：本命令只有本地文件生成，不发布、不联网。robots 的 Disallow 与页面 noindex 保持不变，sitemap 只是演示产物，当前不能宣称允许搜索收录。

## 后端接入时的边界

真实接口完成后，在构建开始时获取一次已发布内容快照（处理接口分页），校验 ID、分类、时间及语言。预渲染与 sitemap 必须读取同一份快照，不能各自独立请求而产生版本差异。接口失败应中止构建，避免发布不完整目录。本轮没有提前实现接口请求、定时部署或发布触发器。

## 验证与文字面试说明

`pnpm exec tsx scripts/check-content-directory.ts` 验证新增文章自动扩展三语路由与 sitemap、草稿排除、重复 ID/非法分类/非法日期拒绝、站点地址约束、XML 转义和确定性输出。另用 XML 解析器检查生成产物，生产构建前后比较 nuxt.config.ts 哈希，并验证 sitemap 各 URL 的 HTTP 返回。

面试短答：动态详情路由不能只靠手写清单。我把已发布内容转为共享目录，预渲染和 sitemap 从同一份数据派生；两者用途不同，所以用明确标记排除重定向和筛选页。构建不再修改配置源码，内容没变时生成结果也不会因日期而变化。
