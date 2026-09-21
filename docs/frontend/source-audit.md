# 源码审查清单（source-audit）

更新日期：2026-09-17。本文件是审查与 Mock 准备结果，**不是**逐页脱敏完成报告。  
凭据与原生产域名的具体值不在此复述；仅给文件依据与处理状态。

## 1. 统一演示品牌与业务映射

定义位置：`nuxt-content-platform-web/app/mock/brand.ts`

| 项 | 约定 |
| --- | --- |
| 品牌 | 讯览 / 訊覽 / ContentPulse |
| 定位 | 多语言资讯与数据展示平台（演示） |
| 本地站点 | `http://localhost:3666` |
| 占位域名 | `https://demo.contentpulse.local`（非真实服务） |
| 文章 ID | 固定 `101–105`，跨页一致 |
| 时钟 | `MOCK_CLOCK_ISO = 2026-09-17T12:00:00+08:00`，下一期 `2026-09-20` |

| 原业务 | 通用映射 | 备注 |
| --- | --- | --- |
| 数据发布结果 / 号码球 | 期次数据发布 / 数据项编号 | 保留 BallNumber 交互与字段兼容，文案逐页替换 |
| 历史数据发布 | 历史记录 | 统计模块 8 |
| 冷热分析 | 频次与分布 | 模块 9 |
| 号码遗漏 | 间隔指标 | 模块 10 |
| 进阶统计 | 组合与占比统计 | 模块 11 |
| AI 选号 / 心水 | 智能推荐组合 / 筛选工具 | pick + 首页推荐 |
| 教学 / 分析 / 故事 | 指南 / 分析 / 动态 | 路由 slug `education` / `analysis` / `story` 暂保留 |

---

## 2. 页面与路由

路径相对 `nuxt-content-platform-web`。

| 页面 | 起始文件 | 判定 | 建议 | 依据 |
| --- | --- | --- | --- | --- |
| 根入口 | `app/pages/index.vue` | 包装页，导入 Home | **保留**，与首页同一任务 | 仅 `import Home` |
| 首页 | `app/pages/home/index.vue` + `home/modules/*` | 业务页 | **已替换**文案/SEO/倒计时 Mock 时钟（2.2-1） | 调用 `getLatestResult` / `$fetch`；i18n `home.*` + `seo.home.*` |
| 资讯入口 | `app/pages/news/index.vue` + `news/modules/*` | 业务页 | **已替换** Tab/模块文案与入口 SEO（2.2-2）；分类页结构留给 2.2-3 | Tab + 模块请求 `/api/articles`；顺带改 `seo.news-*` 三分类标题 |
| 分类列表 | `app/pages/news/[category]/index.vue` | 业务页 | **已替换**（2.2-3）：非法分类回退、SEO origin、Tab 品牌色 | 有效分类 education/analysis/story |
| 类型列表 | `app/pages/news/[category]/type/[id].vue` | 业务页 | **已替换**（2.2-4）：type 1–3 白名单、统一 `news-*` SEO、非法回退 | 子类映射见 `constants/news-categories.ts`；遗留 teaching-* 等旧 SEO key 可后续清理 |
| 分类文章详情 | `app/pages/news/[category]/article/[id].vue` | 业务页 | **已替换**（2.2-5）：Mock 详情 + 讯览 SEO；列表进本路由 | canonical |
| 旧详情 | `app/pages/news/detail/[id].vue` | 兼容入口 | **已改为跳转**（2.2-6）：replace → 分类 article；不删除 | 预渲染保留 `/news/detail/101` 样例 |
| 统计容器 | `app/pages/statistics/index.vue` + `type/[id].vue` 外壳 | 容器 | **已替换**（2.2-7 / 2.2-12 复核） | 入口重定向；Tab/SEO/非法 type；modules 见下行 |
| 历史/冷热/图表/进阶 | `statistics/modules/*.vue` | 有价值数据展示 | **四模块已替换**（2.2-8～11） | 均 `buildApiUrl('/api/...')`；`legacy-group_*` 字段名保留，标签为 G01–G12 |
| 统计类型页 | `app/pages/statistics/type/[id].vue` | 业务页 | **已复核**（2.2-12）：复用脱敏模块；type 1–3；三语 SEO；非法回退 | Tab 标题 computed；面包屑带语言前缀 |
| 选择工具 | `app/pages/pick/index.vue` | 业务页 | **已替换**（2.2-13）：讯览 SEO/FAQ；Mock 推荐组合；重新生成保留 | `$fetch` `/api/legacy-analysision` |
| 404 | `app/pages/[...all].vue` | 兜底 | **已替换**（2.2-14）：真实 HTTP 404；讯览品牌；返回/首页带语言前缀 | 布局 `layouts/404.vue` |
| GA 调试 | `app/pages/ga-test.vue` | 调试页 | **已删除**（2.2-15）：无导航引用；含旧 Measurement ID | `/ga-test` 现走 404 兜底；`useGoogleAnalytics`/插件仍为 no-op |

