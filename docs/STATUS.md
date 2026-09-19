# 当前状态与交接记录

最后更新：2026-09-17（完成 2.0 全局审查与 Mock 准备）

## 当前阶段

**2.0 已完成**：源码审查、演示品牌约定、全局外部请求隔离、本地 Mock 适配。  
**未开始**：逐页脱敏（下一任务为首页）。后端 / 数据库 / 管理端 / 发布流程仍暂缓。  
**Git**：按用户要求本轮跳过；脱敏完成后再初始化/推送 `nuxt-content-platform`。

## 本次已核实 / 验证

工作目录：`nuxt-content-platform-web`（除非注明）。

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 依赖安装 | `CI=true pnpm install --force` | 成功；`nuxt prepare` 通过 |
| 旧脚本隔离 | `node scripts/api-watcher.js` / `homepage-auto-build.js` | exit 1，提示 DISABLED |
| Mock API | `curl http://localhost:3666/api/`、`/api/latest`、`/api/articles`、`/api/article-ids` | 返回 ContentPulse Mock 固定数据；文章 ID `101–105` |
| 安全启动 | `pnpm dev` → `curl http://localhost:3666/` | HTTP 200；SSR payload 含 Mock 数据；未见 gtag / 原生产域名请求入口 |
| SSR 自请求 | 曾因 ofetch 绝对 URL 死循环 | 已改为 mark-six 直连 `app/mock` |

未验证：完整 `pnpm build`、全路由浏览器回归、typecheck/lint 全量、生产部署。

## 本次修改（摘要）

**文档**

- 新增 `docs/frontend/source-audit.md`（文档归类后的当前位置）
- 更新 `docs/README.md`、`docs/STATUS.md`（本文件）

**Mock**

- `app/mock/brand.ts`、`app/mock/data/catalog.ts`、`app/mock/index.ts`
- `server/api/index.get.ts`、`server/api/[...].ts`
- `app/api/mark-six/index.ts`、`app/api/prose.ts`、`app/api/http.ts`（Mock 直连，避免 SSR 环）

**全局隔离**

- `nuxt.config.ts`：去掉 nuxt-gtag / 生产 proxy / 默认原域名；演示 head
- `app/utils/api-domain.ts`、域名兜底 composables、`.env` / `.env.example`
- GA 插件与 composable no-op；页脚外链改站内
- 硬编码文章 URL 改为 `/api/articles`
- 生产监听/构建脚本默认 `ALLOW_LEGACY_DEPLOY` 门禁
- `scripts/generate-prerender-routes.ts`、`generate-sitemaps.ts` 离线 Mock

## 设计决定

- 演示品牌：**讯览 / ContentPulse**（见 `app/mock/brand.ts`）
- 接口字段名暂保持兼容，语义映射为通用资讯+数据展示；文案在逐页任务替换
- Mock 默认开启（`NUXT_PUBLIC_USE_MOCK` 非 `false`）；适配入口统一在 `app/mock`
- 旧部署脚本保留但默认禁用，不物理删除（待引用核实）

## 遗留 / 限制

- i18n 大量原业务文案、页面 UI、双详情路由、`ga-test.vue`、`nuxt.config.original.ts`、旧 README 待逐页/收尾
- `nitro.prerender.routes` 可能仍含旧文章 ID，直到再跑 generate 脚本
- 首页等页面文案尚未脱敏，仅数据与请求已走 Mock
- 父目录 `E:/project` 有 `.git`；本仓库未单独初始化（本轮跳过）

## 下一步

执行 **2.1 + 2.2 第 1 项：首页**  
`app/pages/index.vue`、`app/pages/home/index.vue` 及 `home/modules/*`  
完成后停止，不自动连续改资讯页。

```text
日期：2026-09-17
阶段及目标：2.0 全局审查与 Mock 准备
修改文件与原因：见上文摘要；阻断原生产请求并建立可复现 Mock
执行的验证命令、工作目录、结果：见「本次已核实 / 验证」
未验证内容及原因：未跑全量 build/typecheck；非本阶段范围
当前阻碍/已知问题：i18n/页面文案仍含原业务；ga-test 仍含旧 Measurement ID 字面量（调试页，待 2.2-15）
新增设计决策：讯览 ContentPulse + mock 直连适配器
Git 状态：按用户要求跳过
下一步最小可执行任务：首页逐页脱敏（2.2-1）
```

---

## 追加记录约定

后续更新**不改动上方既有正文**，只在文末追加新节，标题含日期与时间（本地时区，格式 `YYYY-MM-DD HH:mm`）。

---

## 2026-09-17 15:20 — 2.2-1 首页脱敏

**阶段**：2.2-1 已完成；下一任务为 2.2-2 资讯入口。后端等仍暂缓；Git 仍跳过。

