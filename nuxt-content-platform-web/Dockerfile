# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24-bookworm-slim
FROM ${NODE_IMAGE} AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
ENV CI=true
ENV SKIP_INSTALL_SIMPLE_GIT_HOOKS=1
# Include Nuxt config and sources before postinstall (nuxt prepare).
COPY . .
RUN pnpm install --frozen-lockfile
ARG SITE_URL=http://localhost:3000
ENV NUXT_PUBLIC_SITE_URL=${SITE_URL}
RUN pnpm build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ARG SITE_URL=http://localhost:3000
ENV NUXT_PUBLIC_SITE_URL=${SITE_URL}
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/latest').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
