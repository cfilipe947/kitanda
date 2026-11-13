import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as demoService from './demo.service.js';

// Função em vez de um Router criado ao carregar o módulo: cada createApp() fica com o seu
// próprio contador de rate limit (nos testes, várias apps não partilham o mesmo limite).
export function createDemoRoutes() {
  const demoRoutes = Router();

  // Cada pedido apaga e recria a loja inteira: sem limite, alguém podia martelar este
  // endpoint e manter a base de dados ocupada só com resets.
  const demoRateLimit = rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiadas tentativas, tenta novamente dentro de instantes', details: [] },
    },
  });

  // Público de propósito: é o botão "Experimentar a demo" da landing page.
  // Só é montado quando DEMO_MODE=true (ver app.ts).
  demoRoutes.post('/start', demoRateLimit, async (_req, res) => {
    const result = await demoService.startDemo();
    res.json(result);
  });

  return demoRoutes;
}