**验证**（工作目录 `nuxt-content-platform-web`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 首页 SSR | `curl http://localhost:3666/` | HTTP 200；`<title>`/`description` 为訊覽演示文案 |
| 旧业务残留 | 首页 HTML 字符串计数 | `六合彩`/`开奖`/`心水`/`Mark Six`/`852 5236` = 0；含 `訊覽`/`ContentPulse`/`最新期次`/`2026090` |
| 多语言入口 | `curl /zh-CN`、`/en-US` | HTTP 200（未逐字核对英文 DOM） |
| Mock API | `/api/latest` | 固定 Mock，含 `_mock_clock` |
| Dev server | 既有 `pnpm dev` :3666 | HMR 正常；无新增阻断错误 |

未验证：完整 `pnpm build`、浏览器倒计时肉眼回归、移动端截图、typecheck/lint 全量。

**修改摘要**

- `app/pages/index.vue`、`app/pages/home/index.vue`
- `app/pages/home/modules/{latest-result,next-draw-countdown,recommend-numbers,history-draws,recommend-articles}.vue`
- `app/utils/timezone.ts`：`calculateTimeDifference` 支持 Mock `nowMs`
- i18n：`zh-CN` / `zh-HK` / `en-US` 的 `home.*`、`seo.home.*`、`menu.home`（及本页必要的 `menu.pick` 品牌向命名）
- Mock 推荐说明微调：`app/mock/data/catalog.ts`
- 文档：`docs/frontend/source-audit.md`；本文件仅追加本节

**设计决定**

- 首页语义：期次数据 / 下期发布倒计时 / 智能推荐组合 / 历史记录 / 精选文章
- Mock 开启时倒计时以 `MOCK_CLOCK_ISO` 为基准并客户端每秒推进，保证首屏与 SSR 一致
- 金额改为普通数字格式（不再强制 HKD 货币样式）；BallNumber 交互保留
- Schema 去掉真实电话与 SearchAction；publisher 地区改为广州/Guangzhou

**遗留**

- 其它页面 i18n、资讯模块、统计页仍含原业务文案
- `site.name` / `site.description` 缺失警告（布局层）
- `public/` logo、双详情路由、`ga-test.vue` 等仍待后续任务
- 推荐文章「查看更多」链到 `/news/education`（目标页尚未脱敏）

**下一步**：2.2-2 资讯入口 `app/pages/news/index.vue` 及 `news/modules/*`；完成后停止。

```text
日期时间：2026-09-17 15:20
阶段及目标：2.2-1 首页脱敏
修改文件与原因：见本节；替换首页品牌/业务文案与可控 Mock 时钟
执行的验证命令、工作目录、结果：见本节「验证」
未验证内容及原因：未跑全量 build/typecheck；非本阶段范围
当前阻碍/已知问题：布局 site.* i18n 缺失；资讯页未脱敏
新增设计决策：首页倒计时绑定 MOCK_CLOCK_ISO
Git 状态：按用户要求跳过
下一步最小可执行任务：资讯入口脱敏（2.2-2）
```

---

## 2026-09-17 15:54 — 号码球视觉脱敏 + Favicon

**背景**：3D 彩球易联想博彩，不利于大陆求职展示。

**修改**

- `app/components/BallNumber.vue`：改为扁平数据标签（左侧色条 + 分档青/靛/石板；`is-special` 紫色强调），不再加载 `/lottery/marksix-*.svg`
- 首页 `latest-result` / `history-draws`：分隔符 `+` → `/`
- `public/favicon.svg` 新增；`public/favicon.ico` 换成 ContentPulse 波形标
- `nuxt.config.ts`：优先挂载 SVG favicon

**未做**：未物理删除 `public/lottery/`（49 个 marksix SVG，已无引用，收尾时可删）；`logo.png` 等品牌图仍待替换。

**搜素材关键词（若另换）**：`data chip badge flat UI`、`metric tag rounded square`、`dashboard number pill`、`analytics favicon pulse waveform teal`、`squircle status indicator SVG`；避免 `lottery ball` / `bingo` / `keno`。

**下一步**：仍为 2.2-2 资讯入口（用户指定时再做）。

```text
日期时间：2026-09-17 15:54
阶段及目标：首页视觉去彩票化（BallNumber + favicon）
验证：依赖 HMR；建议硬刷新后看首页编号标签与标签页图标
Git 状态：跳过
```

---

## 2026-09-17 16:09 — 品牌 Logo 脱敏（替换 logo1 彩球图）

**背景**：`logo1.jpg` 含彩球「6」与「六合彩開獎網」文案。

**修改**