`app/config/index.ts` 页脚白名单含不存在的 `profile` 路由 → **待核实**（可能历史遗留）。

---

## 3. 接口与请求入口

| 入口 | 文件 | 原行为 | 处理 |
| --- | --- | --- | --- |
| HTTP 客户端 | `app/api/http.ts` + `app/plugins/http.ts` | `apiBase` 指向生产 | **已改**：空 base + SSR origin，走本地 `/api` |
| API 封装 | `app/api/mark-six/index.ts` | 依赖 apiStore endpoints；`article-ids` 曾写死外网 | **已改**相对路径；由 Mock 提供 |
| 散文 | `app/api/prose.ts` | `/api/prose` | Mock 已覆盖 |
| 域名工具 | `app/utils/api-domain.ts` | 开发环境固定原生产域名 | **已改**：相对路径 / 当前 origin |
| 启动初始化 | `app/app.vue` | SSR+CSR 调 `getApiInfo` | 现打本地 Mock |
| 硬编码外网 | `home/modules/recommend-articles.vue`、`news/modules/{teaching,forecasting,news-story}.vue` | 绝对 URL 拉文章 | **已改**为 `/api/articles` |
| 页脚外链 | `app/components/AppFooter.vue` | 原注册页外链 | **已改**为站内 `/pick` |
| Store | `app/stores/{api,legacy-domain,prose}.ts` | 存数据发布/端点 | **保留结构**，数据来自 Mock |

Mock 实现：

- 适配入口：`app/mock/index.ts`
- 数据：`app/mock/data/catalog.ts`
- Nitro：`server/api/[...].ts` → 拦截全部 `/api/**`

---

## 4. 配置 / 品牌 / 统计

| 项 | 文件 | 建议 | 状态 |
| --- | --- | --- | --- |
| 默认站点 URL / 域名 | `nuxt.config.ts` `runtimeConfig.public` | **替换** | 已改为 localhost |
| Vite / Nitro 代理 | `nuxt.config.ts` | **删除/隔离** | 已关闭对原生产的 proxy |
| 默认 head 文案 | `nuxt.config.ts` `app.head` | **替换** | 已改为讯览演示；`robots=noindex` |
| GA 模块 / head 脚本 | `nuxt.config.ts` | **删除** | 已移除 `nuxt-gtag` 与 gtag 脚本 |
| GA 插件 | `app/plugins/google-analytics.client.ts` | **禁用** | no-op |
| GA composable | `app/composables/useGoogleAnalytics.ts` | **禁用上报** | no-op，保留 API 形状 |
| 常量品牌 | `app/constants/index.ts` | **替换** | 已改为讯览 |
| SEO 兜底域名 | `useCurrentDomain` / `useSeo` / `useSchema` | **替换** | 已改 localhost |
| SeoMeta 组件 | `components/SeoMeta.vue` | **替换** | **待逐页/收尾**：仍含原品牌文案 |
| i18n 文案 | `i18n/locales/*.json` | **替换** | **待逐页**：大量原业务文案 |
| 环境示例 | `.env.example` | **新增** | 已提供；`.env` 本地 Mock（勿提交） |
| 配置备份 | `nuxt.config.original.ts` | **待核实**后删除或移出仓库 | 仍含原域名/统计 |
| 业务 README | `MARK6_API_README.md`、GA 说明 md | **待核实**后归档/删除 | 含原 API 说明 |

