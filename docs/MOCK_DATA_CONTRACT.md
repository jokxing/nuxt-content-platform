# Mock 数据口径与 P1 回归

2026-09-18。当前只提供本地演示数据，不是真实运营数据、AI 推理或预测服务。

## 数据与统计

- `app/mock/data/catalog.ts` 保留原先 8 条演示记录，追加 112 条确定性合成记录，共 120 条；文章仍为 101～105。
- analysis、advanced-stats、number-miss 共用这份历史数据，按最新记录截取 period；默认 10。响应的 period 是实际样本量，requested_period 是请求量，超过数据量最多取 120 条。
- 每期包含 6 个普通指标和 1 个附加指标，共 7 个不同的 1～49 整数。冷热频率统计全部 7 个，频率相同时按指标编号升序；连续出现统计从最新记录往前的连续命中数。
- 同尾频率是一期至少两个指标尾数相同的期数；相邻组合按一期中每对差值为 1 的指标计数。
- 高级统计包括尾数、奇偶、相邻组合和 G01～G12 分组。分组公式为 `(number - 1) % 12 + 1`，只是演示分类。高频组合按 6 个普通指标排序后的完整集合统计，不是所有子集。
- 遗漏统计只描述当前窗口：current_miss 为最近连续未出现期数；max_miss、avg_miss、most_freq_miss 基于窗口内未出现段，包含窗口两端截断段，以及连续命中之间的零间隔；众数并列取较小值。max_streak 为连续命中最大值。不能据此推断窗口以外的间隔。
- 热力图最后一组只有 41～49；遗漏区间增加 66+，避免较长遗漏超出坐标轴。
- 推荐组合仍是明确标注的固定演示样例，不随统计筛选生成预测。

## 分页约定

- page 默认 1；history 默认每页 20、最多 100；articles 默认每页 10、最多 50。
- 仅省略参数时使用默认值。page、page_size、兼容 limit 必须是 1～1,000,000 的十进制正整数；空串、0、负数、小数、NaN、Infinity、数组、null 及超过上限的值报 400。
- 合法但超过接口每页上限的大小会被截到上限。page_size 优先于 limit；越界页返回空数组，保留筛选后的 total。空集合 total_pages 为 1，以兼容当前组件。
- 历史页先筛选年份、期次、指标、最近期数，再分页；期次选项从演示数据生成。表单选择后点击查询生效。

## 复现验证

在 `nuxt-content-platform-web` 运行：

```powershell
pnpm lint
pnpm typecheck
pnpm exec tsx scripts/check-mock.ts
pnpm build
$env:HOST = '127.0.0.1'
$env:PORT = '4372'
node .output/server/index.mjs
```

另开终端运行：

```powershell
$env:DEMO_CHECK_URL = 'http://127.0.0.1:4372'
node scripts/check-demo.mjs
# 指向本机已有的 Playwright 模块；未安装时需要先准备 Playwright 和 Edge。
$env:PLAYWRIGHT_MODULE = 'E:/project/tenantadmin/node_modules/playwright'
node scripts/check-browser.mjs
node scripts/check-interactions.mjs
```

本轮只读取已有 Playwright 安装，不改其所在项目；没有给作品新增测试依赖或锁文件变更。换机器需调整模块路径，或自行安装 Playwright 后不设置 PLAYWRIGHT_MODULE。浏览器脚本仅接受 localhost/127.0.0.1 目标。

- check-mock：120 条数据、五种统计窗口、统计总量/遗漏不变量、90 个非法分页场景及合法边界。
- check-demo：43 项生产 HTTP/API 回归。
- check-browser：三语 × 375/390/1280 宽度 × 8 页面，共 72 个页面场景；9 组筛选与图表交互，检查水合、缺失翻译、运行错误、横向溢出及浏览器外部请求；断言首页正文语言。
- check-interactions：三语下倒计时、主题、详情往返、滚动恢复、历史筛选/分页、模拟失败与空列表恢复。
- 结果与截图保存在 [browser-review](./browser-review/)。截图是 Edge 无头浏览器视口模拟，不代替 iOS Safari 或实体手机验收。请求检查范围为这些浏览器场景，不代表全站所有代码路径或服务器出站流量审计。

多语言回归修复了 URL 语言被初始化插件覆盖，以及预渲染共用数据键串语言的问题。语言相关 useAsyncData 键包含 locale；Vant 语言包跟随当前语言。当前仍保留兼容 API 字段名，后续 DTO 统一属于 P2。