- 新增 `public/logo.svg`（青绿波形标 + 訊覽 / ContentPulse）
- 覆盖生成：`logo1.jpg`、`logo.jpg`、`logo.png`；另增 `logo-og.png`（480×320，OG 可用）
- Mock 封面与默认封面路径改为 `/logo.svg`：`catalog.ts`、`common.ts`、`ArticleCard.vue`、news 模块 fallback

**搜素材关键词（若另换）**：`saas logo waveform teal`、`content platform wordmark flat`、`data pulse icon rounded square`、`mint green brand card 3:2`；避开 `lottery` / `bingo` / `mark six` / `号码球`。

```text
日期时间：2026-09-17 16:09
阶段及目标：替换敏感 logo1 品牌图
验证：打开 /logo1.jpg、/logo.svg 应见訊覽波形标，无彩球与原站名
Git 状态：跳过
```

---

## 2026-09-17 16:54 — 2.2-2 资讯入口脱敏

**阶段**：2.2-2 已完成；下一任务为 2.2-3 分类列表。后端等仍暂缓；Git 仍跳过。

**验证**（dev 实际端口本次为 `3002`，因 3666 被占用）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 入口跳转 | `GET /news` | 307 → `/news/education` |
| 指南页 | `GET /news/education` | 200；`<title>` 为「訊覽指南｜入門與進階內容（演示）」 |
| 旧文案 | HTML 字符串计数 | `六合彩教學`/`六合彩開獎網`/`Mark Six`/`彩票` = 0；含 `指南`/`訊覽指南`/`新手指南`/`如何閱讀` |
| 其它分类 | `/news/analysis`、`/news/story` | HTTP 200 |

未验证：子类型页 SEO（`news-education-beginner` 等仍含旧文案，属 2.2-4）；浏览器点 Tab 全路径；typecheck/build。

**修改摘要**

- `app/pages/news/index.vue`：入口 SEO、`seo.news`、去掉调试日志；Tab 激活色改为青绿
- `news/modules/{teaching,forecasting,news-story}.vue`：失败文案 i18n、空列表不抛错、展示 `publish_date`
- `constants/news-categories.ts`：注释映射为指南/分析/动态（slug 不变）
- i18n 三语：`news.*` Tab/子 Tab；新增 `seo.news`；替换 `seo.news-education|analysis|story`
- `[category]/index.vue`：仅替换 schema 中硬编码 `Mark Six Lottery Results` → 讯览（未重构分类页）

**下一步**：2.2-3 分类列表 `app/pages/news/[category]/index.vue`；完成后停止。

```text
日期时间：2026-09-17 16:54
阶段及目标：2.2-2 资讯入口脱敏
验证：见本节；注意子类型 SEO 仍待 2.2-4
Git 状态：跳过
下一步：分类列表脱敏（2.2-3）
```

---

## 2026-09-17 17:11 — 2.2-3 分类列表脱敏

**阶段**：2.2-3 已完成；下一任务为 2.2-4 类型列表。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3002`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 有效分类 | `/news/education` `/analysis` `/story` | 均 200 |
| 非法分类 | `/news/not-a-category`、`/news/xyz123` | 302/跟随后到 `/news/education` |
| 文案 | education HTML | 无「六合彩/Mark Six」；标题「訊覽指南…」；二级 Tab「新手指南/進階技巧/功能說明」；文章「如何閱讀」 |

未验证：二级 Tab 点进 `type/[id]` 页内 SEO（属 2.2-4）；空列表 UI 细调；typecheck/build。

**修改摘要**

- `app/pages/news/[category]/index.vue`：合法分类白名单；非法回退指南；SEO 用 `siteUrl`/`getFullUrl`；去调试日志；激活色改青绿；非法态文案
- i18n：`news.invalid_category`、`news.back_to_guides`（三语）

**下一步**：2.2-4 类型列表 `app/pages/news/[category]/type/[id].vue`；完成后停止。

```text
日期时间：2026-09-17 17:11
阶段及目标：2.2-3 分类列表脱敏
验证：见本节
Git 状态：跳过
下一步：类型列表脱敏（2.2-4）
```

---

## 2026-09-17 17:24 — 2.2-4 类型列表脱敏

**阶段**：2.2-4 已完成；下一任务为 2.2-5 分类文章详情。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3002`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 有效类型 | `/news/education/type/1` `/2` `/3`；analysis/story 同理 | 均 200 |
| 标题 | education type/1 HTML | `<title>`「訊覽｜新手指南（演示）」；`訊覽｜新手指南` 出现 2 次 |
| 非法类型 | `/news/education/type/9` | 跟随后到 `/news/education` |
| 非法分类 | `/news/foo/type/1` | 跟随后到 `/news/education` |
| 旧文案 | type/1 HTML 计数 | `六合彩`/`Mark Six`/`彩票` = 0 |

