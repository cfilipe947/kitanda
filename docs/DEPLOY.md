# Deploy

Passos manuais (precisam da tua conta — não posso fazer isto por ti).

## 1. Base de dados + API (Render)

1. Cria uma conta em https://render.com e liga o repositório do GitHub.
2. **New → PostgreSQL**: nome `kitanda-db`, região à tua escolha, plano Free. Depois de criada,
   copia o "Internal Database URL".
3. **New → Web Service**, liga ao repositório, e configura:
   - **Root Directory**: deixa vazio (o Dockerfile usa a raiz do monorepo como contexto).
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Health Check Path**: `/api/v1/health`
   - **Environment Variables**:
     | Variável | Valor |
     |---|---|
     | `NODE_ENV` | `production` |
     | `DATABASE_URL` | o "Internal Database URL" do passo 2 |
     | `JWT_SECRET` | gera com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
     | `JWT_EXPIRES_IN` | `8h` |
     | `CORS_ORIGIN` | o domínio da Vercel (passo 2 abaixo) — dá para actualizar depois |
4. Deploy. O container corre `prisma migrate deploy` automaticamente antes de arrancar.
5. Depois do primeiro deploy, corre o seed uma vez via Render Shell (aba "Shell" do serviço):
   ```
   cd apps/api && npx prisma db seed
   ```

## 2. Frontend (Vercel)

1. Cria uma conta em https://vercel.com e importa o mesmo repositório.
2. **Root Directory**: `apps/web`
3. **Build Command**: `npm run build` (a Vercel já detecta o Vite)
4. **Environment Variables**:
   | Variável | Valor |
   |---|---|
   | `VITE_API_URL` | `https://<o-teu-serviço>.onrender.com/api/v1` |
5. Deploy. Depois, volta ao Render e actualiza `CORS_ORIGIN` para o domínio que a Vercel te deu.

## Credenciais de demonstração

Depois do seed (passo 1.5): `admin@kitanda.ao` / `admin123`.

## Alternativa: Railway em vez de Render

Os passos são equivalentes — Railway também lê o `apps/api/Dockerfile`, só muda a interface.
