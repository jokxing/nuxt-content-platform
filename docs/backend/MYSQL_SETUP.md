# MySQL 准备说明

当前只做设计，不要求立即安装或连接数据库。用户先确认：是否已有 MySQL、版本、运行位置（本机/容器/服务器）、端口；不要在聊天中发送密码或完整连接串。已有 AI 多模态数据库不复用、不重置。

## 用户需要准备什么

1. 如已有可用 MySQL，先在自己的数据库工具执行 `SELECT VERSION();`。实现 AI 核对所选 Prisma 版本兼容性后再决定是否需要升级或另装实例，不在本轮强行指定最新版本。
2. 新建 content_platform_dev 业务开发库、content_platform_shadow 影子库，字符集 utf8mb4。影子库仅供开发迁移使用，其内容可能被清空；绝不能指向业务库或另一作品数据库。
3. 使用独立开发账号 content_platform_dev，只授权上述两个库。以下 SQL 是本机示例，由你在管理员数据库会话中逐条执行，把占位密码改成自己的；用户已存在时先检查，不用 DROP 重建。

```sql
CREATE DATABASE content_platform_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE content_platform_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'content_platform_dev'@'localhost' IDENTIFIED BY 'REPLACE_WITH_LOCAL_PASSWORD';
GRANT ALL PRIVILEGES ON content_platform_dev.* TO 'content_platform_dev'@'localhost';
GRANT ALL PRIVILEGES ON content_platform_shadow.* TO 'content_platform_dev'@'localhost';
```

这不是生产账号方案。后续生产运行账号仅授予业务所需权限，部署迁移使用独立账号。容器/远程数据库连接的 host 匹配与网络限制不同，不直接把 localhost 改成任意来源 `%`。

4. 后端环境文件由实现阶段提供模板，再在本机 `.env` 填值：

```dotenv
DATABASE_URL="mysql://content_platform_dev:URL_ENCODED_PASSWORD@127.0.0.1:3306/content_platform_dev"
SHADOW_DATABASE_URL="mysql://content_platform_dev:URL_ENCODED_PASSWORD@127.0.0.1:3306/content_platform_shadow"
```

密码中 @、:、/、# 等字符需要 URL 编码；原始密码只在自己电脑管理。变量如何接入 Prisma 配置由实施时确定的版本决定，不照抄旧项目 datasource 配置。禁止日志打印连接串。

## 不需要手动做的事情

- 不需要在数据库工具里手动创建 articles 等表；由 schema.prisma 和版本化迁移管理。
- 不需要导入公司 SQL 或 AI 多模态数据库。
- 不需要为了调试开放公网 3306。

## 交给实现 AI 的任务

先生成并审查迁移，确认连接的确实是上述专用开发库，再执行开发迁移和显式种子。不要默认执行 reset/db push 或接受可能丢数据的选项。迁移不可用时记录原因，不能把空数组伪装成数据库查询成功。

开发迁移需要影子数据库；配置的影子库必须与业务库不同。生产应用已提交迁移时使用对应版本的部署迁移流程，不执行 migrate dev。依据：[Prisma 影子数据库说明](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database)、[Prisma 数据库支持范围](https://docs.prisma.io/docs/orm/reference/supported-databases)。

当前没有安装 MySQL、创建用户/库、写入密码或执行任何迁移。