---

## 5. 构建与生产脚本

| 脚本 | 风险 | 处理 |
| --- | --- | --- |
| `scripts/generate-prerender-routes.ts` | 曾 `fetch` 原站 article-ids 并改写 `nuxt.config.ts` | **已改**为本地 Mock ID，无外网请求 |
| `scripts/generate-sitemaps.ts` | 外网 baseUrl + 拉 ID | **已改** Mock；默认禁用，需 `ALLOW_SITEMAP_GENERATE=1` |
| `scripts/api-watcher.js` 及 service/sh | 轮询原 API 并触发构建 | **已隔离**（`ALLOW_LEGACY_DEPLOY=1` 才可跑） |
| `homepage-auto-build.js` / `homepage-cron.sh` | curl 原 API + 部署构建 | **已隔离** |
| `statistics-auto-build.js` / `statistics-nightly-build.sh` | 同上 + 硬编码生产路径 | **已隔离** |
| `auto-build-pnpm.js` | 大量 curl 生产与部署逻辑 | **已隔离** |
| `force-refresh-api.js` | curl 原 API | **已隔离** |
| `setup-baota.sh` | 配置宝塔生产目录 | **已隔离** |
| `clean-all.js` / `quick-cleanup.sh` | 清理产物 | **待核实**副作用后决定是否保留 |
| `package.json` `build` | 先跑 generate-prerender-routes | 现已离线安全；完整 `pnpm build` **本轮未跑** |

---

## 6. 数据与素材

| 项 | 文件 | 建议 |
| --- | --- | --- |
| `number-miss.json` | 根目录真实风格遗漏数据 | **待核实**：可作参考；运行时已用 Mock |
| `public/` logo、favicon | 可能含原品牌视觉 | **待逐页/收尾**替换为适合公开展示素材 |
| Pinia persist | 可能缓存旧 API 数据 | 本地验证时注意清 storage |

---

## 7. SSR / 预渲染

- `ssr: true`；`nitro.routeRules` 对 `/news`、`/statistics` 做 redirect。
- `nitro.prerender.routes` 仍可能含旧文章 ID（30–39）；下次执行 `generate-prerender-routes` 会写成 101–105。
- SSR 与浏览器均应请求本地数据源。**注意**：`mark-six` 在 Mock 模式下直连 `app/mock`（避免 SSR HTTP 自请求死循环）；页面 `$fetch('/api/...')` 仍可由 Nitro `server/api` 提供同一数据。

---

## 8. 本轮已做 / 未做

**已做（2.0）**

- 输出本审查清单与品牌映射
- 全局域名/代理/GA/外链请求隔离
- 最小 Mock 数据 + Nitro `/api` + `app/mock` 适配入口
- 硬编码文章请求改为本地
- 旧部署/监听脚本默认 exit
- `.env.example`；本地 `.env` 指向 Mock
- 安全启动相关验证（见 STATUS.md）

**未做（明确停止）**

- 不批量改各业务页 UI/i18n（留给 2.1/2.2）
- 不实现后端 / 数据库 / 管理端 / 发布
- 不推 Git（用户要求脱敏后再推）
- `ga-test.vue` 已删除（2.2-15）；双详情路由保留跳转；`nuxt.config.original.ts` / GA 说明 md 仍待 2.3 收尾核实

---

## 9. 下一任务建议

按 `AI_HANDOFF_PROMPTS.md` **2.2 第 10 项：图表模块**  
`app/pages/statistics/modules/chart-analysis.vue`  
替换标签和数据，保留交互；不自动连续处理进阶统计。

---

## 10. 2.2-1 首页完成摘要（2026-09-17）

