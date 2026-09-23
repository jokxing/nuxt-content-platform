-- A6: AuditLog + BuildEvent outbox

CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_user_id` INTEGER NULL,
    `action` VARCHAR(64) NOT NULL,
    `entity_type` VARCHAR(64) NOT NULL,
    `entity_id` INTEGER NOT NULL,
    `entity_version` INTEGER NULL,
    `request_id` VARCHAR(128) NOT NULL,
    `ip_hash` CHAR(64) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_admin_user_id_idx`(`admin_user_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `build_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_type` ENUM('ARTICLE_PUBLISHED', 'ARTICLE_UPDATED', 'ARTICLE_UNPUBLISHED') NOT NULL,
    `reason` ENUM('article_published', 'article_updated', 'article_unpublished', 'dataset_published', 'schedule_updated', 'daily_schedule', 'manual') NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'QUEUED',
    `article_id` INTEGER NULL,
    `article_version` INTEGER NULL,
    `dedupe_key` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `next_attempt_at` DATETIME(3) NULL,
    `external_run_id` VARCHAR(128) NULL,
    `external_run_url` VARCHAR(500) NULL,
    `error_summary` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `build_events_dedupe_key_key`(`dedupe_key`),
    INDEX `build_events_status_next_attempt_at_idx`(`status`, `next_attempt_at`),
    INDEX `build_events_created_at_id_idx`(`created_at`, `id`),
    INDEX `build_events_article_id_idx`(`article_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
