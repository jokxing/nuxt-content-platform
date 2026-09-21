-- 公开作品只保留中性的期次和值；删除没有通用内容平台含义的金额及层级字段。
ALTER TABLE `dataset_periods`
  DROP CHECK `dataset_periods_amounts_nonneg_chk`,
  DROP COLUMN `total_amount`,
  DROP COLUMN `tier1_count`,
  DROP COLUMN `tier1_amount`,
  DROP COLUMN `tier2_count`,
  DROP COLUMN `tier2_amount`,
  DROP COLUMN `tier3_count`,
  DROP COLUMN `tier3_amount`;

ALTER TABLE `dataset_schedules`
  DROP CHECK `dataset_schedules_estimated_amount_nonneg_chk`,
  DROP COLUMN `estimated_amount`;

-- 新公开项目不保留旧业务分类别名，现有开发库同步迁移为通用 slug。
UPDATE `categories` SET `slug` = 'getting-started' WHERE `slug` = 'how-to-play';
UPDATE `categories` SET `slug` = 'feature-notes' WHERE `slug` = 'play-desc';
UPDATE `categories` SET `slug` = 'current-insights' WHERE `slug` = 'this-predict';
UPDATE `categories` SET `slug` = 'metric-rules' WHERE `slug` = 'tema-rule';
UPDATE `categories` SET `slug` = 'platform-updates' WHERE `slug` = 'lottery-news';
UPDATE `categories` SET `slug` = 'user-stories' WHERE `slug` = 'win-story';