- 替换 `home.*` / `seo.home.*` / `menu.home`（三语）为讯览 / ContentPulse 通用数据语义
- `home/index.vue`：去掉原电话与搜索 schema、调试日志、死倒计时代码；SEO `noindex`
- 倒计时使用 `MOCK_CLOCK_ISO`（Mock 开启时），避免 SSR/CSR 水合不一致
- 模块空态/失败态走 i18n；推荐更新时间用 Mock 时钟
- 验证：`GET /` 200；标题/描述含訊覽；页面无「旧业务品牌/数据发布/心水/旧品牌」；`/zh-CN` `/en-US` 200
- 未改资讯页及其它 2.2 项；布局 `site.name` 缺失警告、logo/素材仍待收尾

---

## 2026-09-18 14:58 — 2.3 全站脱敏收尾检查

本节是最新状态，前面的阶段记录为历史记录。

已完成本轮代码检查、脱敏收尾和阻断修复；未达到全部质量门禁通过。完整报告见 [FRONTEND_REVIEW.md](./FRONTEND_REVIEW.md)。

- 清理旧 SEO、公开 sitemap/robots、退役脚本；补环境忽略规则与前端 README。
- 修复 NewsMainTabs 类型语法、空值类型、首页类型递归、SSR window、SVG/IPX 预渲染 500、不存在文章页面 HTTP 200、虚构搜索/联系方式结构化数据。
- 工作目录 nuxt-content-platform-web：npm run typecheck 通过；npm run build 通过，75 条预渲染及 Nitro 服务构建完成。
- 最新产物在本地 4367 验证：check-demo.mjs 的 43 项场景通过（含 15 次列表/详情一致性）；额外三语不存在文章 404 及全局结构化数据检查通过。
- ESLint：383 errors、4 warnings，未通过。包含 CookieConsent 控制字符乱码与格式问题；未全仓自动格式化。
- 未验证：真实浏览器网络请求、点击/滚动/水合、移动端视觉、Docker、远程部署、秘密全量审计及图片 OCR。HTTP 验证不代表上述验证通过。
- Git 跳过；原项目与后端未改；不自动进入第 3 阶段。
- 下一步建议：按报告 P1 修复 Cookie 组件与 lint，补三语移动端浏览器回归及 Mock 统计/分页边界，再考虑后端。

## 2026-09-18 15:15 — P1 CookieConsent 简化完成

- 用户本轮范围：仅处理 CookieConsent，不扩展到其他 P1。
- 删除 app/components/CookieConsent.vue，移除 app/app.vue 的挂载。当前无统计/营销服务，不需要保留其虚假开关、默认同意和 gtag consent 调用。
- 不再读取旧 cookie-consent，损坏 JSON 不会由该组件触发异常；不清空 localStorage，保留语言、主题与返回状态。其他组件的存储容错不在本次范围。
- 工作目录 nuxt-content-platform-web：npm run typecheck 通过；eslint 全量仍失败，285 errors、4 warnings，较上次减少 98 errors，vue/no-parsing-error 为 0。
- app/i18n 检索 CookieConsent、cookie-consent、privacy.cookies 及 gtag consent 无残余引用；rg 无匹配 exit 1 属正常检查结果。
- 本次未运行生产构建、浏览器或移动端回归；未将之前构建结果作为本轮验证结果。未改原项目、后端及 Git。
- 已更新 FRONTEND_REVIEW.md 与前端 README。下一步可由用户安排剩余 lint 或浏览器回归，不自动执行。

## 2026-09-18 15:33 — ESLint 规则优化与修复完成

- 用户授权：合理优化规则，不影响功能逻辑。
- eslint.config.ts 取消导入/导出排序、UnoCSS 排序、顶层函数写法强制、外部 Markdown/JSON 格式化；保留语法、Vue 正确性、未使用项与基本格式检查。属性引号采用 as-needed。
- 仅运行 eslint --fix --fix-type layout 自动修复格式，没有自动删除导入或改写业务；JsonLd 增加隐藏占位元素解决空模板，检查脚本显式导入 process。
- 修复路由生成器尾逗号，重新生成 75 条相同路由后 lint 保持通过。
- 工作目录 nuxt-content-platform-web：npm run lint 通过，0 错误/警告；npm run typecheck 通过；npm run build 通过，75 条预渲染与 Nitro 产物完成；生产服务 4368 上 check-demo.mjs 的 43 项回归通过（含 15 次列表/详情一致性）。
- 构建警告：Windows sharp 二进制缺失、DEP0155 依赖弃用；未扩展依赖升级或宣称位图 IPX 已验证。浏览器交互、视觉和网络抓包仍未验证。
- 文档：新增 LINT_POLICY.md，更新 README 与 FRONTEND_REVIEW.md。日志 lint-check.log、build-review.log、typecheck-review.log 不提交；lint-review.log 是历史修复前的明细，以最新命令结果为准。
- 未操作原项目、后端或 Git。下一步可由用户安排剩余 P1：移动端浏览器回归、Mock 统计语义及分页边界。

