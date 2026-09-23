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
| 旧业务残留 | 首页 HTML 字符串计数 | `旧业务品牌`/`数据发布`/`心水`/`旧品牌`/`852 5236` = 0；含 `訊覽`/`ContentPulse`/`最新期次`/`2026090` |
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

**背景**：3D 彩球易联想敏感业务，不利于大陆求职展示。

**修改**

- `app/components/BallNumber.vue`：改为扁平数据标签（左侧色条 + 分档青/靛/石板；`is-special` 紫色强调），不再加载 `/legacy-assets/value-*.svg`
- 首页 `latest-result` / `history-draws`：分隔符 `+` → `/`
- `public/favicon.svg` 新增；`public/favicon.ico` 换成 ContentPulse 波形标
- `nuxt.config.ts`：优先挂载 SVG favicon

**未做**：未物理删除 `public/legacy-assets/`（49 个 marksix SVG，已无引用，收尾时可删）；`logo.png` 等品牌图仍待替换。

**搜素材关键词（若另换）**：`data chip badge flat UI`、`metric tag rounded square`、`dashboard number pill`、`analytics favicon pulse waveform teal`、`squircle status indicator SVG`；避免 `number sphere` / `bingo` / `keno`。

**下一步**：仍为 2.2-2 资讯入口（用户指定时再做）。

```text
日期时间：2026-09-17 15:54
阶段及目标：首页视觉去敏感业务化（BallNumber + favicon）
验证：依赖 HMR；建议硬刷新后看首页编号标签与标签页图标
Git 状态：跳过
```

---

## 2026-09-17 16:09 — 品牌 Logo 脱敏（替换 logo1 彩球图）

**背景**：`logo1.jpg` 含彩球「6」与「旧业务品牌開獎網」文案。

**修改**

- 新增 `public/logo.svg`（青绿波形标 + 訊覽 / ContentPulse）
- 覆盖生成：`logo1.jpg`、`logo.jpg`、`logo.png`；另增 `logo-og.png`（480×320，OG 可用）
- Mock 封面与默认封面路径改为 `/logo.svg`：`catalog.ts`、`common.ts`、`ArticleCard.vue`、news 模块 fallback

**搜素材关键词（若另换）**：`saas logo waveform teal`、`content platform wordmark flat`、`data pulse icon rounded square`、`mint green brand card 3:2`；避开 `legacy-domain` / `bingo` / `legacy-brand` / `号码球`。

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
| 旧文案 | HTML 字符串计数 | `旧业务品牌教學`/`旧业务品牌開獎網`/`旧品牌`/`敏感业务` = 0；含 `指南`/`訊覽指南`/`新手指南`/`如何閱讀` |
| 其它分类 | `/news/analysis`、`/news/story` | HTTP 200 |

未验证：子类型页 SEO（`news-education-beginner` 等仍含旧文案，属 2.2-4）；浏览器点 Tab 全路径；typecheck/build。

**修改摘要**

- `app/pages/news/index.vue`：入口 SEO、`seo.news`、去掉调试日志；Tab 激活色改为青绿
- `news/modules/{teaching,forecasting,news-story}.vue`：失败文案 i18n、空列表不抛错、展示 `publish_date`
- `constants/news-categories.ts`：注释映射为指南/分析/动态（slug 不变）
- i18n 三语：`news.*` Tab/子 Tab；新增 `seo.news`；替换 `seo.news-education|analysis|story`
- `[category]/index.vue`：仅替换 schema 中硬编码 `旧品牌 Legacy Results` → 讯览（未重构分类页）

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
| 文案 | education HTML | 无「旧业务品牌/旧品牌」；标题「訊覽指南…」；二级 Tab「新手指南/進階技巧/功能說明」；文章「如何閱讀」 |

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
| 旧文案 | type/1 HTML 计数 | `旧业务品牌`/`旧品牌`/`敏感业务` = 0 |

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
| 旧文案 | 101 HTML 计数 | `旧业务品牌`/`旧品牌`/`開獎網` = 0 |
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
| Tab SEO 品牌 | 同上 | 无「旧业务品牌開獎網 / 旧品牌」；含「頻次分佈」 |
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
| 旧文案 | HTML 计数 | `旧业务品牌`/`開獎`/`特碼`/`旧品牌` = 0；含「近20期」 |
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
| 旧文案 | HTML 计数 | `旧业务品牌`/`開獎`/`熱門號碼`/`冷門`/`升勢`/`旧品牌` = 0 |

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
| Mock 接口 | `GET /api/advanced-stats?period=10` | 含 `tail_distribution`/`legacy_group_distribution`(G01–G12)/相邻组合 |
| 旧文案 | HTML 计数 | `六合`/`開獎`/`生肖`/`业务操作`/`旧品牌` = 0 |

未验证：浏览器内饼/柱切换与期数刷新全路径；typecheck/build。客户端拉取图表正文属预期。

**修改摘要**

- `advanced-statistics.vue`：去调试日志；Chart 注册/卸载；青绿主色；空态/失败/加载 i18n；说明文案 computed
- `MOCK_ADVANCED_STATS`：对齐组件字段；`legacy-group` 标签 G01–G12；补 `tail_distribution` 与 `consecutive_combinations`；`combination_type` 通用枚举
- i18n 三语：`statistics.advanced.*` 映射为组合/占比通用指标（去业务操作/生肖用语）

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
| 旧文案 | HTML 计数 | `六合`/`開獎`/`旧品牌` = 0 |

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
| Mock | `GET /api/legacy-analysision` | 5 组推荐；reason 含「Mock 演示」 |
| 旧文案 | HTML 计数 | `六合`/`開獎`/`中獎`/`攪珠`/`旧品牌` = 0 |

未验证：浏览器点「重新生成」全路径；typecheck/build。验证前曾重启本地 dev（原 Nitro socket 失效）。

**修改摘要**

- `pick/index.vue`：去调试日志；青绿主色；locale SEO/FAQ；空态/失败 i18n；演示说明文案
- `MOCK_AI_PREDICTION`：原因文案去冷热/业务操作语气
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
| 旧文案 | HTML 计数 | `六合`/`開獎`/`旧品牌` = 0 |

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

## 2026-09-19 — B1 后端工程基础

- 仓库内无适用 `AGENTS.md`（仅其他项目有）；已读 STATUS、BACKEND_CONTRACT、openapi.json、MYSQL_SETUP；Git 工作区执行前干净，本轮未 commit/push。
- 在 `nuxt-content-platform-backend/` 新建 TypeScript + Express 模块化单体骨架（`src/config`、`middleware`、`lib`、`routes`、`app.ts`、`index.ts`）。独立子项目，未另建 Git，未改前端 / AI 多模态 / 公司项目。
- **版本固定（依据见该包 README）**：Node `>=22.12.0`（本机验证 v22.22.0）；pnpm `10.11.0`（与前端一致）；Express `5.2.1`；Prisma CLI / `@prisma/client` `6.19.3`（仅锁定，未 generate/migrate）；TypeScript `5.9.2`；Zod `4.1.5`；dotenv `17.2.2`。锁文件 `pnpm-lock.yaml` 已写入工作区。
- 能力：`pnpm dev|start|build|typecheck|lint`；Zod 校验 `NODE_ENV`/`PORT` 及可选 MySQL URL 形态（不连接、不打印连接串）；统一错误体 `{ error: { code, message, requestId } }`；`x-request-id` 中间件；无凭据 `.env.example`。
- **刻意未做**：未安装/启动 MySQL；无 schema/迁移/种子；无文章业务；未实现契约 `GET /health`（避免冒充数据库已就绪）。探测 `/health` 现为 404 + requestId。
- **已验证**：`pnpm typecheck`、`pnpm lint`、`pnpm build` 通过；`pnpm start` 监听 `127.0.0.1:4000`；非法 `PORT` 启动前失败；未知路径返回契约形错误与透传/生成的 requestId。
- **未验证**：数据库连接、迁移、真实 `/health`、Apifox、文章接口。
- **下一步**：用户检查后执行 **B2**（Prisma 四模型、迁移/种子、真实 DB 就绪检查 `/health`）。B2 前须按 MYSQL_SETUP 准备专用库/影子库与账号。

## 2026-09-19 — B2 数据库模型与迁移（代码完成，库未连）

- 确认 B1 完成；仓库无适用 AGENTS.md；已读契约/OpenAPI/MYSQL_SETUP；本机 `MySQL80` 服务为 Running，但 **`nuxt-content-platform-backend/.env` 尚不存在**，未持有凭据，故**未执行** `migrate deploy` / `db seed`，也未连接任何库（含 AI 多模态库）。
- 新增 `prisma/schema.prisma`：Category / CategoryTranslation / Article / ArticleTranslation；枚举 `ArticleStatus`；联合主键；Category→Article `onDelete: Restrict`；翻译级联；索引与契约一致；`shadowDatabaseUrl` 指向 `SHADOW_DATABASE_URL`。
- 提交迁移目录 `prisma/migrations/20260919100000_init/`（由 `prisma migrate diff --from-empty` 生成并审查）；幂等种子 `prisma/seed.ts` + `seed-data.ts`：九分类三语文案、文章 ID 101–105，上海本地时间转 UTC（例 `2026-09-10 10:00:00` → `2026-09-10T02:00:00.000Z`），仅插入缺失记录、不覆盖、不清库。
- 新增 Prisma 生命周期（connect/disconnect）、`GET /health` 真实 `SELECT 1`；无 `DATABASE_URL` 或探测失败返回 `503 SERVICE_UNAVAILABLE`；拒绝任意 query → `400`。脚本：`db:generate` / `db:migrate:deploy` / `db:migrate:dev` / `db:seed` / `db:status`。
- **已验证（无库）**：`pnpm typecheck`、`pnpm lint`、`pnpm build`；无 `.env` 时 `/health`→503、带 query→400；时区换算单测字符串通过。
- **未验证**：建表约束、种子重复执行、数据库失败以外的连通 `/health` 200、`migrate deploy`。待用户按 MYSQL_SETUP 建库/账号并填写 `.env` 后再跑迁移与种子。
- **下一步**：用户配置 `.env` 后告知，再验证迁移/种子/health；或直接执行 **B3**（分类查询）——仍须先有可用库。未实现分类/文章业务接口。

## 2026-09-19 — B2 连接验证补完

- 用户已配置本地 `.env`（未在日志或对话中打印连接串）。对 `content_platform_dev@127.0.0.1:3306` 执行 `pnpm db:migrate:deploy` 成功应用 `20260919100000_init`；`migrate status` 为 up to date。
- `pnpm db:seed` 连续执行两次均成功（幂等）；库内计数：分类 9、分类翻译 27、文章 5、文章翻译 15；文章 ID 101–105；`publishedAt` 例 `2026-09-10T02:00:00.000Z`（上海 10:00 → UTC）。
- 约束抽查：重复 `slug` → Prisma `P2002`；无效 `categoryId` → `P2003`。
- `/health`：正常进程返回 `200 {"status":"ok","database":"up"}`；非法 query → `400`；故意错误凭据进程返回 `503 SERVICE_UNAVAILABLE`（不泄露连接细节）。
- 未执行 `migrate reset` / `db push`。未实现分类/文章 API。
- **下一步**：用户检查后执行 **B3**（`GET /api/categories`）。

