# 资讯管理后台文档

管理端项目目录固定为 `nuxt-content-platform-admin`，与 `nuxt-content-platform-web`、`nuxt-content-platform-backend` 共用根 Git 仓库，不在子项目中重新初始化 Git。

技术方向：Nuxt + TypeScript + Naive UI。后台用于完成资讯草稿、三语编辑、发布与下线闭环；不复制原公司后台，不扩展为通用低代码、多租户或复杂权限平台。文章新建和编辑统一在 `/articles` 列表页的表单弹窗完成，不建立独立的新建/编辑路由。

执行入口：[ADMIN_HANDOFF_PROMPTS.md](./ADMIN_HANDOFF_PROMPTS.md)。提示词必须一次只执行一段，完成验证并更新 `docs/STATUS.md` 后停止。管理端文字契约见 [ADMIN_CONTRACT.md](./ADMIN_CONTRACT.md)，可导入 Apifox 的机器契约见 [admin-openapi.json](./admin-openapi.json)。封面上传设计见 [MEDIA_UPLOAD_DESIGN.md](./MEDIA_UPLOAD_DESIGN.md)。

当前状态：**A5.0～A5.2 已完成**（错误态、受限删除、上传契约设计）。封面上传**实现**尚未开始；发布/下线与自动构建尚未实现。下一步执行 **A5.3 上传实现联调**，之后再进入 A6。