## 2026-09-18 — 剩余三个 P1 完成

本节是最新状态；较早验证记录保留为历史。

- 范围：三语浏览器回归、Mock 统计筛选语义、分页边界。未改原项目或后端，未操作 Git、部署或原公司服务。
- Mock：新增 app/mock/parameters.ts、statistics.ts；index.ts 共用验证与计算；catalog.ts 补足 120 条确定性演示历史，删除旧固定统计常量。默认/上限/400/空页和间隔统计口径见 MOCK_DATA_CONTRACT.md。
- 页面：historical-records 期次选项来自实际 Mock；cold-hot-number、advanced-statistics 与 chart-analysis 去除重复刷新、修正筛选显示及图表末组/66+ 边界。
- 多语言：app/plugins/i18n.ts 尊重路由语言并同步 Vant；app.vue 避免无效面包屑翻译；首页推荐、资讯模块、pick 数据键按 locale 隔离，避免预渲染串语言；mark-six API 保留英文参数；ArticleCard 分类跳转保留语言；useArticleNavigation 每次更新详情返回来源，避免旧首页来源覆盖列表来源。
- 新增 scripts/check-mock.ts、check-browser.mjs、check-interactions.mjs。浏览器只读取现有 Playwright 安装，没有修改其所在项目或新增锁文件依赖。
- 验证目录 nuxt-content-platform-web：npm run lint（0 错误/警告）、npm run typecheck、npm run build 通过；最终构建日志 build-p1-final2.log（忽略文件）。75 条预渲染与 Nitro 产物完成。
- 本地生产服务 4373：check-demo.mjs 43 项通过；check-mock.ts 的五窗口统计不变量、90 个非法分页参数和合法边界通过；另在 4372 验证 14 个 HTTP 非法分页请求均为 400（之后只修复详情导航）。
- 浏览器：三语、375/390/1280 宽度、72 页面与 9 组筛选图表检查；额外三语 9 组连续交互（含分类 Tab、详情返回、历史分页、滚动恢复、主题、倒计时、失败/空列表恢复）。结果及截图现存 docs/frontend/browser-review；图表截图等待动画结束。中途测试发现串语言与详情返回错误，修复后重新构建复验。
- 更新 FRONTEND_REVIEW.md、MOCK_DATA_CONTRACT.md、前端 README。测试脚本仅允许本地目标；截图不代表实体设备验收。
- 未验证/限制：实体手机与 Safari、任意位图 IPX、Docker/远程部署、完整秘密审计/图片 OCR、服务器出站流量。构建仍有 sharp Windows 二进制缺失、DEP0155；npm 有 pnpm 配置项提示，不影响本次命令通过。
- 下一步：由用户选择 P2；建议先路由与 sitemap 共用目录、构建不改写 nuxt.config.ts，再 SEO 响应更新和 API 入口统一。暂不自动开始后端。

## 2026-09-18 — P2 共享路由目录与 sitemap 整理完成

本节为最新状态。用户授权处理路由与 sitemap 共用目录，并整理相关代码质量。

