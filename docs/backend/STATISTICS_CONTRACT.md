# 统计接口契约（B8）

状态：B8.1～B8.8 已实现。全部接口采用 `{ code, msg, data }` 成功外壳、数字业务码、13 位 Unix 毫秒时间戳及 `Route → Controller → Service → Prisma` 分层。前端统计 Mock 使用同一外壳，页面只经 `useContentApi` 解包；真实模式由 Nitro 白名单代理，失败不回退 Mock。

## 1. 数据模型

`DatasetPeriod` 表示一期已发布数据：`periodCode`、`releasedAt`、`value1～value6`、`extraValue`、状态和审计时间。七个值均为 1～49 且互不重复。公开查询只读取 `PUBLISHED` 且 `releasedAt <= now` 的记录。

`DatasetSchedule` 只保存下一次计划发布的 `periodCode`、`scheduledAt`、状态和审计时间。`GET /api/latest` 选择最早的未来 `SCHEDULED` 记录；没有计划时 `next_release=null`。

索引为 `periodCode` 唯一索引、`(status, releasedAt, id)` 统计窗口索引及 `(status, scheduledAt)` 计划索引。数据库 CHECK 与种子校验共同保证值域和互异性。

## 2. 公共规则

- 成功：`{ code: 0, msg: "ok", data: T }`；失败复用 ErrorEnvelope 和 requestId。
- latest 没有可见期次时返回 HTTP 404 / `40402 DATASET_NOT_FOUND`；统计没有样本时 HTTP 200，实际 `period=0`。
- query 未知、重复、数组、空值均为 HTTP 400 / 40000。整数只接受标准十进制正整数字符串。
- 统计窗口按 `releasedAt DESC, id DESC` 截取；请求 `period` 默认 10，范围 1～120。响应包含 `requested_period` 和实际 `period`。
- 七个值参与频次、尾数、奇偶、相邻和遗漏统计；`top_combinations` 只使用前六个普通值。
- 百分比为 0～100 的 number，保留两位；相同频次按值或组合字典序升序。

## 3. GET /api/latest

无 query。返回 `period_code`、`released_at`、六项 `values`、`extra_value` 与可空的 `next_release`。`next_release` 含 `period_code` 和 `scheduled_at`。

## 4. GET /api/history

参数：`page` 默认 1、最大 1000000；`page_size` 默认 20、最大 100；`year` 为 2000～2100 的香港日历年；`period_code` 精确匹配期次；`number` 匹配任一七个值；`periods` 在其他过滤后限制最新 1～120 条再分页。

返回 `{ items, total, page, page_size, total_pages, filter_options }`。每个 item 与 latest 的期次字段一致，但不含 `next_release`。`filter_options.years` 为可见年份降序数组，`filter_options.period_codes` 为最新 120 个可见期次编码，两者不受当前筛选影响。空集合的 `total_pages=1`。

## 5. GET /api/analysis

- `hot_numbers`：出现次数降序前五。
- `cold_numbers`：出现次数升序前五，包括零次。
- `rising_numbers`：从最新一期开始连续出现的期数。
- `duplicate_numbers`：同一期至少两个值具有相同尾数时，该尾数累计一次。
- `consecutive_numbers`：每期去重升序后，相差 1 的相邻值对频次。

## 6. GET /api/advanced-stats

- `tail_distribution`：固定键 0～9。
- `group_distribution`：固定键 G01～G12，公式 `(number - 1) % 12 + 1`。
- `odd_even_ratio`：奇偶计数及比例。
- `consecutive_analysis`：含相邻值的期次数、比例及组合频次。
- `top_combinations`：每期前六个值的完整组合频次，最多五项。

## 7. GET /api/number-miss

有样本时固定返回 1～49 的 `current_miss / max_miss / avg_miss / most_freq_miss / max_streak`。未命中段包含窗口两端截断段以及连续命中之间的零间隔；众数并列时取较小值。

## 8. GET /api/demo-combinations

参数只有 `lang`。返回固定、可复现的 `featured` 和五项 `items`，并明确包含 `source="fixed_demo"`、`is_generated=false`、固定 `generated_at`。该接口不读取统计表、不调用外部模型，也不根据刷新随机生成。

## 9. 实现边界

- 最多读取 120 行后在纯函数中计算，暂不增加缓存、队列或预聚合表。
- 三个统计接口保持独立；共享窗口查询和纯函数，不使用通用 Controller 工厂。
- 集成测试使用高位探测 periodCode 并在结束后清理。
- B8.8 已统一前端 DTO、香港时区格式化和 Mock 成功外壳；历史筛选读取 `filter_options`；首页与工具页共用 `demo-combinations`。