## 2026-09-19 — B3 分类查询

- 确认 B2 已完成且开发库可用；实现 `GET /api/categories`：服务层 `listCategories` 查 Prisma（九子类 + 指定 locale 名称），不读前端 Mock。
- `lang` 支持 zh-HK/zh-CN/en-US 及 tc/sc/en 别名，缺省 zh-HK；未知/空/重复/额外 query → `400 INVALID_ARGUMENT`；DB 失败 → `503 SERVICE_UNAVAILABLE`。排序：父类 education→analysis→story，再按 `sortOrder`。
- **已验证**：`pnpm typecheck` / `lint` / `tsc` 构建；默认与 `sc`/`zh-CN`/`en` 返回 9 条且文案正确；非法 lang、空 lang、未知参数、重复 lang → 400；错误凭据进程 → 503。未改前端、未实现文章接口。
- **下一步**：用户检查后执行 **B4**（`GET /api/articles`）。

## 2026-09-19 — 分类成功响应补 code/msg

- 按用户要求，`GET /api/categories` 成功体由 `{ data }` 改为 `{ code: 0, msg: "ok", data }`；同步 OpenAPI `CategoryList` 与 BACKEND_CONTRACT。错误体仍为 `{ error: { code, message, requestId } }`，未改 `/health`。
- 原因：对齐常用业务外壳字段，便于客户端统一判断；后续列表/详情接口将沿用同一成功外壳。

## 2026-09-19 — 响应外壳统一提示词调整

- 复查 B1～B3：当前只有 categories 成功体为 `{ code: 0, msg: "ok", data }`；health 成功体及错误响应仍是旧结构，尚未真正统一。
- 在 `docs/backend/BACKEND_HANDOFF_PROMPTS.md` 增加 B3.1，要求下一步先统一成功/失败外壳、数字业务码、HTTP 状态、requestId、全局 helper、契约和 OpenAPI，再进入 B4。
- 统一目标：成功 `{ code: 0, msg: "ok", data: T }`；失败 `{ code: 非零数字, msg, data: null, requestId }`。HTTP 错误仍使用 400/404/500/503，不能全部返回 200。
- B4～B9 提示词同步增加统一外壳约束；B7 要求前端 API 适配层集中判断 code 和解包 data，页面不重复处理。
- 本轮只修改提示词和状态记录，未改后端实现、BACKEND_CONTRACT.md 或 openapi.json；这些由 B3.1 在同一任务中同步并验证。下一步应执行 B3.1，不直接执行 B4。

## 2026-09-19 — B3.1 统一响应外壳

- 全局 helper：`okResponse` / `failResponse`；`AppError.code` 改为数字业务码（40000/40400/40401/50000/50300/50301）；错误中间件与未知路由统一输出 ErrorEnvelope。
- `GET /health` 成功：`{ code:0, msg:"ok", data:{ status:"ok", database:"up" } }`；`GET /api/categories` 仍为 code/msg + data 数组。成功体不含 requestId；失败体含 `data:null` + `requestId`。开发态保留 `GET /__debug/unhandled` 仅用于验证未处理异常外壳。
- 同步 `BACKEND_CONTRACT.md` 与 `openapi.json`：五接口成功套 `*Response`，错误套 `ErrorEnvelope`；文章列表契约改为 `data: { items, total, page, page_size, total_pages }`（实现仍待 B4）。
- **已验证**：typecheck/lint/build；health/categories 200 + code 0；非法 lang → HTTP 400/code 40000；未知路由 → 404/40400；未处理异常 → 500/50000；错误凭据 → health/categories 503/50300。未改前端、未实现文章接口、未 commit/push。
- **下一步**：用户检查后执行 **B4**（文章列表，复用统一外壳）。

## 2026-09-19 — B4 文章列表

- 确认 B3.1 完成；实现 `GET /api/articles`。可见性与 DTO 在服务层：`PUBLISHED`、`publishedAt <= 当前 UTC`、三语 title/content 非空；排序 `publishedAt DESC, id DESC`；`count` 与列表同一 `REPEATABLE READ` 事务。
- 分类支持父类、九种子类及旧别名（legacy-education/legacy-analysis/news-story）。分页只接受十进制正整数字符串，默认 page=1、page_size=10，上限 1000000/50；越页返回空 `items`，`total_pages` 至少为 1。
- 成功体 `{ code:0, msg:"ok", data:{ items, total, page, page_size, total_pages } }`；正文经标签白名单清理（去脚本、事件属性、危险 URL）；非法 cover 回落 `/logo.svg`；公开 `status` 恒为 1。失败走数字业务码外壳。
- **已验证**（专用探测行 990001–990005，测完删除，未清空开发库、种子 101–105 仍在）：page=1/3 顺序与 total=5；page=4 空列表且 total_pages=3；education 与 legacy-education 一致；how-to-play / en 标题；page=0、page_size=51、lang=xx、未知分类、空/重复/多余参数 → HTTP 400 / code 40000。草稿、未来时间、缺译、下线不出现；含 script 的探测文被清理且 cover 被替换。typecheck / lint / build 通过。
- 未实现文章详情、管理端或前端联调；未 commit/push。
- **下一步**：用户检查后执行 **B5**（`GET /api/articles/{id}`）。

## 2026-09-20 — B5 文章详情

- 确认 B3.1/B4 完成；实现 `GET /api/articles/{id}`，复用 `visibleArticleWhere` 与列表同一 DTO/HTML 清理。成功 `{ code:0, msg:"ok", data: Article }`；非法 ID（0/前导零/非整数/超 INT 上限等）→ HTTP 400 / code 40000；不存在、草稿、未来时间、缺译、下线 → HTTP 404 / code 40401（不区分原因）。
- **已验证**：101 的 en/sc/tc 标题与 UTC `publish_date`；无 Prisma 内部字段；非法 ID 与非法/多余 query → 40000；999999 及草稿/未来/缺译探测 → 40401；含 script 的可见探测文被清理且 cover 回落 `/logo.svg`。探测行测完删除，种子 101–105 仍在。typecheck / lint / build 通过。
- 未实现 content-directory、前端或管理端；未 commit/push。
- **下一步**：用户检查后执行 **B5.1**（Route/Controller 分层），再 B6。

## 2026-09-20 — 增加 B5.1 Route/Controller 分层提示词

- 复查当前代码：B5 已完成；`services` 与 Prisma 已分开，但 health/categories/articles 的 `routes/*.ts` 仍内联参数解析、调用 service、响应和错误转交，实际是 Route + Controller 混合。
- 在 `docs/backend/BACKEND_HANDOFF_PROMPTS.md` 插入 B5.1，当前下一步改为只做结构整理：`Route → Controller → Service → Prisma`。采用现有顶层 routes/controllers/services/db 目录，暂不增加 Repository/DAO/DI 或大规模迁移到 modules。
- B5.1 要求四个既有接口及统一响应完全保持不变，并验证成功、非法参数、404、未知路由、数据库不可用、typecheck、lint 和 build；完成后停止，不推进 B6。
- B6～B9 提示词同步要求沿用该分层。B6 前置条件改为 B3.1～B5.1 已完成。
- 本轮仅调整提示词与状态记录，未修改后端业务代码、数据库、接口契约或 OpenAPI。下一步应执行 B5.1，不直接执行 B6。

## 2026-09-20 — B5.1 Route/Controller 分层

- 结构：`routes` 仅注册 URL 与 `asyncHandler(controller)`；新增 `controllers/healthController.ts`、`categoryController.ts`、`articleController.ts`（参数校验、调 service、`okResponse`）；新增 `services/healthService.ts`（就绪检查，不再在 route/controller 直接 `pingDatabase`）；`lib/asyncHandler.ts` 统一把 AppError / DB 错误交给全局中间件。
- 未新增 Repository/DAO/DI，未搬 modules；契约与 OpenAPI 未改；四个接口路径/状态/数字 code/data 形状保持不变。
- 静态核对：`services` 无 Express 引用，`controllers` 无 Prisma，`routes` 无业务/参数/响应内联。
- **已验证**：typecheck / lint / build；health、categories、articles 列表/详情成功；非法 lang/ID → 40000；未知文章 → 40401；未知路由 → 40400；错误凭据下 health/categories → 50300。未执行 B6、未改前端、未 commit/push。
- **下一步**：用户检查后执行 **B6**（内容目录与契约验收）。

## 2026-09-20 — B6 内容目录与第一批契约验收

- 按 `Route → Controller → Service → Prisma` 实现 `GET /api/content-directory`：`routes/contentDirectory.ts`、`controllers/contentDirectoryController.ts`、`services/contentDirectoryService.ts`；可见性复用 `visiblePublishedWhere`（已发布 + 发布时间已到 + 三语齐全）；`REPEATABLE READ` 快照；`id ASC`；成功 `{ code:0, msg:"ok", data:{ generated_at, articles } }`，项含 `id/parent_route/status/publish_date`；任意 query → 40000；可见篇数 > 10000 → HTTP 503 / code 50301，不截断。
- 同步 `BACKEND_CONTRACT.md` Apifox 调试步骤；OpenAPI 中 content-directory 描述改为已实现。OpenAPI `$ref` 与五路径齐全检查通过。
- **已验证**：health / categories?lang=sc / articles 分页 / articles/101?lang=en / content-directory（5 篇 id 升序、UTC 时间）；目录忽略草稿与未来探测行；用 service `limit:2` 触发 50301；种子 101–105 保留。typecheck / lint / build 通过。
- **限制**：未称完整后端；未跑前端构建/联调；未安装完整 OpenAPI 规范校验器（以 `$ref`/结构自检代替）；未 commit/push。
- **下一步**：用户检查后执行 **B7**（资讯前后端联调）。

## 2026-09-20 — B6 后优化任务拆分与提示词调整

- 复盘 B1～B6 后，将下一步改为 B6.1：API 的 publish_date/generated_at 统一为 13 位 Unix 毫秒时间戳；数据库仍使用 UTC DateTime(3)，不建迁移；日志时间允许保留 ISO 字符串。
- B6.1 同时要求按面试阅读价值整理注释：解释设计取舍、职责边界、可见性、一致性和安全原因的注释改为简洁中文；普通技术提示、协议名和代码标识符保留英文，不机械翻译或增加无价值注释。
- B6.1 要求更新已过期的后端 README、BACKEND_CONTRACT.md、openapi.json、Apifox 示例及时间字段类型，并复验统一响应、排序和可见性；完成后停止，再执行 B7。
- B7 明确前端集中处理毫秒时间戳和 sitemap lastmod 转换。B7 后另拆 B7.1 HTML 清理安全加固、B7.2 OpenAPI/接口测试自动化、B7.3 分类完整性/领域常量/调试路由收口；每项单独执行并停止。
- B8/B9 后续契约统一继承数字业务码、毫秒时间戳和 Route→Controller→Service→Prisma 分层。
- 本轮仅更新提示词、后端文档导航和状态记录，未修改后端代码、数据库、接口契约或 OpenAPI。当前下一步是 B6.1，不直接执行 B7。