未验证：文章详情 SEO（属 2.2-5）；遗留未使用的旧 SEO key（如 teaching-beginner 等）；typecheck/build。

**修改摘要**

- `app/pages/news/[category]/type/[id].vue`：分类+类型白名单（type 1–3）；非法回退分类列表；统一单次 `useSeo`（`news-*` 子类 key）；Tab 激活色青绿；非法态文案
- i18n 三语：9 组 `seo.news-*-*` 子类标题/描述/关键词；新增 `news.invalid_type`

**下一步**：2.2-5 分类文章详情 `app/pages/news/[category]/article/[id].vue`；完成后停止。

```text
日期时间：2026-09-17 17:24
阶段及目标：2.2-4 类型列表脱敏
验证：见本节
Git 状态：跳过
下一步：分类文章详情脱敏（2.2-5）
```

---

## 2026-09-17 20:09 — 2.2-5 分类文章详情脱敏

**阶段**：2.2-5 已完成；下一任务为 2.2-6 旧详情入口。后端等仍暂缓；Git 仍跳过。

**与旧详情关系**

- 新 canonical：`/news/{education|analysis|story}/article/:id`（本页）
- 旧入口：`/news/detail/:id` 仍保留（首页卡片、预渲染、sitemap）；脱敏/兼容跳转留给 2.2-6
- 资讯列表模块（teaching / forecasting / news-story）已改为进入新路由

**验证**（dev：`http://localhost:3666`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 有效文章 | `GET /news/education/article/101` | 200；`<title>`「如何閱讀數據面板｜訊覽」 |
| 旧文案 | 101 HTML 计数 | `六合彩`/`Mark Six`/`開獎網` = 0 |
| 不存在 | `/news/education/article/999` | 200 + 空态「沒有找到該文章」 |
| 非法分类 | `/news/foo/article/101` | 跟随后到 `/news/education` |
| 分类纠正 | `/news/story/article/101`（文章属 education） | 跟随后到 `/news/education/article/101` |
| 简体 | `/zh-CN/news/education/article/101` | 200 |

未验证：旧详情页 SEO（属 2.2-6）；首页 `ArticleCard` 仍进旧路由；typecheck/build。

**修改摘要**

- 重写 `app/pages/news/[category]/article/[id].vue`：Mock 拉详情、封面、返回、非法分类/错分类纠正、讯览 SEO + Article schema、`noindex`
- `useArticleNavigation`：`basePath` 支持函数；三资讯模块改为 `/news/{category}/article/:id`
- Mock `pickLocalizedArticle` 增加 `parent_route` 供分类校验

**下一步**：2.2-6 旧详情入口 `app/pages/news/detail/[id].vue`；完成后停止。

```text
日期时间：2026-09-17 20:09
阶段及目标：2.2-5 分类文章详情脱敏
验证：见本节
Git 状态：跳过
下一步：旧详情入口脱敏（2.2-6）
```

---

## 2026-09-17 20:19 — 2.2-6 旧详情入口（兼容跳转）

**阶段**：2.2-6 已完成；下一任务为 2.2-7 统计首页容器。后端等仍暂缓；Git 仍跳过。

**引用核实与决策**

| 引用 | 处置 |
| --- | --- |
| `ArticleCard`（首页） | 改为按 type 直达 `/news/{cat}/article/:id` |
| `AppHeader` 平台资料 | 仍走 `/news/detail/:id`（兼容层；无 Mock 稿时回退指南） |
| 预渲染 / 生成脚本 | 改为 Mock 101–105 的 canonical article 路由；保留 `/news/detail/101` 作兼容样例 |
| 静态 `public/sitemap-*.xml` 旧域名 | **未改**（全站收尾再清） |
| 删除旧路由 | **否**——外链/书签仍可能命中，保留兼容跳转 |

**验证**（dev：`http://localhost:3666`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 兼容跳转 | `GET /news/detail/101`（跟随） | 302 → `/news/education/article/101`（200） |
| 分类映射 | `/news/detail/103` | → `/news/analysis/article/103` |
| 不存在 | `/news/detail/999` | → `/news/education` |
| canonical | `/news/education/article/101` | 200 |

未验证：静态 sitemap 旧域名清理；统计页；typecheck/build。

**修改摘要**

- `news/detail/[id].vue`：改为 Mock 拉取 + replace 到分类详情（或回退指南）；`noindex`
- `ArticleCard`：按文章 type 映射分类直达新详情
- `nuxt.config` / `generate-prerender-routes` / `generate-sitemaps`：预渲染与生成脚本对齐 Mock article 路径

**下一步**：2.2-7 统计首页 `app/pages/statistics/index.vue`；完成后停止。

