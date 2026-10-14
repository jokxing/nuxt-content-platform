# 部署形态与运行说明

更新：2026-10-14。当前生产使用 Cloudflare Pages 托管预渲染产物并编译 functions 提供受限只读 API，Express / MySQL、管理端和 worker 在 Railway。配置与实际验证见[部署链路](../admin/DEPLOYMENT_PIPELINE.md)及[状态](../STATUS.md)。下方 Node 独立运行与 Docker 配置用于替代部署或本机验证，不代表当前生产拓扑；其中早期验证记录仅说明对应批次。

## Node 运行（本轮验证路径）

本机使用 Node 24.16.0、项目指定 pnpm 10.11.0。优先 `corepack pnpm`，避免全局 pnpm 版本不同导致锁文件变化。

```powershell
corepack pnpm install --frozen-lockfile
$env:NUXT_PUBLIC_SITE_URL = 'http://localhost:3000'
corepack pnpm build
$env:HOST = '127.0.0.1'
$env:PORT = '3000'
node .output/server/index.mjs
```

生产环境把 SITE_URL 换成正式外部地址（包括 https），由反向代理转发到 Node 端口。**构建和运行必须使用同一个外部站点地址**：预渲染 HTML 与 sitemap 已在构建时确定，运行时改环境变量不会重写旧产物。改域名或内容后需重新构建。

部署完整 `.output`，包含 server、其运行依赖和 public；不要只拷 HTML。`pnpm start` 是同一启动入口。已移除误导性的 build:homepage/build:statistics 别名和纯静态 generate 命令；保留 build、preview、start。

验证使用 `/api/latest` 作为 HTTP 健康探测，再检查三语页面、sitemap、未预渲染文章、筛选和翻页。项目不含进程守护/反向代理自动部署；正式环境由部署平台或服务管理器负责重启与日志收集。

本轮还通过 `node scripts/stage-runtime.mjs` 把产物复制到仓库外临时目录并启动 `node server/index.mjs`，验证运行不依赖源码目录。脚本检查依赖链接不指向产物之外，并重建 54 个内部链接；Windows 普通 Copy-Item -Recurse 会跟随循环 junction，不能直接用它复制该产物。临时验证完成后已停止服务并清理测试副本。

## Docker 配置（未实测容器）

本轮环境没有 Docker CLI/daemon，不能声称镜像已成功构建或运行。Dockerfile 已整理为独立的构建/运行阶段：

- 默认 Node 24 bookworm-slim，pnpm 固定 10.11.0；复制配置与源码后再安装，确保 nuxt prepare 可读取实际配置。
- frozen-lockfile 安装、跳过 Git hooks；运行镜像只复制 .output，使用非 root node 用户。
- 明确 HOST、PORT、生产模式、健康检查；SITE_URL 构建参数同时用于构建与运行默认值。
- .dockerignore 排除全部 .env.*（仅保留无密钥示例）、Git、依赖、缓存、产物和日志。
- Node 镜像目前锁定主版本，非 digest 固定。需要更严格复现时用 NODE_IMAGE 构建参数传经验证的镜像 digest。

有 Docker 的机器上执行以下验收后，才可标为容器部署通过：

```sh
docker build --build-arg SITE_URL=http://localhost:3000 -t contentpulse-web:demo .
docker run --rm --name contentpulse-web -p 127.0.0.1:3000:3000 contentpulse-web:demo
# 另开终端查看状态和执行 HTTP/浏览器检查
docker inspect --format='{{.State.Health.Status}}' contentpulse-web
```

不可把 Windows 构建的 .output 当作 Linux 镜像构建输入；镜像会在 Linux 阶段自己安装和构建。当前 Windows sharp 提示与 Linux 容器能力不能混为一谈，位图转换仍需单独验收。

## 数据、收录与后续后端

当前 Mock 没有持久化，容器不需要数据库/数据卷；示例文件不带公司凭据。robots/noindex 保持禁止收录，不会因为有 sitemap 就自动开放收录。本轮没有上传或发布服务。

后端阶段先确定真实接口和认证契约，再决定 Nitro 代理后端或浏览器访问受控 API；不能只修改 USE_MOCK 就宣称已接真实服务。构建内容目录需要一次完整发布快照，数据库迁移和发布触发器在后端阶段实施。