## 2026-09-20 — B6.1 毫秒时间戳、关键注释与文档收尾

- 新增 `src/lib/time.ts` 的 `toUnixMillis`；`publish_date` / `generated_at` 改为 number 毫秒。数据库仍为 UTC DateTime(3)，无迁移。内容目录的 `generated_at` 与可见性查询共用同一个 `now`；日志 `time` 继续 ISO（已注释说明例外）。
- 同步 ArticleDto/ContentDirectoryDto、`BACKEND_CONTRACT.md`、`openapi.json`（`integer` + `format: int64`，示例改为毫秒整数，无残留 date-time/ISO 业务时间示例）；后端 README 改为中文并反映五个已实现接口与分层/毫秒约定。
- 按面试阅读价值整理可见性、目录快照、health、响应外壳、asyncHandler、queryGuard、htmlSanitize、env、app、routes 等关键中文注释；标识符与协议名保持英文。
- **已验证**：typecheck / lint / build；`articles/101` 的 `publish_date === 1789005600000`（对应 `2026-09-10T02:00:00.000Z`）；content-directory 字段均为 13 位安全整数毫秒，排序仍为 101–105；注入固定 now 时 `generated_at` 一致；OpenAPI 时间字段不再为 string/date-time。统一外壳与可见性未改。
- 未执行 B7、未改前端、未 commit/push。
- **下一步**：用户检查后执行 **B7**（资讯前后端联调；前端集中格式化毫秒时间戳）。

## 2026-09-20 — B7 资讯前后端联调

- **配置**：私有 `runtimeConfig.contentApiBaseUrl` / `contentApiUseReal`（`CONTENT_API_BASE_URL`、`CONTENT_API_USE_REAL`）；不进入 public。`.env.example` 已说明。
- **Nitro**：`server/api/[...].ts` 对 `articles` / `articles/:id` / `categories` / `content-directory` 白名单代理到 Express；仅允许固定查询键；不转发 Cookie/Authorization；失败不回退 Mock。统计等路径继续 Mock。
- **适配层**：`app/api/envelope.ts` + `client.ts` 统一解包 `code===0` 的 `data`；错误保留 HTTP 状态、msg、requestId（`ContentApiError`）。Mock 资讯响应改为 SuccessEnvelope + 列表 `items`，与后端对齐；页面改为使用 `items`，禁止各自解包。
- **时间**：`app/utils/publishTime.ts` 集中处理毫秒/Mock 字符串 → 展示、JSON-LD ISO、sitemap lastmod；详情/列表/ArticleCard 已接入，禁止直接展示毫秒数。
- **构建**：`prepare:content` 写入 `.nuxt/content-directory-snapshot.json`（Mock 离线或真实一次拉取）；prerender 与 sitemap 共用；真实模式失败中止。`package.json` build/update-sitemaps 已串 prepare。
- **文档**：更新 API_CLIENT（直连 vs 代理）、ROUTES_AND_SITEMAP、FRONTEND_GUIDE、前端 README、BACKEND_CONTRACT 状态句。
- **已验证**：check-api-client / check-content-directory；lint / typecheck / build（Mock）；产物服务 4378 上 check-demo 43 项；真实 prepare 拉到 5 篇毫秒 `publish_date`；4379 + `NUXT_CONTENT_API_USE_REAL` 代理详情毫秒、页面已格式化且无裸毫秒、`/api/latest` 仍 Mock。
- 未实现登录/发布/推送部署；未执行 B7.1+；未 commit/push。
- **下一步**：用户检查后可执行 **B7.1**（文章 HTML 清理安全加固），或按需选择 B7.2 / B7.3。

## 2026-09-20 — B7.1 文章 HTML 清理安全加固

- 用仍维护且适配 Node≥22.12 的 `sanitize-html@2.17.7`（+ `@types/sanitize-html@2.16.1`）替换手写正则解析；清理仍在 `src/lib/htmlSanitize.ts`，由 `articleService` 映射时调用，不进 route/controller。
- 保留原允许标签（p/br/strong/em/b/i/ul/ol/li/blockquote/h2/h3/a）、`a.href` 协议规则与 `normalizeCoverImage`；拒绝脚本、事件属性、危险协议、SVG/MathML、协议相对 URL、路径穿越；未扩大允许范围。
- 新增 `src/lib/htmlSanitize.test.ts` 与 `pnpm test:sanitize`（大小写 script、事件属性、嵌套危险标签、实体编码、不完整标签、安全相对/HTTPS/mailto、cover 回退等）。
- **已验证**：typecheck / lint / test:sanitize（12）/ `tsc` build；五种子正文经清理前后一致；`GET /api/articles/101?lang=zh-CN` 与列表 5 篇 content 仍为安全 `<p>` 片段。
- 未执行 B7.2、未改数据库、未 commit/push。
- **下一步**：用户检查后可执行 **B7.2**（OpenAPI/接口自动化验证）。

## 2026-09-20 — B7.2 接口契约自动化验证

- 引入 `@apidevtools/swagger-parser@13.0.0` 与 `pnpm openapi:validate`（`scripts/openapi-validate.ts`）；修正 OpenAPI 3.0 下 `ErrorEnvelope.data` 的非法 `type: null` 为 `nullable: true`。
- 新增 `src/api.integration.test.ts` + `src/test/httpHarness.ts`：`createApp` 临时端口、高位探测行 990301–990304 测完删除，覆盖成功/失败外壳、40000/40400/40401、毫秒时间戳、草稿/未来/缺译不可见、列表详情 DTO 一致、目录升序、50301（service `limit` 钩子）、数据库失败响应不泄密。
- 脚本：`openapi:validate`、`test:integration`、`test`（sanitize + integration）。
- **已验证**：typecheck / lint / openapi:validate / test（sanitize 12 + integration 7）/ tsc build。
- **Apifox**：本轮未实际执行人工导入；以 `openapi:validate` 与集成测试为准。
- 未执行 B7.3、未 commit/push。
- **下一步**：用户检查后可执行 **B7.3**（数据完整性与领域常量收口）。

## 2026-09-20 — B7.3 数据完整性与领域常量收口

- 新增业务码 **50001** `DATA_INTEGRITY_ERROR`（HTTP 500）；`listCategories` 在分类数≠9 或请求语言缺任一分类名时抛错，禁止静默少返回。契约与 OpenAPI 已同步。
- 新增 `src/lib/domainConstants.ts`：`Locale` / `ParentRoute` / `CategorySlug`、九 slug、旧别名、`PARENT_ORDER`；`lang` / `categoryQuery` / `articleVisibility` / seed-data 改为引用，避免多处硬编码漂移。
- `/__debug`：仅 `NODE_ENV=test` 或 `ENABLE_DEBUG_ROUTES=true`；production 开启则 `loadEnv` 失败。`.env.example` 已说明。
- 测试：categories 9 条、缺译 50001、env 门控；`pnpm test` 覆盖。
- **已验证**：typecheck / lint / openapi:validate / test（unit 14 + integration 9）/ tsc build。
- 未执行 B8、未 commit/push。
- **下一步**：由用户决定是否进入 **B8**（统计契约设计，只设计）。

## 2026-09-20 — B7.4 前后端联调收口与真实构建验证

- 前端真实资讯配置统一为私有 `NUXT_CONTENT_API_USE_REAL` / `NUXT_CONTENT_API_BASE_URL`；构建脚本、Nuxt runtimeConfig、示例环境和文档使用同一命名。构建脚本会读取本地 `.env`，快照来源与当前 Mock/真实模式不一致时直接失败，避免复用旧快照。
- 新增统一 `ArticleDto` / `ArticlePage` 和 `ArticleList.vue`；三个资讯列表共用展示组件，移除旧 `publish_time`、`as any`、重复卡片样式及挂载后延迟 1.5 秒的 `v-html`。列表只显示纯文本摘要，正文 HTML 留在详情页。
- 后端分类完整性扩展为九个固定 slug、parent_route、sortOrder 映射校验；正文超过 100000 字符返回 50001，不再用 `slice` 截断清理后的 HTML。新增两项集成测试。
- **验证**：前后端 lint/typecheck 通过；OpenAPI 校验通过；单元测试 14、集成测试 11 全通过；后端 `tsc -p tsconfig.build.json` 通过。`prisma generate` 曾因 Windows Prisma DLL 被占用出现 EPERM，属于本机文件锁，非 TypeScript 构建错误。
- **真实构建验证**：Express 连接 MySQL 后生成 `source=content-directory` 的 5 篇快照；Nuxt 完成 75 路由预渲染。最终 HTML 含真实接口文章标题、正文、canonical/hreflang/JSON-LD 和正式站点 URL；sitemap 含同一文章 URL 与 `lastmod`。Nitro 输出完成后本机进程未自动退出，人工结束悬挂进程；产物已完整生成。
- 未 commit/push；统计仍为 Mock。下一步可进入 **B8**（统计契约设计，只设计）。

## 2026-09-20 — B7.4 SEO 产物审计与资讯子分类 sitemap 修正

- 修正九个 `/news/{category}/type/{1..3}` 子分类页未进入 sitemap：这些页面有独立筛选结果及 title/description、canonical、四组 hreflang、CollectionPage JSON-LD，应作为可收录 URL。三语展开后 sitemap 从 39 增至 66 个 URL。
- 新增 `scripts/audit-seo-output.mjs` / `npm run audit:seo`，以 `.output/public/sitemap.xml` 为基准逐页核对预渲染 `index.html`、唯一且匹配的 canonical、zh-HK/zh-CN/en-US/x-default hreflang 和 JSON-LD JSON 语法。
- **产物审计结果**：66/66 sitemap URL 均有对应 HTML、canonical、四组 hreflang 和合法 JSON-LD。另有 9 个预渲染路由未进 sitemap，全部是 `/news`、`/statistics` 重定向入口及 `/news/detail/101` 兼容入口的三语版本，排除合理。
- 当前 robots 仍为作品演示阶段既定的 `noindex,nofollow`；正式公开收录前需改为环境控制并在生产构建开启索引。

## 2026-09-20 — B8 统计契约设计（只设计）

- 新增 `docs/backend/STATISTICS_CONTRACT.md`：设计 DatasetPeriod/DatasetSchedule、120 条脱敏种子边界、统一可见窗口、Asia/Hong_Kong 年份口径、空数据、稳定排序和 7 个兼容接口。所有 API 日期为 13 位毫秒时间戳。
- 设计接口：latest、history、analysis、advanced-stats、number-miss，以及明确 `source=fixed_demo`、`is_generated=false` 的 legacy-analysision/legacy-featured-combination；固定组合不调用 AI、不随刷新随机变化。
- history 返回 filter_options（可见年份及最新 120 个 periodCode），用于后续移除前端对 MOCK_HISTORY 的直接依赖。新增设计业务码 40402 DATASET_NOT_FOUND，仅 latest 无可见数据时使用。
- 唯一 `docs/backend/openapi.json` 已从 5 条路径扩展为 12 条；新增统计 schemas、query 边界和统一外壳。资讯五接口仍为已实现，B8 七接口明确标记“设计，尚未实现”。OpenAPI 校验脚本同步要求 12 条路径和 40402。
- `docs/backend/BACKEND_HANDOFF_PROMPTS.md` 已拆为 B8.1～B8.8：模型/种子、latest、history、analysis、advanced-stats、number-miss、固定样例、前端联调；每段完成后必须停止，禁止一次连续执行。
- 本轮未改 Prisma schema、未生成迁移、未写统计 route/controller/service、未改前端、未连接数据库。下一步是 **B8.1 数据期次模型、迁移与脱敏种子**。

