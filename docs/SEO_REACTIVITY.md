# SEO 随路由与语言更新

2026-09-18。范围为前端 Mock 的 SEO 响应更新，未开启搜索收录或接入后端。

## 修改与使用方式

- `useSeo` 接受普通配置、ref/computed 或 getter，返回 computed head。调用方使用 `useHead(useSeo(() => ({ ... })))`；动态参数不能先取 `.value` 再放进普通对象。
- canonical 从当前 `route.path` 派生，不包含查询串和片段。默认繁体不带前缀，简体与英文分别带 `/zh-CN`、`/en-US`；alternate 提供三个语言版本及指向默认语言的 x-default。
- `html.lang`、language meta、OG locale 跟随 locale；标题、description、keywords、OG/Twitter 字段和 JSON-LD 由同一响应式配置生成。保留 noindex/nofollow。
- `useCurrentDomain` 统一使用 runtimeConfig.public.siteUrl，不再让部分页面使用 domain、部分使用浏览器 origin。SSR 和浏览器使用同一地址。部署时仍须统一构建/运行环境变量。
- 全局 app 显式注册默认 head 与 WebSite schema；原先 useSeo 只返回对象，全局调用却没有交给 useHead。删除按 URL 每一段拼凑的伪面包屑，分类页继续提供有语义的 BreadcrumbList。
- 首页与资讯分类/子分类改为响应式配置，首页保留主题色随主题变化。分类面包屑的首页/父分类地址保留语言前缀。
- 文章、统计和工具页原有 computed/getter 保留；文章封面生成绝对 URL，文章 JSON-LD 使用稳定 key，离开详情后会清除。没有把文章发布时间冒充新的实时更新时间。
- `JsonLd.vue` 的 props 与 `useSchema` 的 getter/ref 改为响应式注册；`serializeJsonLd` 转义 HTML 分隔符，避免正文中的 `</script>` 破坏 script 标签。组件自身无活跃页面引用，因此未声称完成该独立组件的浏览器挂载测试。

## 验证

工作目录 `nuxt-content-platform-web`：lint、typecheck、生产构建及 check-demo.mjs 的 43 项回归通过。新增 `scripts/check-seo.mjs`，使用已有 Playwright 与 Edge，不增加依赖：

```powershell
$env:HOST = '127.0.0.1'
$env:PORT = '4377'
node .output/server/index.mjs
# 另一个终端
$env:DEMO_CHECK_URL = 'http://127.0.0.1:4377'
$env:PLAYWRIGHT_MODULE = 'E:/project/tenantadmin/node_modules/playwright'
node scripts/check-seo.mjs
```

脚本默认期望 SEO 域名为 http://localhost:3666；使用其他构建域名时，设置 SEO_SITE_URL。仅允许本地测试服务。Playwright 路径需按实际安装位置调整。

- 三语各 9 条客户端页面切换，包括首页、两个分类、子分类、两篇文章、两个统计模块和工具页。
- 使用实际语言选择器从英文切到简体，合计 28 次检查。浏览器内标记确认同一个 document 未刷新。
- 验证标题、唯一 canonical、四条 alternate、OG URL/locale、html.lang、robots、当前页面 schema URL、文章标题及离开后的清除。
- 六个禁用 JavaScript 的页面验证 SSR canonical、语言和 alternate；记录运行/水合/翻译错误。
- 报告：[browser-review/seo-report.json](./browser-review/seo-report.json)。没有做实体手机、搜索引擎抓取或富媒体结果测试；SVG 默认分享图不代表社交平台预览已验收。

## 后续边界与面试短答

当前三语 Mock 内容齐全，因此每页输出对应的三语 alternate。真实后端接入后，要根据已发布内容的语言可用性生成语言链接，不能指向缺失译文。sitemap hreflang 扩展、错误页面更细的收录策略不在本轮扩大实现。

面试短答：SPA 切页不刷新 document，仅在 setup 取一次 SEO 值会残留旧内容。我让路由、语言和文章数据成为 head 的响应式依赖，并同时验证服务端输出与客户端连续导航，检查离开文章后旧 schema 是否清除。
