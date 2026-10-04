# syntax=docker/dockerfile:1
ARG NODE_BUILD_BASE=node:22-slim
ARG STUDIO_RUNTIME_BASE=supabase/studio:2026.09.07-sha-7996410
FROM ${NODE_BUILD_BASE} AS builder
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends git python3 ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.13.1
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 TURBO_TELEMETRY_DISABLED=1 \
    STUDIO_FRAMEWORK=next NEXT_PUBLIC_IS_PLATFORM=false \
    SKIP_ASSET_UPLOAD=1 FORCE_ASSET_CDN=-1 NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=6144
COPY . /translation
RUN node /translation/scripts/verify.mjs \
    && node /translation/scripts/prepare-source.mjs /source
WORKDIR /source
RUN pnpm dlx turbo@2.9.14 prune studio --docker --out-dir=/pruned
WORKDIR /work/app
RUN cp -a /pruned/json/. . \
    && cp /pruned/pnpm-lock.yaml ./pnpm-lock.yaml \
    && mkdir -p patches && cp -a /source/patches/. patches/ \
    && node /translation/scripts/configure-build.mjs /work/app --workspace-only \
    && pnpm install --frozen-lockfile --ignore-scripts --prod=false
RUN cp -a /pruned/full/. . \
    && node /translation/scripts/configure-build.mjs /work/app \
    && node /translation/scripts/apply-dependency-locales.mjs /work/app
ARG STUDIO_PUBLIC_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${STUDIO_PUBLIC_URL} \
    NEXT_PUBLIC_GOTRUE_URL=${STUDIO_PUBLIC_URL}/auth/v1
WORKDIR /work/app/apps/studio
RUN node node_modules/next/dist/bin/next build --webpack
RUN node /translation/scripts/assemble-runtime.mjs /work/app /runtime

FROM ${STUDIO_RUNTIME_BASE} AS runtime
WORKDIR /app
RUN rm -rf /app/apps/studio/.next /app/node_modules /app/packages
COPY --from=builder /runtime/ /app/
COPY --from=builder /translation/LICENSE /translation/NOTICE /translation/THIRD_PARTY_NOTICES.md /app/studio-ru-notices/
COPY --from=builder /translation/licenses/ /app/studio-ru-notices/licenses/
ENV PORT=3000 NEXT_PUBLIC_IS_PLATFORM=false
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/platform/profile').then(r=>{if(r.status!==200)throw new Error(r.status)})"
CMD ["node", "apps/studio/server.js"]