## 2026-09-20 22:36 — B8.1 数据期次模型、迁移与脱敏种子

- 确认无适用 AGENTS.md；已读 STATUS、STATISTICS_CONTRACT、BACKEND_CONTRACT、openapi、MYSQL_SETUP；连接确认为 `content_platform_dev` / `content_platform_shadow`（日志不打印连接串）。
- Prisma 新增 `DatasetPeriod` / `DatasetSchedule` 及 `DatasetPeriodStatus` / `DatasetScheduleStatus`；索引 `(status, releasedAt, id)` 与 `(status, scheduledAt)`；迁移 `20260920120000_dataset_period_schedule` 含 CHECK（1～49、七值互异、金额/次数非负）。未改 Article/Category 行为；未用 reset / db push。
- 幂等种子：前端 MOCK_HISTORY 120 条（periodCode/日期/七值保留）；首批 8 条补展示金额（含 MOCK_LATEST 对齐的 2026090）；其余金额 null；`releasedAt`/`scheduledAt` 按 Asia/Hong_Kong 当日 00:00 → UTC；未来计划 `2026091` / `2026-09-20` / estimatedAmount `2100000`。只插入缺失行，不覆盖、不清表。
- **刻意未做**：任何统计 HTTP 接口（latest/history/…）、前端改动。
- **已验证**：`migrate deploy` + status up to date；`db:seed` 连续两次成功；`verify-dataset-seed`（120 PUBLISHED、8 条有金额、UTC `2026-09-15T16:00:00.000Z` / `2026-09-19T16:00:00.000Z`）；CHECK 拒绝越界与重复值；typecheck / lint / build；openapi:validate（12 paths）；unit 14 + integration 11。
- 未 commit/push。**下一步：B8.2 `GET /api/latest`**（用户指定后再做）。

## 2026-09-21 10:25 — B8.2 GET /api/latest

- 分层：`routes/latest.ts` → `controllers/latestController.ts` → `services/latestService.ts` → Prisma；拒绝全部 query；同一 `now` 查最新可见 `PUBLISHED` 期次（`releasedAt DESC, id DESC`）与最早未来 `SCHEDULED` 计划；金额经 `decimalToJson`；无 `_mock_clock`。
- 新增业务码 **40402** `DATASET_NOT_FOUND`（HTTP 404）；无下一计划时 `next_*` 三字段为 null。
- 集成测试（高位探测期次/计划，测完删除）：成功与排序、草稿/未来/归档不可见、next 可空、未知 query → 40000、无可见期次 → 40402、数据库失败不泄密。
- 同步 `errors`、BACKEND_CONTRACT、STATISTICS_CONTRACT、openapi（latest 标已实现）、README。
- **已验证**：typecheck / lint / openapi:validate / test（unit 14 + integration 16）/ build。
- 未实现 history、未改前端、未 commit/push。**下一步：B8.3 `GET /api/history`**。

## 2026-09-21 10:50 — B8.3 GET /api/history

- 分层：`routes/history.ts` → `controllers/historyController.ts` → `services/historyService.ts`；可见性抽到 `datasetVisibility.ts`；HK 年边界 `hongKongTime.ts`。
- Query：page/page_size（默认 1/20，page_size 最大 100 不截断）、year 2000–2100、draw_number、number 1–49、periods 1–120；非法一律 40000。
- 同一 now + REPEATABLE READ：过滤后 `releasedAt DESC, id DESC`；periods 先截窗口再分页；`filter_options.years`（HK 年降序）与最新 120 `draw_numbers` 不受本次筛选影响；列表 DTO 仅 DatasetRow 字段，`draw_date` 毫秒。
- 集成测试覆盖：filter_options 独立性、HK 年边界、七值匹配、periods 分页、空集/超页、稳定排序、草稿/未来/归档不可见、非法 query。
- 同步 openapi（history 已实现）、BACKEND_CONTRACT、STATISTICS_CONTRACT、README。
- **已验证**：typecheck / lint / openapi:validate / test（unit 14 + integration 21）/ build。
- 未实现 analysis、未改前端、未 commit/push。**下一步：B8.4 统计公共窗口与 `GET /api/analysis`**。

## 2026-09-21 11:05 — B8.4 统计窗口与 GET /api/analysis

- 可复用：`parseStatisticsPeriod`（缺省 10、最大 120、允许 0、超限 40000）、`loadVisibleValueWindow`（同一 now、可见期次、最新到最旧）、纯函数 `analyzeFrequency` / `adjacentPairs`。Controller 只校验并调用 service。
- 公式覆盖全部 7 个值：hot/cold 前 5 且并列按 number 升序；rising 从最新连续出现；同尾按期计数；相邻对去重升序。`period=0` 或无样本时五个数组为空，不伪造冷热。响应含 `requested_period` 与实际 `period`。
- OpenAPI：analysis 标已实现，并将 period / requested_period 下限改为 0，与契约空窗口一致。
- **已验证**：typecheck / lint / openapi:validate / test（unit 18 + integration 25）/ build。
- 未实现 advanced-stats、未改前端、未 commit/push。**下一步：B8.5 `GET /api/advanced-stats`**。

## 2026-09-21 11:20 — B8.5 GET /api/advanced-stats

- 复用 `parseStatisticsPeriod`、`loadVisibleValueWindow`、`adjacentPairs`；新增纯函数 `analyzeAdvancedStats` 与 Route/Controller/Service。
- 实现尾数 0～9、中性 G01～G12、奇偶计数与 2 位百分比、含相邻期次数/比例、相邻组合频次，以及前 6 普通值完整组合 top 5（频次降序、字典序升序）。`period=0` 时分布键完整为 0、组合为空。
- 纯函数与 HTTP 测试覆盖空窗口、重复完整组合、相邻对、非法 period。同步 openapi / 契约 / README。
- **已验证**：typecheck / lint / openapi:validate / test / build。
- 未实现 number-miss、未改前端、未 commit/push。**下一步：B8.6 `GET /api/number-miss`**。

## 2026-09-21 11:30 — B8.6 GET /api/number-miss

- 复用 `parseStatisticsPeriod` 与 `loadVisibleValueWindow`；纯函数 `missStats` / `analyzeNumberMiss`。
- 1～49 计算 current_miss、max_miss、avg_miss（2 位）、most_freq_miss（并列取较小值）、max_streak。遗漏段包含窗口两端截断和连续命中之间的 0。`period=0` 或无样本时 `number_stats=[]`；有样本时按 number 升序恰好 49 项。
- 单元测试覆盖从未出现、最新命中、连续命中、首尾遗漏、0 间隔和众数并列；HTTP 覆盖外壳、49 项、空窗口和非法 period。
- **已验证**：typecheck / lint / openapi:validate / test / build。
- 未实现固定组合、未改前端、未 commit/push。**下一步：B8.7 固定演示组合接口**。

## 2026-09-21 11:45 — B8.7 固定演示组合

- `GET /api/legacy-analysision`、`GET /api/legacy-featured-combination`：版本常量、三语文案、`source=fixed_demo`、`is_generated=false`。不读统计表、不调用外部服务、不随请求变化。
- 号码为 6 个互异 1～49 升序整数，与前端既有样例数字一致。`generated_at` 固定为样例版本 `2026-09-17T12:00:00+08:00` 的毫秒值。
- 集成测试覆盖三语、两次请求一致、非法 lang/多余参数。文档不称预测能力。
- **已验证**：typecheck / lint / openapi:validate / test / build。
- 未改前端、未 commit/push。**下一步：B8.8 统计前后端联调**。

## 2026-09-21 — B8.7.1 联调前契约复盘与脱敏收口

- 对外统计契约改为中性字段：latest/history 使用 `period_code`、`released_at`、`values`、`extra_value`、`next_release`；history query 使用 `period_code`，筛选选项使用 `period_codes`；高级统计使用 `group_distribution`。
- 删除 DatasetPeriod 的金额/层级字段和 DatasetSchedule 的估算金额字段；以追加迁移完成，不修改已应用迁移。固定发布计划不再写入数据库种子，避免随时间失效或制造不真实的远期倒计时；Mock 倒计时继续使用固定演示时钟。
- 合并两个重复固定接口为 `GET /api/demo-combinations`，返回 `featured/items`、`source=fixed_demo`、`is_generated=false`。不调用外部模型。
- 移除内容查询的旧父类别名；六个来源明显的子分类 slug 迁移为通用命名。前端内容分类映射同步使用规范父分类。
- 请求 `period` 只接受 1～120；数据库没有可见样本时，响应实际 `period` 仍可为 0。
- 删除未使用且含敏感文案的 LegalDisclaimer，修复 Mock 入口乱码；前端 Mock、共享 DTO、首页、历史筛选和高级统计已改用中性字段，历史筛选不再直接导入 MOCK_HISTORY，固定样例统一到 `demo-combinations`。B8.8 仅剩真实后端代理与整链路联调。
- 同步 OpenAPI、BACKEND_CONTRACT、STATISTICS_CONTRACT、README 与 B8.8 接手提示词。B8.1～B8.7 的旧记录仅表示当时实现过程，本节契约优先。
- **数据库**：`20260921120000_remove_sensitive_metrics`、`20260921121000_refresh_demo_schedule` 与后续清理迁移 `20260921122000_remove_seed_schedule` 已通过 `prisma migrate deploy` 应用。
- **验证**：后端 typecheck（应用与 seed）、lint、OpenAPI（11 paths）、单元测试 28、集成测试 30、种子不变量、数据库 CHECK 全通过；前端 typecheck、lint、Mock 模式生产构建通过，SEO 产物审计 66/66 通过。构建产物完成后 Nitro 进程仍未自行退出，已手动结束。
- **限制**：完整 `prisma generate` 在 Windows 上仍因正在运行的 Node 进程占用 query engine DLL 报 EPERM；生成过程已更新 Client，所有数据库集成测试随后正常通过。未执行生产构建，未 commit/push。
- **下一步：B8.8 前后端统计联调**，严格以当前 OpenAPI 与 STATISTICS_CONTRACT 为准，不恢复旧兼容字段。

## 2026-09-21 — B8.8 统计前后端联调

