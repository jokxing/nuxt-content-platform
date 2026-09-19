# 项目文档导航

本目录是 Nuxt 全栈脱敏改造的交接入口。先读当前状态，再按计划推进，不能把计划当作已完成实现。

面试阅读：[前端导览与简短问答](./FRONTEND_GUIDE.md)，含五个主题的页面入口、源码链接和设计取舍。

1. [当前状态与交接记录](./STATUS.md)
2. [实施顺序与验收标准](./IMPLEMENTATION_PLAN.md)
3. [可复制的 AI 接手及设计提示词](./AI_HANDOFF_PROMPTS.md)
4. [源码审查与 Mock 约定](./source-audit.md)（2.0 产出）
5. [2.3 收尾检查与优化建议](./FRONTEND_REVIEW.md)（包含未通过检查及验证边界）
6. [前端 ESLint 规则约定](./LINT_POLICY.md)
7. [路由与 sitemap 共享目录](./ROUTES_AND_SITEMAP.md)
8. [SEO 响应更新与验收](./SEO_REACTIVITY.md)
9. [API 入口与 SSR 实例隔离](./API_CLIENT.md)
10. [剩余 P2 清理依据](./P2_CLEANUP.md)
11. [Node 部署与 Docker 验证边界](./DEPLOYMENT.md)

每次结束开发前更新 STATUS.md，记录修改、验证结果、剩余问题和下一步。前端导览与问答集中维护在 FRONTEND_GUIDE.md；后端架构与接口确定后再补充对应说明，避免重复文档或提前编写与实现不符的内容。
