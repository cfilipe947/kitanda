# syntax=docker/dockerfile:1
#
# Contexto de build: a raiz do monorepo (ver docker-compose.yml e docs/ROADMAP.md).
# "prisma" é dependência de produção (não devDependency) de propósito: o CMD final
# corre "prisma migrate deploy" dentro do próprio container, por isso o CLI tem de
# existir também na imagem final.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/prisma.config.ts
RUN npm ci --workspace=apps/api --include-workspace-root
COPY apps/api apps/api
RUN npm run build -w apps/api

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/prisma.config.ts
RUN npm ci --workspace=apps/api --include-workspace-root --omit=dev
COPY --from=build /app/apps/api/dist apps/api/dist

WORKDIR /app/apps/api
EXPOSE 3333
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