- Nitro 白名单增加 `latest`、`history`、`analysis`、`advanced-stats`、`number-miss`、`demo-combinations`。只转发对应查询键，不转发 Cookie/Authorization，未知路径不代理。`NUXT_CONTENT_API_USE_REAL=true` 时上游失败不回退 Mock。
- 统计 Mock 改为 `{ code: 0, msg: "ok", data }`。页面仍只通过 `useContentApi` 解包。共享 DTO 使用 `period_code`、`released_at`、`values`、`extra_value`、`next_release`、`group_distribution`、`filter_options.period_codes/years` 和 `demo-combinations` 的 `featured/items`、`is_generated=false`。
- `released_at`、`scheduled_at`、`generated_at` 经 `publishTime` 按当前语言和 `Asia/Hong_Kong` 展示。首页与工具页标明固定样例。历史筛选继续只读接口里的 `filter_options`。
- **验证**：后端 typecheck、lint、OpenAPI（11 paths）、单元测试 28、集成测试 30 通过。`tsc -p tsconfig.build.json` 通过。完整 `pnpm build` 仍在 `prisma generate` 因运行中的 Node 占用 query engine DLL 报 EPERM，未停止正在运行的后端进程。
- 前端 typecheck、变更文件 lint、`scripts/check-mock.ts` 通过。Mock 模式与真实模式生产构建均成功。真实模式（`http://localhost:3677`，上游 `127.0.0.1:4000`）确认 latest 的 `next_release=null` 来自后端而非带计划的 Mock；历史按年份与期次筛选并分页；三个统计接口返回中性字段；tc/sc/en 固定样例文案不同且 `is_generated=false`；首页、历史页和工具页 SSR 可见固定样例标记。未列入白名单的 `/api/secret-path` 返回 404，未转发到 Express。
- 联调后已把内容目录快照恢复为 Mock，避免默认离线启动因快照来源不一致而失败。当前 `.output` 是真实模式构建产物。
- 未进入 B9、认证、发布或部署。未 commit/push。

## 2026-09-21 — B8.8.1 联调收尾与构建产物复核

- 首页倒计时改用当前时间判断；`next_release=null` 或计划时间已过时不再显示空白/负向倒计时卡片。截图中的 `2026-09-20` 计划在 `2026-09-21` 不再展示；同时删除已无用途的公开 Mock 时钟开关。
- Nitro 代理现在拒绝白名单外 query，避免静默删除参数后得到与 Express 直连不同的结果；仍拒绝重复、数组及空参数。
- 更新前端 `.env.example`，明确真实模式覆盖资讯与统计固定白名单，失败不回退 Mock。
- SEO 产物审计增加 Nuxt 正文与 `data-ssr=true` 标记检查，不再只检查 HTML 文件存在及 head 标签。
- **验证**：前端 typecheck、lint、Mock 契约检查通过；Mock 与真实模式均完成生产构建，各预渲染 75 条路由。真实构建从 MySQL 内容目录取得 5 篇文章。
- **路由/SEO**：sitemap 共 66 条正式 URL，全部有预渲染 HTML、Nuxt SSR 标记、canonical、四个 hreflang 和合法 JSON-LD；其余 9 条为 `/news`、`/statistics` 及旧详情的三语重定向/兼容入口，按设计不进 sitemap。首页、三个统计页、资讯列表、文章详情均抽查到服务端渲染数据。
- 构建完成后 Nitro 在当前 Windows 环境仍不自动退出；看到 `Nuxt Nitro server built` 后手动结束。依赖数据陈旧提示不影响本次产物正确性。

## 2026-09-21 — B8.8.2 倒计时发布闭环

- 首页发布状态分为倒计时与等待更新：未来 `next_release` 显示倒计时；计划为空或已过期时显示最近期次和“等待下一期发布”，不再永久隐藏卡片。
- 倒计时结束立即刷新 `latestResult`；尚未得到新计划时每 60 秒检查一次。页面进入后台暂停轮询，回到前台立即检查；用户也可手动点击“立即检查”。
- `DatasetStore` 保存最新期次编号，刷新 `/api/latest` 后由既有 `LatestResult` 同步最新数据与下一计划；获得新的未来计划即自动恢复倒计时。
- 修正倒计时当前时间：时间戳是绝对时刻，统一使用 `Date.now()`，避免 SSR 部署在 UTC 服务器时额外偏移 8 小时。
- 浏览器只刷新业务接口，不持有部署密钥，也不直接触发 GitHub/Cloudflare 构建。构建应由后端在数据成功入库及下一计划生成后触发，并由每日定时构建兜底。
- **验证**：前端 typecheck、变更文件 lint、Mock 契约检查通过；生产构建与 SSR/SEO/sitemap 审计见本节后续验证记录。

## 2026-09-21 — 资讯管理后台提示词规划

- 后台目录固定为 `nuxt-content-platform-admin`，由用户创建；与 web/backend 共用根 Git，不建立嵌套仓库。
- 技术方向固定为 Nuxt + TypeScript + Naive UI；范围限于单管理员资讯管理，不复制旧公司后台，不扩展多租户、低代码或复杂 RBAC。
- 新增 `docs/admin/README.md` 与 `ADMIN_HANDOFF_PROMPTS.md`，按 A0～A8 拆分工程骨架、契约、认证、CRUD、编辑器、发布、自动构建和收尾；每次只执行一段并停止。
- 当前下一步：用户创建管理端项目后执行 **A0 管理端工程骨架**。管理接口与自动部署尚未实现。

## 2026-09-21 17:35 — A0 管理端工程骨架

- 确认用户已创建空目录 `nuxt-content-platform-admin`（无嵌套 `.git`）；无适用 AGENTS.md。以 STATUS / ADMIN_HANDOFF_PROMPTS / admin README / BACKEND_CONTRACT 为准执行 **仅 A0**。
- 在该目录建立最小可运行 Nuxt 工程：`nuxt@4.0.3`（与公开站主版本对齐，未跟脚手架默认升到 4.5.x）、TypeScript、`@bg-dev/nuxt-naiveui`、sass、eslint。
- 布局：`default`（侧栏 + 顶栏 + 内容区）、`blank`（登录）；错误页 `error.vue`；主题变量在 `app/assets/styles`。
- 路由：`/` → `/articles`；`/login`、`/articles`、`/articles/new`、`/articles/:id`、`/deployments`。页面标题与导航为简体中文；未接入处统一 `ApiNotConnected`（「接口尚未接入」），无假文章/假部署记录。
- 目录边界：`layouts` / `pages` / `components` / `composables` / `api` / `types`。`app/api/adminClient.ts` 仅白名单占位并抛出未接入错误。
- `.env.example`：仅无密钥示例；`runtimeConfig.adminApiBaseUrl` 私有，公开站预览基址可进 public。README 说明启动、范围与未完成项。开发端口 **3670**。
- **刻意未做**：登录实现、文章 CRUD、后端管理接口、BFF、自动部署、Mock 业务数据。
- **已验证**（工作目录 `nuxt-content-platform-admin`）：`pnpm install`、`pnpm typecheck`、`pnpm lint`、`pnpm build` 均通过。
- 未 commit/push。**下一步：A1 / B9.1 管理接口与认证契约（只设计）**（用户指定后再做）。

```text
日期时间：2026-09-21 17:35
阶段及目标：A0 管理端工程骨架
修改文件与原因：nuxt-content-platform-admin 全量骨架；docs/admin/README.md、docs/README.md、本 STATUS 追加
执行的验证命令、工作目录、结果：admin 下 install/typecheck/lint/build 通过
未验证内容及原因：未起 dev 浏览器肉眼回归；登录与业务联调不在本阶段
当前阻碍/已知问题：无
新增设计决策：Nuxt 对齐公开站 4.0.3；Naive UI 经 @bg-dev/nuxt-naiveui；端口 3670；未接入明示警告
Git 状态：未 commit/push
下一步最小可执行任务：A1 / B9.1 管理接口与认证契约（只设计）
```

## 2026-09-21 — A0 后复盘与文章弹窗决策

- A0 骨架的 Nuxt/Naive UI 版本、布局边界、私有 runtimeConfig、未接入提示及构建验证符合要求。
- 发现当前 `/articles/new`、`/articles/:id` 与侧栏“新建文章”不符合最新交互要求；layout 和 `useAdminNav` 还存在导航配置重复维护。
- 最新决定：文章新建和编辑统一在 `/articles` 列表页复用一个 Naive UI 表单弹窗；不保留独立文章表单路由，侧栏只保留文章列表和构建状态。
- 已在 `ADMIN_HANDOFF_PROMPTS.md` 新增 **A0.1** 单独修正提示词，并同步约束 A0 与 A5。下一步先执行 A0.1，完成复盘后再执行 A1/B9.1。

## 2026-09-21 18:09 — A0.1 文章表单改为列表页弹窗

- 确认 A0 已完成；无适用 AGENTS.md。实际路由仍含 `/articles/new`、`/articles/:id`，且 `layouts/default.vue` 与 `useAdminNav` 各维护一份导航。本轮只做 A0.1。
- 删除 `app/pages/articles/new.vue` 与 `app/pages/articles/[id].vue`。侧栏改为只读 `useAdminNav`：文章列表、构建状态。`/articles` 的「新建文章」打开同一个 `ArticleFormModal`；组件同时暴露 `openCreate` / `openEdit`，编辑模式接收 `ArticleFormDraft`，供后续表格行复用。
- 弹窗 create 打开时重置空草稿；关闭时恢复校验并清空临时状态。相对打开基线有改动时先确认再关闭。封面、分类、三语标题/正文当前全部禁用，保存按钮禁用，不写假数据、不提示成功。未保存确认因此在本阶段不会触发，留到 **A5 启用输入后**生效。
- 弹窗宽度 `min(880px, calc(100vw - 24px))`，正文区 `max-height: calc(100vh - 220px)` 内部滚动。直接访问 `/articles/new` 与 `/articles/:id` 走既有 404（「页面不存在」），无兼容跳转。
- **已验证**（`nuxt-content-platform-admin`）：`pnpm typecheck`、`pnpm lint`、`pnpm build` 通过。预览 `http://127.0.0.1:3670`：`/` 302 到 `/articles`；侧栏仅为文章列表/构建状态；点击新建打开标题「新建文章」、含未接入说明、保存禁用，取消后弹窗关闭；桌面弹窗宽 880px，390px 视口下宽 366px；`/articles/new` 与 `/articles/101` 为 404 错误页。
- 未 commit/push。未做契约、认证、文章接口、发布或部署。**下一步：A1 / B9.1 管理接口与认证契约（只设计）**。

```text
日期时间：2026-09-21 18:09
阶段及目标：A0.1 文章表单改为列表页弹窗
修改文件与原因：删除独立新建/编辑页；侧栏单一导航；新增 ArticleFormModal 与 ArticleFormDraft；同步 README / STATUS
执行的验证命令、工作目录、结果：admin typecheck、lint、build 通过；预览端口弹窗开关与旧路由 404 已核对
未验证内容及原因：未保存关闭确认未实际弹出，因字段仍全部禁用
当前阻碍/已知问题：无
新增设计决策：新建与编辑共用列表页弹窗；导航只保留 useAdminNav
Git 状态：未 commit/push
下一步最小可执行任务：A1 / B9.1 管理接口与认证契约（只设计）
```

## 2026-09-21 — A0.1 复盘与编辑器诊断清理