- 新增 scripts/content-directory.ts：读取现有 MOCK_ARTICLES 的已发布文章，校验 ID/重复/分类/日期并生成三语目录。保留 75 条预渲染路由；39 条规范页面进入 sitemap，排除重定向和资讯筛选子路由。
- 新增 scripts/sitemap-content.ts：纯 XML 生成、地址约束、XML 转义及重复路径拒绝。lastmod 来自文章发布日期，固定页不伪造更新时间。当前没有 updated_at，后端阶段再接入。
- 重写 generate-sitemaps.ts、generate-prerender-routes.ts：去掉重复 ID/分类清单，后者只读输出；nuxt.config.ts 直接读取目录，不再被构建改写。package.json 的各构建/生成入口先生成 sitemap。
- 本地生成不再要求 ALLOW_SITEMAP_GENERATE，也不接受 ALLOW_LEGACY_DEPLOY 绕过；清理 .env.example 过时开关。原部署脚本仍退役，robots/noindex 保持不变。站点地址通过命令进程环境传入，脚本不自动读取 .env；后续部署需统一构建/运行地址。
- 新增 check-content-directory.ts：新增文章自动同步三语、草稿排除、重复 ID、非法分类/日期/站点 URL、XML 转义与确定性检查均通过。
- 工作目录 nuxt-content-platform-web：npm run lint、npm run typecheck、npm run build 通过；构建前后 nuxt.config.ts 哈希一致；重复生成 public/sitemap.xml 字节一致。build-p2.log、typecheck-p2.log 为忽略的本地日志。
- PowerShell XML 解析通过（39 个唯一 URL）；本地生产服务 4374 上 39 个 sitemap 地址均返回 200，服务提供的 sitemap 同样含 39 项；check-demo.mjs 的 43 项回归通过。
- 文档更新：ROUTES_AND_SITEMAP.md（架构、复现、面试短答与真实接口快照边界）、FRONTEND_REVIEW.md、docs/README.md、前端 README。
- 限制：未接真实接口、未实现发布触发构建，未新增 sitemap hreflang；本轮无页面交互改动，未重复浏览器视觉测试。sharp/DEP0155/npm 配置警告仍存在。未操作原公司项目、后端、Git 或远程部署。
- 下一步：用户可选择 P2 SEO 随路由/语言响应更新，或 API 入口统一；不自动启动后端。

## 2026-09-18 — P2 SEO 路由/语言响应更新完成

本节为最新状态。本轮只处理 SEO 响应更新，未推进 API 重构或后端。

- useSeo.ts 接受 getter/ref/普通配置并返回 computed head；canonical、三语 alternate 与 x-default、标题/description/keywords、OG/Twitter、html.lang 和 JSON-LD 响应更新。保留 noindex/nofollow。
- app.vue 显式 useHead 注册全局默认 SEO 与 WebSite，移除按每个 URL 片段生造的面包屑。此前只调用 useSeo 而未注册其结果。
- 首页、资讯父分类/子分类改为响应式调用；保留首页主题色变化；分类面包屑链接保留语言。useCurrentDomain.ts 统一使用 siteUrl，消除 SSR/客户端地址来源差异。
- useSchema.ts、JsonLd.vue 改为 getter 注册；新增 serializeJsonLd.ts 安全序列化，文章/统计/工具页同步使用。文章 schema 使用稳定 key、封面绝对 URL；离开详情后旧 Article schema 清除。
- 验证目录 nuxt-content-platform-web：npm run lint（0 错误/警告）、npm run typecheck、npm run build 通过，75 条预渲染完成。最终构建日志 build-seo-final2.log、类型日志 typecheck-seo.log 为忽略的本地文件。
- 本地生产服务 4377：scripts/check-seo.mjs 28 次同 document 客户端切换（包括实际语言选择器）通过，覆盖标题、description、唯一 canonical、四条 alternate、OG URL/locale、html.lang、robots、schema 更新/清除；6 个禁用 JS 的 SSR 页面通过。无运行/水合/缺失翻译错误。报告现存 docs/frontend/browser-review/seo-report.json。
- check-demo.mjs 原有 43 项生产路由/API 回归通过。临时测试服务结束后停止。
- 新增 SEO_REACTIVITY.md（设计、命令、限制、文字面试短答）；更新 FRONTEND_REVIEW.md、docs/README.md 及前端 README。
- 限制：未做实体设备、搜索引擎抓取/富媒体验证，JsonLd 组件本身暂无实际页面引用，未宣称独立挂载验收；真实内容缺失译文时需按可用语言生成 alternate。当前仍禁止收录。
- 构建警告：sharp Windows 二进制缺失、DEP0155、Nitro cache-driver external 提示；构建与本轮生产页面请求均成功，没有扩展依赖升级范围。npm 的 pnpm 配置项警告仍存在。
- 未改原项目或后端、未操作 Git/远程部署。下一步可由用户选择 P2 API 数据入口统一与 SSR 实例隔离。

