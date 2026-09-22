-- A5.3/B9.3.3: MediaAsset 上传元数据（只追加，不改已应用迁移）

CREATE TABLE `media_assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(64) NOT NULL,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `size_bytes` INTEGER NOT NULL,
    `admin_user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `orphaned_at` DATETIME(3) NULL,

    UNIQUE INDEX `media_assets_key_key`(`key`),
    INDEX `media_assets_created_at_idx`(`created_at`),
    INDEX `media_assets_admin_user_id_idx`(`admin_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