```text
日期时间：2026-09-17 20:19
阶段及目标：2.2-6 旧详情入口兼容跳转
验证：见本节
Git 状态：跳过
下一步：统计首页脱敏（2.2-7）
```

---

## 2026-09-17 20:33 — 2.2-7 统计首页/容器脱敏

**阶段**：2.2-7 已完成；下一任务为 2.2-8 历史数据模块。后端等仍暂缓；Git 仍跳过。

**范围说明**：入口 `statistics/index.vue` 仅为重定向；实际 Tab 容器在 `statistics/type/[id].vue`。本步脱敏容器外壳（Tab/SEO/非法 type），**未改** `modules/*` 正文。

**验证**（dev：本次为 `http://localhost:3000`，3666 亦有旧进程）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 入口 | `GET /statistics`（跟随） | → `/statistics/type/1`（200） |
| 标题 | type/1 HTML | `<title>`「訊覽｜頻次分佈（演示）」 |
| Tab SEO 品牌 | 同上 | 无「六合彩開獎網 / Mark Six」；含「頻次分佈」 |
| 非法 type | `/statistics/type/9` | 跟随后到 `/statistics/type/1` |
| type/2 | `/statistics/type/2` | 200 |

未验证：子模块内文案（冷热/图表等，属 2.2-8～11）；typecheck/build。

**修改摘要**

- `statistics/index.vue`：await replace 重定向 + `noindex`
- `statistics/type/[id].vue`：type 1–3 白名单；去掉旧 GA 上报；青绿 Tab；讯览 schema/SEO；非法回退
- i18n 三语：`statistics.tabs`；`seo.statistics-hot-cold|history|advanced`

**下一步**：2.2-8 历史数据模块 `app/pages/statistics/modules/historical-records.vue`；完成后停止。

```text
日期时间：2026-09-17 20:33
阶段及目标：2.2-7 统计首页容器脱敏
验证：见本节
Git 状态：跳过
下一步：历史数据模块脱敏（2.2-8）
```

---

## 2026-09-17 20:42 — 2.2-8 历史数据模块脱敏

**阶段**：2.2-8 已完成；下一任务为 2.2-9 频次/分布模块。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3000`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 历史 Tab | `GET /statistics/type/2` | 200；标题「訊覽｜歷史記錄（演示）」 |
| Mock 数据 | HTML | 含期次 `2026090` |
| 旧文案 | HTML 计数 | `六合彩`/`開獎`/`特碼`/`Mark Six` = 0；含「近20期」 |
| 筛选/分页 | 代码审查 | 保留 recent/year/period/number 筛选与分页逻辑 |

未验证：冷热/图表/进阶模块正文；浏览器点筛选全路径；typecheck/build。

**修改摘要**

- `statistics/modules/historical-records.vue`：去调试日志；错误/空态/分页走 i18n；年份对齐 `MOCK_CLOCK_ISO`；青绿主色；仍请求 `/api/history`
- i18n 三语：`statistics.history.*`（特码→附加项、号码→数据项等）；顺带 `menu.latestResult` / `last20Results`

**下一步**：2.2-9 分布模块 `app/pages/statistics/modules/cold-hot-number.vue`；完成后停止。

```text
日期时间：2026-09-17 20:42
阶段及目标：2.2-8 历史数据模块脱敏
验证：见本节
Git 状态：跳过
下一步：频次分布模块脱敏（2.2-9）
```

---

## 2026-09-17 21:34 — 2.2-9 频次/分布模块脱敏

**阶段**：2.2-9 已完成；下一任务为 2.2-10 图表模块。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3000`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 频次 Tab | `GET /statistics/type/1` | 200；标题「訊覽｜頻次分佈（演示）」 |
| 新文案 | HTML | 含「高頻數據項/低頻數據項/同尾分組/相鄰項」 |
| 旧文案 | HTML 计数 | `六合彩`/`開獎`/`熱門號碼`/`冷門`/`升勢`/`Mark Six` = 0 |

未验证：内嵌 `ChartAnalysis` 正文（属 2.2-10）；浏览器切换期数全路径；typecheck/build。

**修改摘要**

- `cold-hot-number.vue`：去调试日志；统一 frequency 展示；空态/失败 i18n；青绿强调；保留期数筛选与图表挂载
- `MOCK_ANALYSIS`：字段语义注释；`combination_type` 改为通用枚举值
- i18n 三语：`statistics.cold_hot.*` 映射为频次/分布通用指标

**下一步**：2.2-10 图表模块 `app/pages/statistics/modules/chart-analysis.vue`；完成后停止。

```text
日期时间：2026-09-17 21:34
阶段及目标：2.2-9 频次分布模块脱敏
验证：见本节
Git 状态：跳过
下一步：图表模块脱敏（2.2-10）
```