## 2026-09-18 — P2 API 入口统一、SSR 实例隔离与关联清理完成

本节为最新状态。范围为 API 统一及有引用证据的关联清理，不包含所有图片/依赖审计。

- 新增 app/api/client.ts、plugins/content-api.ts、composables/useContentApi.ts。插件为每个 Nuxt 应用创建独立 transport/client；页面在 setup 捕获实例，统一请求本地 Nitro，SSR 不再直读 Mock，也不通过网络请求自己的服务端口。
- 统一 GET 路径白名单、params 传参、10 秒超时和无自动重试；拒绝外部 URL，保留原错误对象。没有模块级可变客户端/错误回调，没有隐式读取 localStorage token 或复制 SSR 来访认证头。
- 迁移全部页面请求：首页、推荐/历史、资讯列表/详情/旧跳转、统计模块和工具页。首页历史/推荐移除多层重试与重复兜底；非法文章 ID 在页面校验并保留 404。
- 删除 7 个无剩余消费者的旧文件：api/http.ts、api/mark-six/index.ts、api/prose.ts、plugins/http.ts、stores/api.ts、stores/prose.ts、utils/api-domain.ts。移除 app.vue 重复初始化、首页 API Store 等待逻辑、无引用 apiBase 配置及环境示例。原 Nitro 接口保留兼容。
- 检查其余状态：Pinia state 工厂及新闻/统计 useState 已按实例创建，未机械重写。当前 USE_MOCK 仅被演示时钟使用，所有业务 API 始终走本地 Mock，不声称已支持真实后端切换。
- npm run lint、npm run typecheck、npm run build 通过；75 条预渲染完成。最终日志 build-api-final.log、typecheck-api-final.log 忽略提交；sharp/DEP0155 等既有构建提示保留，未扩展依赖升级。
- check-api-client.ts：40 个并发调用，两个 transport 隔离、参数不被修改、原错误保留、非法路径不发请求，均通过。
- 最终生产服务 4379：check-ssr-isolation.mjs 的 24 个非预渲染 SSR 并发请求通过，三语非法/不存在文章共 6 项均为 404；check-demo.mjs 的 43 项通过。
- 4378 的有效页面回归：72 页面/9 组图表筛选、三语 9 组连续交互、28 次 SEO 切换/6 个 SSR 页面通过；0 浏览器运行/水合错误及外部请求。之后唯一业务改动为非法文章 ID 校验，已在最终产物补测。Mock 统计与 90 个非法分页场景也通过。
- 交互脚本曾在 SSR HTML 已显示而 Vue 未挂载时点击筛选框超时；补等待应用挂载后复验成功，没有用放宽业务断言掩盖失败。
- 文档：新增 API_CLIENT.md（架构、清理证据、复现与面试短答），更新 FRONTEND_REVIEW.md、docs/README.md 和前端 README。测试报告更新在 browser-review。
- 限制：公开 Mock 测试不等于真实认证/租户权限隔离验收，未接远端后端、未验证实体设备。原项目/后端/Git/远程部署均未操作。
- 下一步可按用户安排审查无引用组件、图片及无效依赖，或开始真实后端契约设计；不自动扩展。

## 2026-09-18 — 剩余三个 P2 清理与部署形态完成

本节为最新状态。三个 P2 的代码/配置/说明已落实；Docker 实测明确未完成，不能把它写成已验证容器部署。

