-- CreateTable
CREATE TABLE `dataset_periods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `period_code` VARCHAR(32) NOT NULL,
    `released_at` DATETIME(3) NOT NULL,
    `value_1` INTEGER NOT NULL,
    `value_2` INTEGER NOT NULL,
    `value_3` INTEGER NOT NULL,
    `value_4` INTEGER NOT NULL,
    `value_5` INTEGER NOT NULL,
    `value_6` INTEGER NOT NULL,
    `extra_value` INTEGER NOT NULL,
    `total_amount` DECIMAL(18, 2) NULL,
    `tier1_count` INTEGER NULL,
    `tier1_amount` DECIMAL(18, 2) NULL,
    `tier2_count` INTEGER NULL,
    `tier2_amount` DECIMAL(18, 2) NULL,
    `tier3_count` INTEGER NULL,
    `tier3_amount` DECIMAL(18, 2) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dataset_periods_period_code_key`(`period_code`),
    INDEX `dataset_periods_status_released_at_id_idx`(`status`, `released_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dataset_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `period_code` VARCHAR(32) NOT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `estimated_amount` DECIMAL(18, 2) NULL,
    `status` ENUM('SCHEDULED', 'CANCELLED', 'PUBLISHED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dataset_schedules_period_code_key`(`period_code`),
    INDEX `dataset_schedules_status_scheduled_at_idx`(`status`, `scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Database CHECKs Prisma cannot express: value range 1–49, seven distinct values, non-negative amounts/counts
ALTER TABLE `dataset_periods`
  ADD CONSTRAINT `dataset_periods_value_range_chk` CHECK (
    `value_1` BETWEEN 1 AND 49
    AND `value_2` BETWEEN 1 AND 49
    AND `value_3` BETWEEN 1 AND 49
    AND `value_4` BETWEEN 1 AND 49
    AND `value_5` BETWEEN 1 AND 49
    AND `value_6` BETWEEN 1 AND 49
    AND `extra_value` BETWEEN 1 AND 49
  ),
  ADD CONSTRAINT `dataset_periods_values_distinct_chk` CHECK (
    `value_1` <> `value_2`
    AND `value_1` <> `value_3`
    AND `value_1` <> `value_4`
    AND `value_1` <> `value_5`
    AND `value_1` <> `value_6`
    AND `value_1` <> `extra_value`
    AND `value_2` <> `value_3`
    AND `value_2` <> `value_4`
    AND `value_2` <> `value_5`
    AND `value_2` <> `value_6`
    AND `value_2` <> `extra_value`
    AND `value_3` <> `value_4`
    AND `value_3` <> `value_5`
    AND `value_3` <> `value_6`
    AND `value_3` <> `extra_value`
    AND `value_4` <> `value_5`
    AND `value_4` <> `value_6`
    AND `value_4` <> `extra_value`
    AND `value_5` <> `value_6`
    AND `value_5` <> `extra_value`
    AND `value_6` <> `extra_value`
  ),
  ADD CONSTRAINT `dataset_periods_amounts_nonneg_chk` CHECK (
    (`total_amount` IS NULL OR `total_amount` >= 0)
    AND (`tier1_count` IS NULL OR `tier1_count` >= 0)
    AND (`tier1_amount` IS NULL OR `tier1_amount` >= 0)
    AND (`tier2_count` IS NULL OR `tier2_count` >= 0)
    AND (`tier2_amount` IS NULL OR `tier2_amount` >= 0)
    AND (`tier3_count` IS NULL OR `tier3_count` >= 0)
    AND (`tier3_amount` IS NULL OR `tier3_amount` >= 0)
  );

ALTER TABLE `dataset_schedules`
  ADD CONSTRAINT `dataset_schedules_estimated_amount_nonneg_chk` CHECK (
    `estimated_amount` IS NULL OR `estimated_amount` >= 0
  );
