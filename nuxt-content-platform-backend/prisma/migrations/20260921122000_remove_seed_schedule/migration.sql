-- 发布计划属于运行时业务数据，固定种子会随时间失效或制造不真实的远期倒计时。
DELETE FROM `dataset_schedules` WHERE `period_code` = '2026091';