- 复核 A0.1 实现：独立文章新建/编辑路由已删除，侧栏导航收敛到 `useAdminNav` 单一数据源，文章列表通过同一个 `ArticleFormModal` 承载 create/edit 模式；实现与最新交互决定一致。
- 截图中 `~/types/admin`、`useHead`、`ref` 同时标红并非实际 ESLint 错误，而是编辑器尚未加载 Nuxt 生成的别名与自动导入类型。项目现有 ESLint 与 Nuxt typecheck 均为 0 错误。
- 删除 `package.json` 中已被当前 pnpm 忽略的 `pnpm.peerDependencyRules`；项目已固定 TypeScript 5.8.3，现有依赖的 peer 范围兼容，无需保留失效配置。
- 已重新执行 Nuxt prepare；管理端 ESLint、Nuxt typecheck 与生产构建全部通过。若 VS Code 仍显示旧红线，应重新加载窗口或重启 Vue/TypeScript language server，不通过添加多余显式导入规避编辑器缓存。

## 2026-09-21 — A1 / B9.1 管理接口与认证契约设计

- 新增 `docs/admin/ADMIN_CONTRACT.md` 与独立的 `admin-openapi.json`，没有修改公开查询 OpenAPI。管理契约共 12 个接口：登录/退出/会话、只读分类选项、文章列表/详情/创建/修改/发布/下线、部署列表/详情。
- 认证确定为管理站同源 Nitro BFF + host-only HttpOnly Cookie；生产使用 Secure + SameSite=Lax。数据库只保存 opaque session token 的 SHA-256 哈希；会话采用 12 小时空闲、7 天绝对过期，写请求使用会话绑定 CSRF token 和 Origin 双重校验，不使用 localStorage token，也不开放注册/OAuth。
- 文章沿用 `DRAFT / PUBLISHED / ARCHIVED`。创建固定为草稿；更新、发布、下线携带 `version` 做乐观并发。草稿/下线态修改不构建，首次/再次发布、发布态修改和下线分别产生可去重 BuildEvent。
- 数据库发布和站点部署保持两个状态。文章、翻译、版本、AuditLog 和 BuildEvent(outbox) 在同一事务提交；事务后的外部构建失败不回滚文章，事件可观察、重试并由唯一 dedupeKey 防重。
- 最小追加迁移顺序确定为：AdminUser/AdminSession → Article.version → AuditLog/BuildEvent；不改已应用迁移。单管理员不增加角色权限表，审计与构建事件分表。
- 管理端占位白名单和占位枚举已与契约对齐，但没有实现请求、认证、路由、Prisma 或数据库写入。
- **验证**：`admin-openapi.json` 通过 JSON 解析与 Swagger Parser OpenAPI 3.0.3 校验；管理端 ESLint 与 Nuxt typecheck 通过。未连接数据库，未调用生产服务。
- **下一步：A2 / B9.2 单管理员认证后端**。只实现认证模型、迁移及登录/退出/会话接口，不提前实现文章 CRUD。

## 2026-09-21 22:04 — A2 / B9.2 单管理员认证后端

- 确认 A1 契约与 `admin-openapi.json` 可校验；无适用 AGENTS.md。本轮只实现认证，未做文章写接口或管理端登录联调。
- Prisma 追加 `AdminUser` / `AdminSession`，迁移 `20260921210000_admin_auth` 已 `migrate deploy`（库 up to date）。密码使用 **bcryptjs**（Windows 下避免原生 bcrypt 编译门禁）。
- 实现 `POST /api/admin/auth/login`、`POST /api/admin/auth/logout`、`GET /api/admin/auth/session`：Route → Controller → Service → Prisma；Cookie `cp_admin_session`（HttpOnly、SameSite=Lax、Path=/，production/显式配置才 Secure）；DB 只存 SHA-256；空闲 12h / 绝对 7d；登录 IP+规范化用户名限速（5 次 / 15 分钟 → 42900）；Origin 白名单；logout 在有效会话下校验 CSRF。
- 本地初始化：`pnpm admin:ensure` 只创建缺失管理员，凭据仅 `ADMIN_BOOTSTRAP_*` 环境变量，不进 seed / 示例真值 / 日志。
- 同步：`.env.example`、backend README、`ADMIN_CONTRACT` 实现进度、`admin-openapi` 描述、`openapi:validate:admin`、`docs/admin/README`、`docs/README`。
- **已验证**（`nuxt-content-platform-backend`）：migrate status up to date；typecheck；lint；openapi:validate；openapi:validate:admin；unit 29；integration 38（含认证 8）；build。为生成 Prisma Client 曾短暂结束占用 DLL 的本地 `tsx watch`。
- **刻意未做**：文章 CRUD、管理端 BFF/登录页、发布与部署。未 commit/push。
- **下一步：A3 管理端登录与会话守卫**。

```text
日期时间：2026-09-21 22:04
阶段及目标：A2 / B9.2 单管理员认证后端
修改文件与原因：AdminUser/AdminSession 迁移与认证三接口；限速/Cookie/初始化脚本；文档与 OpenAPI 同步
执行的验证命令、工作目录、结果：backend migrate/typecheck/lint/openapi×2/unit+integration/build 通过
未验证内容及原因：未联调管理端页面（A3）；未创建真实生产管理员
当前阻碍/已知问题：Windows 上 prisma generate 可能被运行中的 Node 占用 DLL（已知遗留）
新增设计决策：bcryptjs 替代原生 bcrypt；会话 GET 轮换 CSRF 明文；客户端 IP 只用 socket.remoteAddress
Git 状态：未 commit/push
下一步最小可执行任务：A3 管理端登录与会话守卫
```

## 2026-09-22 10:02 — A3 管理端登录与会话守卫

- 确认 A2 认证三接口可用。本轮只做管理端 BFF / 登录 / 守卫，不实现文章 CRUD。
- Nitro 白名单 BFF：`server/api/admin/[...].ts` + `server/utils/adminApiProxy.ts`。仅允许固定方法+路径+query；转发 Cookie / Origin / CSRF；不转发 Authorization；未知路径/方法/query 拒绝。私有 `NUXT_ADMIN_API_BASE_URL`。
- 集中客户端 `app/api/adminClient.ts`：浏览器只打同源 `/api/admin/*`，`credentials: 'include'`；SSR 转发请求 Cookie；csrf 不进 localStorage。
- `useAdminAuth` + `admin-auth.global`：会话恢复、未登录进 `/login`、已登录访问 `/login` 转 `/articles`、退出清会话；40100 回登录页。登录页 Naive UI 校验与提交态；顶栏显示管理员并支持退出。
- **已验证**（`nuxt-content-platform-admin`）：typecheck、lint、build 通过。预览冒烟：未知路径 404、非法 query 400；经 BFF 登录成功并下发 `cp_admin_session`；session 可恢复；无 Cookie 访问 `/articles` → 302 `/login?redirect=/articles`。探针账号测完已删除。
- **刻意未做**：文章列表真实数据、CRUD、发布、部署。未 commit/push。
- **下一步：A4 / B9.3 文章管理读写接口**。

```text
日期时间：2026-09-22 10:02
阶段及目标：A3 管理端登录与会话守卫
修改文件与原因：Nitro 管理 BFF、API 客户端、useAdminAuth、全局守卫、登录/退出 UI；文档与 .env.example
执行的验证命令、工作目录、结果：admin typecheck/lint/build 通过；BFF 登录/session/白名单/守卫冒烟通过
未验证内容及原因：未做完整浏览器多标签长时间回归；文章接口仍未接入
当前阻碍/已知问题：无
新增设计决策：BFF 白名单含后续文章路径但上游未实现时由 Express 404；会话用 useState 内存 + HttpOnly Cookie
Git 状态：未 commit/push
下一步最小可执行任务：A4 / B9.3 文章管理读写接口
```

## 2026-09-22 — A4 / B9.3 文章管理读写接口

- 确认 A3 认证/BFF 可用。本轮只做后端文章管理读写，不改管理端页面，不实现发布/构建。
- Prisma 追加 `Article.version Int @default(1)`，迁移 `20260922110000_article_version`。
- 实现 `GET /api/admin/categories`、`GET/POST /api/admin/articles`、`GET/PUT /api/admin/articles/{id}`：读接口 `requireAdminSession`（不轮换 CSRF）；写接口 Origin + CSRF + `requireAdminWriteSession`；Zod 校验 slug/author/cover/category/三语；HTML 白名单清理；创建固定 DRAFT；更新 `id+version` 乐观并发（40410 / 40900 / 40902）。
- 集成测试覆盖：未登录 40100、空翻译草稿、公开接口不泄露草稿、CSRF/封面/slug 校验、slug 冲突、版本冲突、筛选、HTML 清理、40410。
- 同步：`admin-openapi` 描述、`ADMIN_CONTRACT` 进度、`docs/admin/README`、`docs/README`。
- **已验证**（`nuxt-content-platform-backend`）：`migrate deploy`（含 `article_version`）、`db:generate`、typecheck、lint、openapi:validate、openapi:validate:admin、unit 29、integration 47（含 A4 文章 9）、build 通过。为释放 Prisma DLL 曾结束占用中的 `tsx watch`。
- **刻意未做**：publish/unpublish、BuildEvent、A5 管理端列表/弹窗。未 commit/push。
- **下一步：A5 文章列表与编辑器页面**。

```text
日期时间：2026-09-22
阶段及目标：A4 / B9.3 文章管理读写接口
修改文件与原因：Article.version 迁移；管理分类/文章 Route→Controller→Service；校验与错误码；集成测试与文档
执行的验证命令、工作目录、结果：backend migrate/generate/typecheck/lint/openapi×2/unit+integration(47)/build 通过
未验证内容及原因：未联调管理端文章 UI（A5）；未实现发布/部署
当前阻碍/已知问题：Windows 上 prisma generate 可能被运行中的 Node 占用 DLL（已知遗留）
新增设计决策：管理读接口不轮换 CSRF；草稿空翻译允许；A4 修改已发布文章只保存内容不写 BuildEvent（留给 A6）
Git 状态：未 commit/push
下一步最小可执行任务：A5 文章列表与编辑器页面
```

## 2026-09-22 — A5 文章列表与编辑器页面

- 确认 A4 管理文章接口可用；A0.1 已无独立 `/articles/new`、`/articles/:id` 路由。本轮只做管理端列表与弹窗编辑，不实现发布/下线/部署。
- `/articles`：状态/分类/关键词筛选、分页表格、加载/空/错误态；新建与行内「编辑」共用 `ArticleFormModal`；弹窗按 articleId 拉详情，保存成功后由列表刷新。
- 弹窗：slug/作者/分类/封面（可预览）+ 三语 Tab + textarea；未保存关闭确认；40900 版本冲突提示与重新加载；无假发布按钮；正文不 `v-html` 回显。
- API：`app/api/adminArticles.ts` 经既有 BFF 白名单调用 categories/articles CRUD。
- **已验证**（`nuxt-content-platform-admin`）：typecheck、lint、build 通过。
- **刻意未做**：publish/unpublish、BuildEvent、部署页真实数据。未 commit/push。
- **下一步：A6 / B9.4 发布、下线与公开预览闭环**。

```text
日期时间：2026-09-22
阶段及目标：A5 文章列表与编辑器页面
修改文件与原因：articles 列表接 API；ArticleFormModal 可读写草稿；类型与 adminArticles 客户端；文档进度
执行的验证命令、工作目录、结果：admin typecheck/lint/build 通过
未验证内容及原因：未做完整浏览器手工回归账号长测；发布能力仍未接入
当前阻碍/已知问题：封面预览依赖管理站可访问的相对路径资源，缺文件时自动隐藏破图
新增设计决策：第一版正文用 textarea；编辑态 openEdit(id) 每次拉详情；列表与弹窗通过 saved 事件解耦
Git 状态：未 commit/push
下一步最小可执行任务：A6 / B9.4 发布、下线与公开预览闭环
```

