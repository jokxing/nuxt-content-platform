# 项目文档导航

本目录是 Nuxt 全栈脱敏改造的交接入口。先读当前状态，再按计划推进，不能把计划当作已完成实现。

文档按用途分为三部分：

- `frontend/`：前端审查、架构、SEO、Mock、部署、验证截图及前端 AI 接手提示词。
- `backend/`：后端接口契约、OpenAPI、MySQL 准备和后端逐项提示词。
- 当前目录：整个项目共用的状态、实施计划和本导航。

前端入口：[前端导览与简短问答](./frontend/FRONTEND_GUIDE.md)。

后端入口（2026-09-19，设计阶段）：[第一批接口与模型](./backend/BACKEND_CONTRACT.md)、[Apifox 导入文件](./backend/openapi.json)、[每次一个任务的提示词](./backend/BACKEND_HANDOFF_PROMPTS.md)、[MySQL 准备说明](./backend/MYSQL_SETUP.md)。先执行 B1，后续任务逐项交付。

1. [当前状态与交接记录](./STATUS.md)
2. [实施顺序与验收标准](./IMPLEMENTATION_PLAN.md)
3. [前端文档目录](./frontend/)
4. [后端文档目录](./backend/)

每次结束开发前更新 STATUS.md，记录修改、验证结果、剩余问题和下一步。前端导览与问答集中维护在 FRONTEND_GUIDE.md；后端架构与接口确定后再补充对应说明，避免重复文档或提前编写与实现不符的内容。
