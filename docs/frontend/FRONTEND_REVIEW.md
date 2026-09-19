# 2.3 前端脱敏收尾与优化建议

日期：2026-09-18。范围：仅前端 Mock 项目；未实施后端、数据库或部署，未操作 Git、原项目或其他作品。

## 结论

**2026-09-18 剩余三个 P2 更新：清理与部署方案已落实。** 删除有引用证据的废弃组件/图片/统计代码及三个直接依赖，增加通用数据转换层并整理 Store/分组命名。部署目标明确为 Node/Nitro；独立临时目录运行产物通过验证。Docker 配置已整理但本机无 Docker，容器构建/运行未验收。详见 [P2_CLEANUP.md](./P2_CLEANUP.md)、[DEPLOYMENT.md](./DEPLOYMENT.md)。

**2026-09-18 P2 API 入口与 SSR 隔离更新：已处理。** 页面统一通过应用内 contentApi 调用本地 Nitro API，移除旧模块级 HTTP 单例、接口目录初始化和无引用 Store；并发隔离、页面与 SEO 回归通过。设计与清理依据见 [API_CLIENT.md](./API_CLIENT.md)。

**2026-09-18 P2 SEO 响应更新：已处理。** useSeo、首页/分类页和 JSON-LD 按路由/语言响应更新，统一 siteUrl；28 次客户端切换及 6 个 SSR 页面验证通过，详情 schema 离页清除。具体边界见 [SEO_REACTIVITY.md](./SEO_REACTIVITY.md)。

**2026-09-18 P2 路由与 sitemap 更新：已完成共享内容目录，并同时移除构建正则改写配置。** 预渲染保留 75 条，sitemap 为三语 39 条；XML 解析、目录边界测试、lint、typecheck、构建及生产 HTTP 验证通过。设计与后续真实接口接入边界见 [ROUTES_AND_SITEMAP.md](./ROUTES_AND_SITEMAP.md)。

**2026-09-18 剩余三个 P1 更新：已完成。** 三语移动/桌面浏览器回归、基于同源历史数据的统计筛选、分页边界均已落实。修复语言初始化、预渲染串语言、详情返回来源、历史期次选项、重复刷新和图表末组边界。统计口径与复现步骤见 [MOCK_DATA_CONTRACT.md](./MOCK_DATA_CONTRACT.md)，浏览器证据见 [browser-review](./browser-review/)。以下较早段落为历史验证结果，不代表当前未完成项。实体手机、Safari、位图 IPX 和部署尚未验证。

**2026-09-18 规则优化更新：全量 lint 已通过（0 errors / 0 warnings）。** 保留正确性检查，取消纯排序偏好及外部文档格式强制；仅自动修复 layout 类问题，处理 JsonLd 空模板和脚本 process 导入。typecheck、生产构建、43 项本地生产 HTTP/API 回归均通过。构建仍提示 Windows sharp 二进制缺失及依赖弃用：SVG 演示路径通过不代表任意位图 IPX 转换已验证。浏览器视觉、交互及完整网络抓包仍待做。详细规则见 LINT_POLICY.md，下方历史错误数保留作基线。

**2026-09-18 15:15 更新：CookieConsent P1 已处理。** 当前无统计或营销追踪，已移除组件及 app.vue 挂载，不展示无效授权开关，不再默认写入“同意全部”，也不再解析旧 cookie-consent。旧键留在浏览器但没有消费者，不清空其他偏好。类型检查通过；全量 lint 降为 285 errors、4 warnings，vue/no-parsing-error 为 0。下方 383 errors 是此前收尾基线。本次未重跑生产构建或浏览器回归。

逐页记录 2.2-1～15 齐全。本轮执行全局脱敏收尾并修复类型与构建阻断，适合作为继续完善的 Mock 演示基线。不能称为全部质量门禁通过：lint 仍失败，浏览器交互、移动端视觉及浏览器网络抓包尚未验证。

## 已处理

| 问题 | 修复与依据 |
| --- | --- |
| 旧生产脚本虽默认禁用，仍可通过环境变量恢复原接口与部署操作 | scripts 下旧 JS/SH 入口改为退役提示并退出，移除 package.json 的旧监听/部署及自动 push 入口；sitemap 命令改为本地生成器 |
| public sitemap/robots 仍指向旧站 | sitemap 本地重新生成，robots 改为禁止抓取，无旧域名 |
| 三语语言包残留原品牌和业务 SEO | 将含旧业务的兼容 SEO 分支替换为现有通用资讯 SEO；保留键避免动态引用断裂，补 site.name/description |
| NewsMainTabs 的模板内事件类型注解阻断类型检查 | 将事件处理移到 script 中，兼容 Vant 的 string/number 参数 |
| 文章封面可返回 null、Mock 正则捕获值可能为空、GA Window 类型缺失 | 收窄空值，声明 no-op 类型，保持不加载 GA |
| 首页冗余请求兜底造成 Nitro 类型推导栈溢出 | 统一使用现有 getLatestResult 入口；移除无效语言比较 |
| SVG 封面触发 IPX 转 WebP 500，生产预渲染失败 | OptimizedImage 对 SVG 使用原生 img；src 变化重置加载状态，位图保留原方案 |
| useSchema 在 SSR 中引用 window | 使用 runtimeConfig 解析完整 URL；useSeo 统一站点来源并修正英文 hreflang |
| 全局结构化数据声明不存在的搜索服务和示例联系方式 | 移除 app.vue 对应 SearchAction、地址和电话，避免虚构服务 |
| 不存在的文章页面返回 HTTP 200 | SSR 根据文章请求错误返回 404/503，保留现有错误界面 |
| 环境文件忽略与项目说明缺失 | 忽略 .env 系列但保留 .env.example；重写前端 README，保留 LICENSE；清理不存在的 profile 路由白名单 |