## 2026-09-22 — A3～A5 复盘、弃用清理与新增需求规划

- 复盘结论见 `docs/admin/A5_REVIEW.md`。A3～A5 的同源 BFF、Cookie 会话、固定白名单、文章筛选分页、共用编辑弹窗和乐观并发主链路合理。
- 清理 H3 已弃用的 `getMethod(event)`，改用 `event.method`；全局未发现其他业务代码调用该弃用 API。登录 redirect 同时拒绝 `//host` 形式，进一步限定为站内路径。
- 视觉/错误态：登录、列表和弹窗已有持久 n-alert，列表失败有重试，版本冲突有专用重载入口；仍需补分类失败和详情首次加载失败的局部重试，并移除未知保存错误的内联 + message 重复提示。
- 新增需求拆为四个单任务提示词：A5.0 错误状态收尾、A5.1/B9.3.1 受限文章删除、A5.2/B9.3.2 封面上传契约与存储设计、A5.3/B9.3.3 上传实现联调。删除只允许 DRAFT/ARCHIVED；上传生产方向为后端 StorageAdapter + Cloudflare R2，本地使用 gitignore 存储适配器。
- **验证**：管理端 ESLint、Nuxt typecheck、生产构建通过。构建仅出现 Nuxt 4.0.3 内部依赖 `@vue/shared` 的 Node DEP0155 警告，业务代码无对应弃用调用，不修改 node_modules。
- **下一步：A5.0**。依次完成 A5.0 → A5.1 → A5.2 → A5.3 后，再进入 A6 发布闭环。

## 2026-09-22 — A5.0 错误状态与视觉收尾

- 文章列表筛选区：分类加载失败改为筛选卡片内持久 `n-alert` +「重试分类」，不再只用短暂 message；分类下拉在失败时禁用并显示局部 loading。
- `ArticleFormModal`：拆分 `categoryError` / `detailError`；新建提供「重新加载分类」，编辑提供「重试文章详情」；分类与详情独立请求，重试成功前不覆盖已填草稿；分类重试仅局部 loading。
- 登录与保存失败统一以内联 alert 为主，去掉「内联 + message」重复提示；成功反馈仍用短 message。错误区补充 `role="alert"`、`aria-live` 与焦点落点，重试按钮可键盘操作。
- **验证**：`nuxt-content-platform-admin` 下 `pnpm typecheck`、`pnpm lint`、`pnpm build` 通过。构建仍仅有 Nuxt 4.0.3 内部 `@vue/shared` DEP0155 警告。未做真实账号浏览器自动化；桌面/390px 行为按模板与响应式样式核对。
- **刻意未做**：删除、封面上传、发布/下线。未 commit/push。
- **下一步：A5.1 / B9.3.1 受限文章删除**。

```text
日期时间：2026-09-22
阶段及目标：A5.0 错误状态与视觉收尾
修改文件与原因：articles/index、ArticleFormModal、login 补充分类/详情可重试错误态并去重 message
执行的验证命令、工作目录、结果：admin 目录 typecheck/lint/build 通过
未验证内容及原因：未跑真实账号浏览器自动化回归
当前阻碍/已知问题：无
新增设计决策：分类失败与详情失败分轨重试；表单错误以内联 alert 为主
Git 状态：未 commit/push
下一步最小可执行任务：A5.1 / B9.3.1 受限文章删除
```

## 2026-09-22 — A5.1 / B9.3.1 受限文章删除

- 契约：`ADMIN_CONTRACT` / `admin-openapi` 新增 `DELETE /api/admin/articles/{id}`，body `{ version }`，成功 `{ id, deleted: true }`；仅 DRAFT/ARCHIVED；PUBLISHED → 40901；缺失 40410；版本冲突 40900。明确删除草稿/已下线不写 BuildEvent，A6 再补 AuditLog。
- 后端：Route → Controller → Service → Prisma；事务内 `id + version + 允许状态` 硬删除，翻译外键级联；新增 `articleStateConflict`。
- BFF / 客户端：白名单增加 DELETE `articles/:id`；`deleteAdminArticle` 走 CSRF + credentials。
- 列表 UI：操作列「删除」+ warning Dialog（标题/slug、不可恢复）；PUBLISHED 禁用并提示先下线；成功短 message；当前页最后一条删除后页码回退；失败内联 alert（40900 提示刷新列表）。
- **验证**：backend `openapi:validate:admin`、typecheck、lint；`adminArticles.integration.test.ts` 17 通过（含未登录/CSRF/非法 body/40410/40900/40901/草稿与已下线删除/翻译级联/公开列表不受影响）；admin typecheck、lint、build 通过。
- **刻意未做**：上传、发布/下线、AuditLog 写入。未 commit/push。
- **下一步：A5.2 / B9.3.2 封面上传契约与存储设计（只设计）**。

```text
日期时间：2026-09-22
阶段及目标：A5.1 / B9.3.1 受限文章删除
修改文件与原因：契约与 OpenAPI、后端 DELETE、BFF/客户端白名单、文章列表删除确认
执行的验证命令、工作目录、结果：backend openapi/typecheck/lint + adminArticles 集成测试 17 通过；admin typecheck/lint/build 通过
未验证内容及原因：未跑真实账号浏览器自动化；桌面/390px 按模板与响应式样式核对
当前阻碍/已知问题：无
新增设计决策：硬删除仅 DRAFT/ARCHIVED；删除不产生 BuildEvent；A6 再写 AuditLog
Git 状态：未 commit/push
下一步最小可执行任务：A5.2 / B9.3.2 封面上传契约与存储设计
```

## 2026-09-22 — A5.2 / B9.3.2 封面上传契约与存储设计（只设计）

- 新增设计文档 `docs/admin/MEDIA_UPLOAD_DESIGN.md`：审查现行 `cover_image`（仅 `/logo.svg`、`/images/`）、BFF raw body、无 multipart、公开站相对路径渲染与 Cloudflare/R2 目标态。
- 契约定稿：`POST /api/admin/media/images`（multipart `file`）；≤5 MiB；JPEG/PNG/WebP 魔数校验；服务端重编码 WebP；最长边 2048；服务端随机 key；禁 SVG；返回 `MediaAsset` DTO。
- 存储：`StorageAdapter`；本地 `.data/media`（已在根 gitignore）+ `GET /media/*`；生产 Cloudflare R2；凭据仅后端；`MEDIA_PUBLIC_BASE_URL` 前缀约束公开 URL。
- 建议 A5.3 追加 `MediaAsset` 迁移；删文/换封面不立即删对象；孤儿定时清理。BFF：白名单、约 6 MiB 体上限、上传超时约 60s。新增业务码 `41300`。手动可信 URL 可保留编辑。
- `ADMIN_CONTRACT` / `admin-openapi`（11 paths / 14 ops）已同步；校验脚本已更新。
- **验证**：`pnpm openapi:validate:admin` 通过。未安装依赖、未改数据库、未写上传实现。
- **刻意未做**：A5.3 实现。未 commit/push。
- **下一步：A5.3 / B9.3.3 封面上传实现与管理端联调**。

```text
日期时间：2026-09-22
阶段及目标：A5.2 / B9.3.2 封面上传契约与存储设计（只设计）
修改文件与原因：MEDIA_UPLOAD_DESIGN、ADMIN_CONTRACT、admin-openapi、校验脚本与文档导航
执行的验证命令、工作目录、结果：backend 目录 openapi:validate:admin 通过（11 paths, 14 operations）
未验证内容及原因：本阶段不实现上传，无集成测试/构建要求
当前阻碍/已知问题：无
新增设计决策：统一 WebP；MediaAsset 表；R2+本地适配器；cover_image 可信基址；不立即删对象
Git 状态：未 commit/push
下一步最小可执行任务：A5.3 / B9.3.3 封面上传实现与管理端联调
```

## 2026-09-22 — A5.0～A5.2 复盘与媒体存储确认

- 截图中的 `row.version` 已确认有完整定义：Prisma `Article.version`、追加迁移、生成的 Prisma Client、`ArticleFullRow` 推导类型及 DTO 均包含该字段；后端 typecheck/lint 通过。红线属于 VS Code TypeScript/Prisma 缓存，不修改正确代码。
- A5.0 错误分轨与局部重试实现合理。A5.1 删除的后端状态/版本约束和测试覆盖合理；复盘修正删除失败时确认弹窗仍遮挡列表错误条的问题，现在先关闭 Dialog，再聚焦持久内联错误。
- A5.2 存储方案确认：本地对象写入 `nuxt-content-platform-backend/.data/media/covers/...`；生产对象写入 Cloudflare R2 Standard，公开读取使用自定义媒体域名，例如 `https://media.example.com/covers/...`。`r2.dev` 只用于开发测试。
- 收紧媒体 URL 设计：实现时使用 URL 解析比较 protocol/origin/path 边界，不能只做 `startsWith`；随机 key 永不覆盖并使用长期 immutable 缓存。公开站绝对图片已走原生 img，SEO URL 解析会保留绝对地址，无需 Nuxt Image 远程域白名单。
- 修正文档验收状态：上传成功为 HTTP 201，与 OpenAPI 一致。
- **验证**：backend typecheck/lint、admin ESLint/Nuxt typecheck、`git diff --check` 通过。下一步仍为 A5.3；尚未创建 R2 bucket 或写入任何媒体文件。

## 2026-09-22 — 管理文章新增/编辑 40301 修复

- 截图中的新增、编辑失败并非字段契约问题：读请求可用、写请求统一返回 `40301 请求来源校验失败`，定位为管理站 Origin 与后端默认白名单不一致。
- 后端开发默认值及 `.env.example` 同时允许 `http://localhost:3670`、`http://127.0.0.1:3670`；本机 `.env` 已同步，需重启后端进程后生效。生产环境仍须显式配置实际管理站 HTTPS Origin，不开放通配符。
- 清理 `.env.example` 中残留的本地数据库口令和管理员示例密码，全部替换为占位值；真实 `.env` 继续由根忽略规则排除。
- **验证**：后端单元测试 30 项、主/seed TypeScript、ESLint 通过；管理端 Nuxt typecheck、ESLint 通过。因当前 `pnpm` 运行时尝试无 TTY 重装依赖，验证改用项目本地 bin，未改依赖。
- **手工验证待办**：重启后端，重新登录管理端，再测试新建草稿和编辑保存。

### 40301 二次定位：CSRF 轮换后的旧页面写入

