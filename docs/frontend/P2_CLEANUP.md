# 剩余 P2 清理记录

2026-09-18。范围：无效图片/组件、兼容命名与直接依赖、部署形态。

## 删除与保留依据

- NowPlay.vue 无 import、模板标签或动态引用；唯一使用 public/images/playnow.png。人工查看确认是旧“立即玩”按钮，删除组件与图片。
- public/icon-16x16.png 无源码或 Nuxt head 引用；人工查看后删除旧微型图标。保留当前 favicon.svg/favicon.ico 与正在使用的内容占位图，不按文件名批量删除素材。
- Google Analytics 插件为 no-op；组合式函数唯一消费者是首页空上报调用。一起删除 useGoogleAnalytics、空插件、gtag 类型和首页调用；并删除直接依赖 nuxt-gtag。
- 当前 sitemap 是本项目纯函数生成器，未 import sitemap 包；脚本使用原生 fetch，没有 node-fetch import。移除这两个直接依赖并同步 pnpm-lock.yaml。它们是否作为其他依赖的传递包存在，不等于仍是本项目直接依赖。
- 使用 pnpm 10.11.0 更新锁文件。曾被解析器提升到 Vue 3.5.21，随后显式固定回原有 3.5.16，不借本轮清理升级 Vue。

## 命名与兼容边界

- 原 useLotteryStore 改为 useDatasetStore，状态为 nextRelease/date/number/target/time；倒计时与最新数据模块使用通用名称，删除乱码注释及无消费者的 latestResult 存储。
- `app/api/models.ts` 将 next_draw_date/next_draw_number/next_jackpot 转为发布模型，将 zodiac_distribution 转为 group_distribution。高级统计内部 key 和三语翻译 key 改为 group；图表计算值保持原接口含义。
- 底栏“立即玩/Play Now”改为“体验工具/Try Tools”，继续跳转原来的站内 pick 路径，没有恢复外链。
- API 的历史 draw_*、文章 category_slug 等仍为兼容字段；不机械全局改名破坏现有接口、文章分类和 Mock 检查。剩余兼容值不代表品牌或生产服务残留；后端契约确定后再迁移。

## 部署与验证边界

部署方式、命令和 Docker 边界见 [DEPLOYMENT.md](./DEPLOYMENT.md)。Node 服务为当前验收目标，Dockerfile 只是已整理的待实测配置；本机没有 Docker，不把未执行命令写成已通过。

本轮验证 lint、typecheck、生产构建、锁文件安装，复跑 API/统计/并发 SSR/SEO 及浏览器交互。具体结果以 STATUS.md 最新记录为准。没有做全部素材 OCR，也没有保证所有历史兼容字段均已改名。