## 验证与证据

工作目录：`nuxt-content-platform-web`。

- `npm run typecheck`：修复后通过。
- `npm run build`：修复 SVG 后完成 75 条预渲染及 Nitro 服务构建；保留 Node DEP0155 依赖弃用警告，未借此扩大依赖升级范围。
- `node scripts/check-demo.mjs`：43 项本地生产服务路由/API 场景通过，包含三语首页/资讯/统计/工具页、404、旧详情跳转，以及 15 次文章列表/详情内容一致性检查。
- 源码/公开资源扫描：未发现运行配置、语言包、public 和旧脚本中的原站域名、原站品牌或旧统计 ID；检查脚本本身有用于拦截的关键词，不能视为泄漏。此扫描不等于完整秘密审计或图片 OCR。
- `eslint . --format json --output-file lint-review.log`：383 errors、4 warnings，未通过。报告为被忽略的本地日志，不将报告 JSON 放在源码目录参与 lint，避免自扫描产生误报。
- 没有运行可用的浏览器自动化环境：未验证真实点击、滚动恢复、水合警告、移动端截图与浏览器完整请求记录。HTTP/SSR 回归不能替代这些检查。
- 原始日志：前端目录 `typecheck-review.log`、`build-review.log`、`lint-review.log`；这些日志不应提交 Git。

## 优化与建议清单（按优先级）

| 优先级 | 建议 | 依据与验收 |
| --- | --- | --- |
| 已处理 | 简化 CookieConsent | 移除无效组件与挂载；无统计/营销授权弹窗、自动同意、gtag consent 调用或旧 JSON 解析。语言、主题、返回状态存储保留；不增加新的提示弹窗。浏览器其他存储使用点不属于本次修复范围 |
| 已处理 | 优化规则与清理 lint | 保留正确性规则，取消纯偏好排序与外部格式化；layout 自动修复，JsonLd 空模板修正；生成路由保留尾逗号，避免构建后 lint 回退。全量 0 errors / 0 warnings |
| 已处理（P1） | 三语移动端浏览器回归 | Edge 下 375/390/1280 宽度、72 页面场景；筛选/图表和连续交互通过。覆盖分类/详情、历史分页、空/失败恢复、404、主题、倒计时、返回位置；未发现运行/水合错误或浏览器外部请求 |
| 已处理（P1） | Mock 统计筛选语义 | 三类统计统一根据 120 条合成历史记录计算；验证 10/20/30/50/100 窗口及样本上限。推荐组合仍为明确标注的固定演示样例 |
| 已处理（P1） | Mock 分页参数边界 | 共用正整数校验，非法值 400；合法过大页大小截断、越界页为空。90 个非法参数场景及合法边界通过，另验证 14 个 HTTP 400 场景 |
| 已处理（P2） | 路由与 sitemap 共用一份内容目录 | content-directory.ts 从 Mock 已发布文章派生三语路由；sitemap 排除重定向及资讯筛选路径，共 39 条。新增文章、草稿、日期/分类/重复校验通过 |
| 已处理（P2） | 构建不应正则改写 nuxt.config.ts | 配置直接导入纯目录函数；generate-routes 只读输出。构建前后配置哈希一致，重复生成 sitemap 字节一致 |
| 已处理（P2） | SEO 随路由/语言响应更新 | useSeo 返回 computed head，动态调用方传 getter；canonical/alternate/标题/OG/JSON-LD 更新，统一配置域名。三语连续导航和实际语言选择器通过，无旧文章 schema 残留 |
| 已处理（P2） | 清理无效图片和组件 | 引用扫描及人工查看后删除 NowPlay.vue、playnow.png、旧 icon-16x16.png；当前在用图标/内容占位图保留。移除空统计插件与无调用价值的统计代码 |
| 已处理（P2） | API 数据入口与 SSR 实例隔离 | 页面统一 useContentApi；Nuxt 插件按应用创建 transport/client，SSR/浏览器都调用 Nitro Mock。移除旧单例与目录初始化；40 个工厂并发调用、24 个实际 SSR 并发请求及页面回归通过 |
| 已处理（P2） | 清理兼容命名与多余依赖 | 增加发布/分组 DTO 转换，Store 改为 dataset，界面与图表用通用命名；接口兼容字段保留。移除 nuxt-gtag、sitemap、node-fetch 直接依赖并同步锁文件，Vue 保持 3.5.16 |
| 已处理（P2；Docker 未实测） | 明确部署形态 | 明确完整 .output 的 Node/Nitro 部署，独立目录启动验证通过；统一 build/start，整理多阶段、非 root Dockerfile 及环境文件排除。无 Docker 环境，容器验收单独列为限制 |

## 后续顺序

原清单 P1/P2 的前端实现与清理已完成。Docker 容器、实体设备和真实部署仍是未验证项；可在具备环境时补验，之后按用户安排进入后端契约设计。本轮未声明全部素材均经过 OCR 或全部兼容字段均已删除。