---

## 2026-09-17 21:42 — 2.2-10 图表模块脱敏

**阶段**：2.2-10 已完成；下一任务为 2.2-11 进阶统计模块。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3000`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 频次 Tab（含图表挂载） | `GET /statistics/type/1` | 200 |
| Mock 接口 | `GET /api/number-miss?period=10` | 200；`number_stats` 长度 49 |
| 旧文案 | 源码检索 | `chart-analysis.vue` 无「遺漏/熱門/六合/開獎」；i18n `statistics.chart.*` 为间隔指标 |

未验证：浏览器内 Chart.js 渲染与分组切换全路径；typecheck/build。ClientOnly 下 SSR HTML 不含图表正文属预期。

**修改摘要**

- `chart-analysis.vue`：去调试日志；`period` watch；Chart.js 注册/卸载清理；青绿主色；空态/失败走 i18n
- i18n 三语：`statistics.chart.*` 映射为间隔/遗漏类通用指标（BUSINESS_MAPPING.numberMiss）

**下一步**：2.2-11 进阶统计 `app/pages/statistics/modules/advanced-statistics.vue`；完成后停止。

```text
日期时间：2026-09-17 21:42
阶段及目标：2.2-10 图表模块脱敏
验证：见本节
Git 状态：跳过
下一步：进阶统计模块脱敏（2.2-11）
```

---

## 2026-09-17 21:49 — 2.2-11 进阶统计模块脱敏

**阶段**：2.2-11 已完成；下一任务为 2.2-12 统计类型页复核。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3000`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 进阶 Tab | `GET /statistics/type/3` | 200；`<title>`「訊覽｜進階統計（演示）」 |
| Mock 接口 | `GET /api/advanced-stats?period=10` | 含 `tail_distribution`/`zodiac_distribution`(G01–G12)/相邻组合 |
| 旧文案 | HTML 计数 | `六合`/`開獎`/`生肖`/`投注`/`Mark Six` = 0 |

未验证：浏览器内饼/柱切换与期数刷新全路径；typecheck/build。客户端拉取图表正文属预期。

**修改摘要**

- `advanced-statistics.vue`：去调试日志；Chart 注册/卸载；青绿主色；空态/失败/加载 i18n；说明文案 computed
- `MOCK_ADVANCED_STATS`：对齐组件字段；`zodiac` 标签 G01–G12；补 `tail_distribution` 与 `consecutive_combinations`；`combination_type` 通用枚举
- i18n 三语：`statistics.advanced.*` 映射为组合/占比通用指标（去投注/生肖用语）

**下一步**：2.2-12 统计类型页 `app/pages/statistics/type/[id].vue` 复核（模块已齐）；完成后停止。

```text
日期时间：2026-09-17 21:49
阶段及目标：2.2-11 进阶统计模块脱敏
验证：见本节
Git 状态：跳过
下一步：统计类型页复核（2.2-12）
```

---

## 2026-09-17 21:58 — 2.2-12 统计类型页复核

**阶段**：2.2-12 已完成；下一任务为 2.2-13 选择工具页。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3000`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 入口重定向 | `GET /statistics` | 200；标题落在频次 Tab |
| type 1/2/3 | 直接访问 | 200；标题分别为頻次/歷史/進階 |
| 非法 type | `GET /statistics/type/9` | 回退频次 Tab 标题 |
| 多语言 | `/zh-CN/.../1`、`/en-US/.../2` | 200；讯览/ContentPulse SEO |
| 旧文案 | HTML 计数 | `六合`/`開獎`/`Mark Six` = 0 |

未验证：浏览器内 Tab 切换 keep-alive 全路径；语言切换后 Tab 文案热更新；typecheck/build。

**修改摘要**

- `statistics/type/[id].vue`：注释对齐 2.2-12；`tabs` 改为 computed；面包屑统计项带语言前缀
- `statistics/index.vue`：注释更新（模块已齐）

**下一步**：2.2-13 选择工具 `app/pages/pick/index.vue`；完成后停止。

```text
日期时间：2026-09-17 21:58
阶段及目标：2.2-12 统计类型页复核
验证：见本节
Git 状态：跳过
下一步：选择工具页脱敏（2.2-13）
```

---

## 2026-09-17 22:12 — 2.2-13 选择工具页脱敏

**阶段**：2.2-13 已完成；下一任务为 2.2-14 兜底页。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3000`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 选择页 | `GET /pick` | 200；标题「訊覽｜智能推薦組合（演示）」 |
| 多语言 | `/zh-CN/pick`、`/en-US/pick` | 200；讯览/ContentPulse SEO |
| Mock | `GET /api/ai-prediction` | 5 组推荐；reason 含「Mock 演示」 |
| 旧文案 | HTML 计数 | `六合`/`開獎`/`中獎`/`攪珠`/`Mark Six` = 0 |

