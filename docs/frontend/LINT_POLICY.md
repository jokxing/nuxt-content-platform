# 前端 ESLint 规则约定

更新：2026-09-18。配置入口：`nuxt-content-platform-web/eslint.config.ts`。

## 目标

保留正确性检查，统一基本代码格式，不强制与功能无关的排列偏好。不用关闭语法/模板规则来掩盖实际问题。

## 保留

- Nuxt 与 Antfu 提供的 JS/TS、Vue 语法和组件用法检查。
- 未使用变量/导入等质量规则；类型正确性另由 `pnpm typecheck` 验证。
- 基本缩进、空格、换行、引号与分号规范，交给自动修复，不手工耗时调整。
- 属性名采用 `as-needed`：普通名称不强制引号，`@context`、带连字符等仍正确加引号。

## 精简

- 不强制导入、具名导入和具名导出的排序。
- 不强制 UnoCSS 类名/属性的排列顺序。
- 不强制顶层函数必须使用 function 声明。
- ESLint 不再承担 Markdown/JSON/CSS 等独立文档格式化（关闭 Antfu formatters）；对应语法检查仍按配置适用范围执行。
- 保留现有 no-console 关闭设置，调试日志是否保留按用途判断。

## 操作

```sh
pnpm lint
pnpm exec eslint . --fix --fix-type layout
pnpm typecheck
pnpm build
```

优先使用只修复 layout 的命令，避免顺带删除导入或自动重写逻辑。`pnpm lint:fix` 是全类型自动修复，使用时需审阅结果。

生产构建后再跑 lint，防止生成脚本改写配置导致检查反复失败。新问题先判断实际错误、格式差异还是不适用规则；仅针对具体规则调整，不使用整文件禁用掩盖问题。

本次额外修复：JsonLd 的空模板改为隐藏且对辅助技术不可见的占位元素，head 数据生成逻辑保持原样；检查脚本显式导入 node:process。没有调整 API、Mock 数据或页面业务规则。