- 重启并重新登录后仍可复现；截图确认请求来自允许的 `http://localhost:3670`，因此排除 Origin 白名单，实际为页面内存 CSRF 与后端当前会话哈希不一致。
- 原因边界：`GET /api/admin/auth/session` 会轮换 CSRF；另一标签页、SSR 会话恢复或同名旧 Cookie 可能让已打开页面持有旧 token。读接口只校验会话，因而表现为列表/详情正常、所有写操作 40301。
- 管理端 `useAdminAuth` 新增 `withCsrfRetry`：写请求首次遇到 40301 时强制恢复一次当前会话，并用最新 CSRF 仅重试一次；403 在数据库写入前发生，因此不会造成重复新增。文章新增、编辑、删除均接入，后续上传/发布可复用。
- **验证**：管理端 Nuxt typecheck、ESLint、生产构建通过。构建仅有既有 Nuxt 依赖 DEP0155 警告。仍需浏览器重新测试新增与编辑；管理端开发服务器通常可热更新，无需再次重启后端。

## 2026-09-22 — A5.3 / B9.3.3 复盘与上传区视觉收尾

- A5.3 主链路复盘通过：上传经管理端同源 BFF 固定白名单；BFF 限制约 6 MiB/60 秒；后端校验登录、Origin、CSRF，按魔数识别 JPEG/PNG/WebP，限制 5 MiB/像素量/最长边并重编码 WebP；随机不可覆盖 key；本地磁盘与 R2 适配；元数据入库失败时补偿删除对象；公开本地路由限制 `covers/` 并拒绝路径穿越。
- 管理端封面区域重新布局为「固定比例预览 + 集中操作 + 封面地址」：上传和恢复默认封面并排，格式提示归入操作区，预览不再脱离字段；无有效预览时显示占位；小屏缩小预览并隐藏次要后缀。
- 将后端代码/测试中的本地媒体兜底地址抽为 `DEFAULT_MEDIA_PUBLIC_BASE_URL`，管理端 Nuxt 配置也使用命名常量；环境示例和 OpenAPI 中作为配置示例的地址保留明文。
- **验证**：后端单元测试 33 项、集成测试 61 项、主/seed TypeScript、ESLint、管理 OpenAPI 校验全部通过；管理端 Nuxt typecheck、ESLint、生产构建通过。公开站 ESLint 通过；公开站 Nuxt typecheck 被既有内容快照来源保护拦截（要求先 `prepare:content`），未为本阶段改写构建快照。
- **已知边界**：上传后未保存文章会成为待清理孤儿，按 A5.2 设计留给后续定时清理；未配置真实 R2 凭据，因此本轮验证本地存储适配器，R2 为静态审查。
- **下一步**：浏览器复查桌面/窄屏封面区与上传保存闭环；随后进入 A6 / B9.4 发布、下线与构建事件。

## 2026-09-22 — A5.3 / B9.3.3 封面上传实现与管理端联调

- 按 A5.2 契约实现：`MediaAsset` 迁移；`POST /api/admin/media/images`（multipart `file`，HTTP 201）；sharp 魔数校验 + 统一重编码 WebP；服务端随机 `covers/yyyy/mm/{uuid}.webp` key；禁 SVG / 路径穿越 / 用户指定 key。
- `StorageAdapter`：本地写入 `nuxt-content-platform-backend/.data/media/`（根 `.gitignore` 已忽略 `.data/`）+ 受控 `GET /media/*`；生产 R2 适配器读私有环境变量。DB 写入失败会补偿删除本次对象。
- `cover_image` 可信 URL：URL 解析比较 protocol/origin/path 前缀，保留 `/logo.svg`、`/images/` 与手动可信媒体 URL 编辑。
- 管理端：BFF 白名单 `POST media/images`（6 MiB / 60s）、`uploadCoverImage`（credentials + CSRF + `withCsrfRetry`）、`ArticleFormModal` Naive Upload（预览/进度/失败重试/移除；成功写入返回 URL 并提示「图片已上传，文章仍未保存」）。
- **验证**：backend `typecheck`/`lint`；单元 33 + 集成 61（含 media 6 项）；`openapi:validate` + `openapi:validate:admin`；admin `typecheck`/`lint`/`build`；web 真实模式 `NUXT_CONTENT_API_USE_REAL=true` 下 `prepare:content`（articles=5）+ `typecheck` + `build` 通过。无真实 R2 凭据，仅验证本地适配器。管理端无独立前端单测框架；上传成功/失败/重试/预览由 UI 实现覆盖。
- **刻意未做**：A6 发布/下线、孤儿定时清理任务、真实 R2 bucket。未 commit/push。
- **下一步：A6 / B9.4 发布、下线与公开预览闭环**。

```text
日期时间：2026-09-22
阶段及目标：A5.3 / B9.3.3 封面上传实现与管理端联调
修改文件与原因：MediaAsset 迁移、imagePipeline/StorageAdapter/上传路由、BFF multipart、uploadCoverImage、ArticleFormModal Upload、契约/OpenAPI/STATUS
执行的验证命令、工作目录、结果：backend test+openapi+typecheck+lint；admin typecheck/lint/build；web 真实模式 prepare+typecheck+build 通过
未验证内容及原因：无真实 R2 凭据未测生产适配器；浏览器手工上传联调待用户本地确认
当前阻碍/已知问题：无
新增设计决策：沿用 A5.2；Nitro 体上限经 hook + NITRO_MAX_REQUEST_BODY_SIZE + BFF maxBodyBytes 三重约束
Git 状态：未 commit/push
下一步最小可执行任务：A6 / B9.4 发布、下线与公开预览闭环
```

## 2026-09-22 — A6 / B9.4 发布、下线与公开预览闭环

- 追加迁移 `AuditLog`、`BuildEvent`（QUEUED outbox）。
- 实现 `POST` publish/unpublish：42200 完整性校验；40901 状态冲突；40900 版本冲突；同事务写审计与 BuildEvent；不调用 GitHub/Cloudflare。
- 修改已发布文章写 `ARTICLE_UPDATED`；删除补 `ARTICLE_DELETED` 且不写 BuildEvent。
- 管理端发布/下线确认、预览链接、等待站点部署文案。
- **验证**：backend typecheck/lint；单元 33 + 集成 65；`openapi:validate:admin`；admin typecheck/lint/build 通过。
- **刻意未做**：A7。未 commit/push。
- **下一步：A7 / B9.5**。

```text
日期时间：2026-09-22
阶段及目标：A6 / B9.4 发布、下线与公开预览闭环
修改文件与原因：AuditLog/BuildEvent、publish/unpublish、管理端发布 UI、契约/STATUS
执行的验证命令、工作目录、结果：backend test+typecheck+lint+openapi；admin typecheck/lint/build 通过
未验证内容及原因：浏览器手工联调待确认；未接外部构建
当前阻碍/已知问题：无
新增设计决策：发布不等于部署；BuildEvent 仅排队
Git 状态：未 commit/push
下一步最小可执行任务：A7 / B9.5 GitHub Actions 构建触发与部署状态
```

## 2026-09-22 — A6 / B9.4 P1：已发布文章完整性保护

- 修复已发布文章可被保存为空翻译、随后从公开接口消失但状态仍为 `PUBLISHED` 的一致性问题。
- 更新已发布文章前，对作者、可信封面以及三种语言的标题和清理后正文执行发布完整性校验；不满足时返回 `42200`，事务内不修改文章、翻译、审计日志或构建事件。
- 管理契约与 OpenAPI 已同步 `PUT /api/admin/articles/{id}` 的约束和 422 响应。
- 新增集成回归：验证拒绝不完整更新、文章版本与英文正文保持不变、事件数量不变，公开详情仍可访问。
- **验证**：`adminArticles.integration.test.ts` 22/22 通过；后端类型、ESLint、管理 OpenAPI 与差异检查见本阶段最终验证。
- **范围**：本次只处理复盘清单中的 P1；P2/P3 建议仍留待后续任务。

## 2026-09-22 — A6 / B9.4 P2：发布重放语义与列表操作错误状态

- 统一发布命令语义为“副作用幂等”：完全重放首次发布请求时，旧 `version` 返回 `40900`；对已发布文章携带当前 `version` 再次发布返回 `40901`。两种情况都不递增版本、不重复写 `AuditLog` 或 `BuildEvent`。
- OpenAPI 将“发布或重新发布文章”改为“发布文章”；契约用“已下线文章再次发布”区分合法再次发布和同状态重复发布。
- 集成测试同时覆盖两种重复请求，并断言发布事件和发布审计始终各一条。
- 管理端文章列表将被发布、下线、删除共同复用的 `deleteError` / `deleteErrorAlertRef` 更名为 `actionError` / `actionErrorAlertRef`；每项操作开始和成功后清除旧错误，避免错误状态名称与来源不符。
- **验证**：文章管理集成测试 22/22、管理 OpenAPI 校验、管理端 Vue TypeScript 与目标页面 ESLint 均通过。
- **范围**：未改变发布/下线接口业务行为，未处理其余 P2/P3 建议。

## 2026-09-23 — A6 / B9.4 P3：公开入口名称澄清

- 管理端文章列表的“预览”改为“查看资讯页”；编辑弹窗的“公开预览”改为“查看资讯页”。
- 提示明确该链接展示当前公开站内容，本次发布或修改仍需等待部署后才会更新，避免把数据库发布误解为线上部署成功。
- 只调整界面名称和说明，链接生成与打开行为不变；部署成功后展示真实线上入口留给 A7。

## 2026-09-23 — A7 / B9.5 构建触发、部署状态与失败重试

- 后端新增部署列表、详情和失败重试接口；重试仅允许 `FAILED`，复用原 `BuildEvent` 与幂等键并写 `BUILD_RETRIED` 审计。
- 新增独立构建 worker：默认等待 120 秒合并连续内容事件，领取主事件后调用 GitHub `workflow_dispatch`；其余事件标记 `SKIPPED` 并指向主事件。worker 后续轮询 Actions，把真实运行 ID、可信运行链接和 `SUCCEEDED/FAILED` 写回数据库。
- GitHub Token 只存在后端 worker 环境变量，浏览器与 Nitro BFF 不接触部署密钥；错误摘要会裁剪并移除 URL。
- 管理端 `/deployments` 已从占位页改为真实列表，显示状态、原因、文章版本、次数、时间、错误摘要和 GitHub 运行入口；失败记录支持 CSRF 保护的重新排队。
- 新增 `.github/workflows/content-deploy.yml`：北京时间每天 01:00、手动和 worker 触发；依次执行真实内容模式 typecheck、Nuxt build、SSR/SEO/sitemap 审计，全部成功后部署 Cloudflare Pages，失败时不会覆盖旧站。
- 配置与运行说明见 `docs/admin/DEPLOYMENT_PIPELINE.md`。本地没有真实 GitHub/Cloudflare 凭据，本阶段不声称已经完成线上部署。
- **验证**：后端主/seed TypeScript 与 ESLint通过；单元测试 33/33、集成测试 67/67；管理 OpenAPI 12 paths / 15 operations；管理端 TypeScript、ESLint 与生产构建通过；worker dry-run 成功且未调用外部服务。管理端构建仅出现 Nuxt 4.0.3 依赖既有 DEP0155 警告。
- **未验证**：没有真实 GitHub Token、Cloudflare Pages 项目和公网后端地址，因此未执行真实 workflow dispatch、Actions 状态轮询或 Pages 部署。
- 推送后配置保护：工作流增加仓库变量 `DEPLOY_ENABLED == true` 才执行，避免配置完成前的凌晨任务失败；worker 默认 ref 与当前 GitHub 默认分支统一为 `master`。