未验证：浏览器点「重新生成」全路径；typecheck/build。验证前曾重启本地 dev（原 Nitro socket 失效）。

**修改摘要**

- `pick/index.vue`：去调试日志；青绿主色；locale SEO/FAQ；空态/失败 i18n；演示说明文案
- `MOCK_AI_PREDICTION`：原因文案去冷热/投注语气
- i18n 三语：`pick.*`、`seo.ai-pick.*`（含 FAQ）映射为智能推荐组合工具

**下一步**：2.2-14 兜底页 `app/pages/[...all].vue`；完成后停止。

```text
日期时间：2026-09-17 22:12
阶段及目标：2.2-13 选择工具页脱敏
验证：见本节
Git 状态：跳过
下一步：兜底页脱敏（2.2-14）
```

---

## 2026-09-18 09:45 — 2.2-14 兜底页脱敏

**阶段**：2.2-14 已完成；下一任务为 2.2-15 统计调试页。后端等仍暂缓；Git 仍跳过。

**验证**（dev：`http://localhost:3000`）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 未知路径 | `GET /this-path-does-not-exist-xyz` | **404**；标题「訊覽｜頁面未找到」；含回首页 |
| 多语言未知 | `/zh-CN/no-such-page`、`/en-US/missing-route` | **404**；讯览/ContentPulse |
| 正常页对比 | `GET /pick` | **200**（未被兜底掩盖） |
| 旧文案 | HTML 计数 | `六合`/`開獎`/`Mark Six` = 0 |

未验证：浏览器 history.back 全路径；语言切换后回首页路径；typecheck/build。

**修改摘要**

- `[...all].vue`：`setResponseStatus(404)`；讯览 SEO noindex；首页链接带语言前缀
- `layouts/404.vue`：SSR 安全返回；青绿样式
- i18n 三语：`error_page.*`（title/hint/home_btn）

**下一步**：2.2-15 统计调试页 `app/pages/ga-test.vue`；完成后停止。

```text
日期时间：2026-09-18 09:45
阶段及目标：2.2-14 兜底页脱敏
验证：见本节
Git 状态：跳过
下一步：统计调试页处理（2.2-15）
```

---

## 2026-09-18 10:07 — 2.2-15 统计调试页处理

**阶段**：2.2-15 已完成；逐页清单（2.2-1～15）收齐。下一任务为 **2.3 全站脱敏收尾**（用户指定时再执行）。后端等仍暂缓；Git 仍跳过。

**依据**

- 全仓 `app/**` 无导航/链接指向 `/ga-test`
- 页面硬编码原 Measurement ID `G-WZ4JK9H3QT`
- `nuxt-gtag` 已禁用；`google-analytics.client.ts` / `useGoogleAnalytics` 已为 no-op

**验证**（dev：`http://localhost:3000`，清理 `.nuxt` 后重启）

| 验证 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 调试入口 | `GET /ga-test`、`/zh-CN/ga-test` | **404** 兜底；无 GA4 测试文案 |
| 首页 | `GET /` | **200**；无旧 Measurement ID |
| 源码 | `app/**` 检索 | 无 `ga-test` / `G-WZ4JK9H3QT` |

未验证：生产构建；`CookieConsent` 与 gtag consent 调用在无 gtag 下的浏览器细测；typecheck。

**修改摘要**

- 删除 `app/pages/ga-test.vue`
- `useGoogleAnalytics.ts`：注释改为演示站 no-op 说明（API 保留，首页/Cookie 调用不报错）

**遗留（交 2.3）**：`nuxt.config.original.ts`、`Google_Analytics_集成说明.md` 仍含旧 ID/域名，属备份/说明文档，非运行入口。

**下一步**：2.3 全站脱敏收尾（见 AI_HANDOFF §2.3）；完成后停止。

```text
日期时间：2026-09-18 10:07
阶段及目标：2.2-15 统计调试页删除
验证：见本节
Git 状态：跳过
下一步：全站脱敏收尾（2.3，用户指定时执行）
```

---

## 2026-09-18 14:58 — 2.3 全站脱敏收尾检查

本节是最新状态，前面的阶段记录为历史记录。

已完成本轮代码检查、脱敏收尾和阻断修复；未达到全部质量门禁通过。完整报告见 [FRONTEND_REVIEW.md](./frontend/FRONTEND_REVIEW.md)。

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
- 命名：新增 api/models.ts 转换 next_draw_* / next_jackpot 与 zodiac_distribution，页面改用 nextRelease/target/group_distribution；useLotteryStore 改为 useDatasetStore，删除无消费者 latestResult 状态及乱码注释；高级统计内部与翻译 key 改为 group，底栏改为体验工具/Try Tools，仍跳转本地 pick。
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

