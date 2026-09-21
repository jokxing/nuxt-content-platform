-- 固定演示库需要长期存在一条未来计划；真实环境应由内容管理流程维护。
UPDATE `dataset_schedules`
SET `scheduled_at` = '2099-09-19 16:00:00.000'
WHERE `period_code` = '2026091';
