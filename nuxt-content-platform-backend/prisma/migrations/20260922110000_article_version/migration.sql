-- A4/B9.3: Article.version 乐观并发（只追加，不改已应用迁移）

ALTER TABLE `articles` ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;