## 2026-09-18 — AppHeader 翻译函数类型提示修正

- 用户截图为 Vue/TypeScript 的 ts-plugin(2339)，不是 ESLint 规则错误。AppHeader.vue 模板的 14 处 `$t(...)` 改用 setup 已有的 `useI18n()` 返回值 `t(...)`，避免依赖全局属性类型识别；未修改翻译内容或语言切换逻辑。
- npm run lint、npm run typecheck 均通过；未放宽检查规则，未修改生成的 .nuxt 类型文件。
- 无法直接验证用户编辑器诊断是否刷新；本轮未运行浏览器回归或生产构建。未操作 Git 或部署。

## 2026-09-18 — 全局翻译入口修正与前端面试导览

- 检查整个前端工程的源文件（含隐藏目录，排除依赖、生成产物和 Git），将剩余 15 个 Vue 文件的 68 处 `$t(...)` 改为 setup 中的 `t(...)`；已有 useI18n 解构补充 t，ArticleCard/BasicForm 增加局部获取。不修改翻译键、业务流程或检查规则。
- 涉及 AppFooter、ArticleCard、BasicForm，首页五个模块，news 入口、三个旧分类模块及分类/类型/文章详情页。AppHeader 延续上一轮修正。
- 新增 FRONTEND_GUIDE.md：集中说明 API/SSR、路由与 sitemap、多语言 SEO、统计展示及脱敏清理，提供页面与源码入口、简短问答、工作经历边界及未完成事项。前端 README 与 docs/README 增加入口，不另建重复问答文档。
- 在 content-api 插件、useSeo、content-directory 和统计窗口计算处补充简短设计理由注释。
- 验证：npm run lint、npm run typecheck 均通过；源文件全局扫描无剩余 `$t` 引用，导览所有相对文件链接存在。npm 的 shamefully-hoist 配置提示为既有提示。
- 本轮未执行浏览器回归或生产构建，未直接验证用户编辑器红线刷新；.output 不是本轮源码产物。未修改后端、原项目或执行部署。
- 下一步：后端数据模型与接口契约设计；后端功能完成后再扩展全栈导览。

## 2026-09-19 — 后端第一批契约与逐项交接

- 用户反馈根仓库已推送；本轮仅新增/修改 docs，不操作提交或远程。
- 新增 BACKEND_CONTRACT.md 与 openapi.json（OpenAPI 3.0.3）：第一批五个 GET 为 health、categories、articles、articles/{id}、content-directory。以现有前端字段为依据保留列表/详情形状和语言别名，定义分页、三语完整性、可见性、错误和 UTC 时间；日期展示需联调核对。
- 设计 Category/CategoryTranslation/Article/ArticleTranslation 四个模型、索引和种子边界；尚未生成 schema.prisma 或迁移。统计、认证、编辑发布明确后续分批设计，当前 OpenAPI 不覆盖这些接口。
- 新增 BACKEND_HANDOFF_PROMPTS.md，B1-B7 每次只执行一项实现任务，B8/B9 仅设计下一批契约并继续拆分。每段读取状态、验证、更新记录后停止，不能自动连做。
- 新增 MYSQL_SETUP.md：用户先确认已有 MySQL 的版本和位置，准备独立开发库/影子库及账号；不复用 AI 多模态库，不手工建业务表、不在聊天发送密码。未连接或操作数据库。
- 更新文档导航和实施计划当前范围。JSON 解析、24 个内部引用和五个 operationId 唯一性检查通过；未实际导入 Apifox、未启动后端或进行 HTTP 验收。
- 下一步由另一 AI 执行 B1 工程基础；数据库准备可同时由用户完成，B2 迁移前须核实专用连接和版本。
- 补充验证：21 个响应示例的声明类型/必填项/枚举等基础检查及新增文档相对链接通过。未安装完整 OpenAPI 校验器（Python 命令不可用），不声称完成规范级校验；B6 要结合实际实现再验收。

## 2026-09-19 — 文档按前端与后端归类

- `docs/frontend/` 收纳前端审查、架构、SEO、Mock、部署、浏览器证据及前端接手提示词，并新增独立 README 导航。
- `docs/backend/` 收纳接口契约、OpenAPI、MySQL 说明及后端逐项提示词，并新增独立 README 导航。
- `docs/` 根目录只保留总导航、实施计划和本状态记录；同步更新前端 README、两类提示词及文档间相对路径。
- 本轮只整理文档位置和链接，未改业务代码、数据库、Git 历史或远程仓库。
