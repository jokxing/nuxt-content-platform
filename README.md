# Nuxt Content Platform

多语言资讯与数据展示作品，包含 Nuxt 公开站、文章管理端、Express / Prisma / MySQL API 和构建 worker。原前端由作者从 0 到 1 独立开发；后续由作者完成脱敏及全栈扩展，使用 Cursor/AI 辅助实现、排障与部署。

原项目部署同样由作者负责，通过宝塔面板脚本实现定时构建和文章发布后自动构建；当前仓库采用 worker 与 GitHub Actions 等方案重新组织发布链路，两个阶段的具体实现分别说明。

## 给面试官

- [公开站](https://contentpulse-web.pages.dev/)：可直接浏览资讯、语言切换与统计页面。
- [项目导览与设计问答](docs/PROJECT_GUIDE.md)：推荐体验路线、个人贡献、架构和关键代码。
- 文章管理后台由作者按需演示，包含编辑、封面上传及构建状态，不公开管理员凭据。
- 源码访问按仓库实际授权提供；页面演示不赋予 GitHub 或云平台管理权限。

当前已部署 Railway API、MySQL、管理端及 worker，Cloudflare R2 保存封面，Pages 承载公开站及只读 API Function。文章更新事件闭环和真实定时工作流已有验收证据；其他场景及时间边界见导览，不宣称准点调度或全部路径已公网验收。

## 工程与文档

| 目录 | 用途 |
| --- | --- |
| nuxt-content-platform-web | Nuxt 公开站、预渲染、SEO 与 Pages Function |
| nuxt-content-platform-admin | Nuxt / Naive UI 管理端及同源 BFF |
| nuxt-content-platform-backend | Express API、Prisma 模型与独立构建 worker |
| .github/workflows | GitHub Actions 构建与部署 |

[文档导航](docs/README.md)提供各端运行与接口说明；[部署链路](docs/admin/DEPLOYMENT_PIPELINE.md)介绍配置和状态机；[当前状态](docs/STATUS.md)集中说明实际验证和边界。
