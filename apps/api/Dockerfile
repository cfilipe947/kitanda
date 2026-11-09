# Dockerfile de desenvolvimento simples. Na Fase 8 passa a multi-stage de produção.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3333
CMD ["node", "dist/server.js"]