- 无效组件/图片：检索自动组件标签、import、资源字符串后，人工查看并删除 NowPlay.vue、public/images/playnow.png、public/icon-16x16.png。未按文件名批量删除其余图片，也未声称全量图片 OCR。
- 统计清理：首页唯一 GA 调用本来是 no-op；删除该调用、useGoogleAnalytics.ts、google-analytics.client.ts 和 types/gtag.d.ts。无第三方统计加载。
- 命名：新增 api/models.ts 转换 next_draw_* / next_target 与 legacy_group_distribution，页面改用 nextRelease/target/group_distribution；useLegacyStore 改为 useDatasetStore，删除无消费者 latestResult 状态及乱码注释；高级统计内部与翻译 key 改为 group，底栏改为体验工具/Try Tools，仍跳转本地 pick。
- 兼容边界：现有 API draw_*、category_slug 等仍保留契约含义，不做破坏性全局替换。转换层是通用模型入口，不能宣称所有旧字段名已消失。
- 依赖：删除 nuxt-gtag、sitemap、node-fetch 三个无使用的直接依赖并同步锁文件。发现全局 pnpm 版本与项目不同，改用 corepack pnpm 10.11.0；解析时 Vue 曾升到 3.5.21，随后显式固定回原版本 3.5.16。最终 frozen-lockfile + offline + ignore-scripts 安装通过，无需下载；生产构建另行运行，未靠跳过脚本冒充构建验证。
- 部署：统一 build/start，删除两个重复 build 别名及纯静态 generate 命令。Dockerfile 改为 Node 24 双阶段、固定 pnpm、非 root、生产环境/端口/健康检查及 SITE_URL；.dockerignore 排除环境文件、缓存和日志。具体步骤见 DEPLOYMENT.md。未安装 Docker，本机无 CLI/daemon，镜像构建与运行未验证。
- Windows 直接 Copy-Item 跟随 Nitro 循环 junction 失败，已停止并清理临时副本；新增 scripts/stage-runtime.mjs 保留并重建 54 个内部链接，拒绝链接到产物之外。仓库外临时目录仅凭完整产物成功运行 Node 服务 4380，不依赖源码目录。验收后停止并删除临时副本。
- 验证：npm run lint、npm run typecheck、npm run build 通过（75 条预渲染）。日志 typecheck-cleanup.log、build-cleanup.log 忽略提交；保留 sharp Windows、DEP0155/DEP0169 等依赖提示，未验证任意位图 IPX。
- 独立产物服务上：43 项路由/API、24 个并发 SSR、6 个非法/不存在文章 404 通过；72 页面/9 组图表筛选和三语 9 组连续交互通过；28 次 SEO 切换及 6 个禁用 JS 的 SSR 页面通过。控制台运行/水合与浏览器外部请求记录为空。另有统计五窗口/90 个分页异常、40 个客户端并发及内容目录测试通过。
- 人工复看英文高级统计截图：G01～G12 分组、统计图与底栏新文案正常；截图与 JSON 报告更新在 browser-review。
- 文档新增 P2_CLEANUP.md、DEPLOYMENT.md；更新 FRONTEND_REVIEW.md、ROUTES_AND_SITEMAP.md、文档导航及前端 README。
- 原清单前端 P1/P2 实现完成；未验证 Docker、实体设备、真实服务器部署或全量素材 OCR。未修改原公司项目、后端或 Git，未执行公网发布。
- 下一步：按用户安排进入后端接口/数据模型设计；容器验收须在具备 Docker 的环境补做。不自动启动数据库或新增服务。

## 2026-09-18 — 底栏重复入口与固定示例文案修正

- 按用户确认方案删除底栏“体验工具”重复入口及事件/样式；保留首页、数据、组合工具、资讯四项。/pick 路由不变。
- 同步简/繁/英 tabbar 与页面标题；按钮改为刷新示例/重新整理範例/Refresh example，事件名改为 refreshExample。删除无引用 try_tools 翻译键，更新英文 FAQ 对应文案。
- ESLint、typecheck 通过。开发服务本地 3000（三语）浏览器验证四项底栏、点击导航、单项高亮、页面标题及按钮请求 200，刷新前后固定 Mock 内容相同；截图 browser-review/navigation-four-tabs.png。
- 首次自动点击碰到开发页面水合/热更新时序，等待 isHydrating=false 后三语复验均通过。未扩大修改业务逻辑。
- 本轮未重新构建生产产物；.output 仍是此前版本，部署前需 pnpm build。未操作 Git 或部署。
