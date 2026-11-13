# Deploy

API + PostgreSQL no **Railway**, frontend na **Vercel**. Passos manuais: precisam da tua conta.

## 1. Base de dados + API (Railway)

1. Em https://railway.com: **New Project → Deploy from GitHub repo** → `kitanda`.
2. No mesmo projecto: **+ Create → Database → PostgreSQL**.
3. No serviço da API:
   - **Settings → Source → Root Directory**: vazio (o Dockerfile usa a raiz do monorepo como contexto).
   - **Settings → Deploy → Custom Start Command**: **vazio**. Se tiver alguma coisa (ex. `npm start`),
     substitui o `CMD` do Dockerfile e as migrações deixam de correr ("table does not exist").
   - **Settings → Deploy → Healthcheck Path**: `/api/v1/health`
   - **Settings → Networking → Generate Domain**
   - **Variables**:
     | Variável | Valor |
     |---|---|
     | `RAILWAY_DOCKERFILE_PATH` | `apps/api/Dockerfile` |
     | `NODE_ENV` | `production` |
     | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referência ao serviço Postgres) |
     | `JWT_SECRET` | gera com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
     | `JWT_EXPIRES_IN` | `8h` |
     | `CORS_ORIGIN` | o domínio da Vercel, sem `/` no fim (passo 2) |
     | `DEMO_MODE` | `true` (demo pública: cada entrada repõe os dados padrão) |

     Não definas `PORT`: o Railway define-a e a API lê-a.
4. Deploy. O container corre `prisma migrate deploy` antes de arrancar. Confirma nos Deploy Logs
   e em `https://<domínio>/api/v1/health`.

### Dados de demonstração

Com `DEMO_MODE=true` não é preciso seed: o botão "Experimentar a demo" chama `POST /api/v1/demo/start`,
que cria (ou repõe) a loja de demonstração com o admin `admin@kitanda.ao` / `admin123`.

Para preencher a base de dados sem passar pela landing page (opcional), a partir do teu computador,
com o `DATABASE_PUBLIC_URL` do serviço Postgres (nunca o commits):

```bash
DATABASE_URL="<DATABASE_PUBLIC_URL>" npm run db:seed -w apps/api
```

Enquanto não existir nenhum utilizador, `POST /auth/register` está aberto e quem o chamar fica admin:
entra na demo (ou corre o seed) logo a seguir ao primeiro deploy.

## 2. Frontend (Vercel)

1. Em https://vercel.com: **Add New → Project** → importa `kitanda`.
2. **Root Directory**: `apps/web` (Framework: Vite, Build: `npm run build`, Output: `dist`).
3. **Environment Variables**: `VITE_API_URL` = `https://<domínio-railway>/api/v1`.
   O Vite embute este valor no build: se o mudares, faz **Redeploy**.
4. Deploy. O `apps/web/vercel.json` reencaminha todas as rotas para o `index.html`
   (sem isso, F5 em `/app/products` dá 404).
5. Volta ao Railway e põe em `CORS_ORIGIN` o domínio que a Vercel te deu.

Se a instalação falhar na Vercel (monorepo), usa como **Install Command**:
`cd ../.. && npm ci --workspace=apps/web --include-workspace-root`.
