# syntax=docker/dockerfile:1
#
# Contexto de build: a raiz do monorepo. VITE_API_URL fica embutido no bundle
# estático em tempo de build (o Vite não lê variáveis de ambiente em runtime).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace=apps/web --include-workspace-root
COPY apps/web apps/web
ARG VITE_API_URL=http://localhost:3333/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w apps/web

FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
