# Kitanda

> Gestão de stock e vendas para pequenas lojas e cantinas: API REST segura + painel em React.

![CI](https://github.com/SEU-UTILIZADOR/kitanda/actions/workflows/ci.yml/badge.svg)

**Demo:** _(em breve)_ · **Credenciais de demonstração:** _(em breve)_

## Funcionalidades
- Produtos, categorias e entradas de stock, com alerta de stock baixo
- Registo de vendas (dinheiro, Multicaixa, transferência) com actualização automática do stock
- Painel com vendas do dia/mês, gráfico de vendas e produtos mais vendidos
- Dois papéis: administrador e vendedor

## Stack
| Camada | Tecnologias |
|--------|-------------|
| Backend | Node.js, TypeScript, Express 5, PostgreSQL, Prisma, Zod, JWT, bcrypt |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, Recharts |
| Qualidade | Vitest, Supertest, Testing Library, ESLint, GitHub Actions |
| Infra | Docker, Docker Compose, Render/Railway, Vercel |

## Como correr localmente

```bash
cp .env.example .env && cp .env.example apps/api/.env
npm install
docker compose up -d db
npm run dev
```

- API: http://localhost:3333/api/v1/health
- Web: http://localhost:5173

## Estrutura
```
apps/api   backend (REST)
apps/web   frontend (React)
docs/      especificação e roteiro
```

---
Feito por **Cesénio Filipe**: [LinkedIn](https://linkedin.com/in/cesénio-filipe-003b78319)
