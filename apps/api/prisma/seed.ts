import { prisma } from '../src/lib/prisma.js';
import { DEMO_COUNTS, resetDemoData } from '../src/modules/demo/demo.service.js';

// Os dados padrão vivem em src/modules/demo/demo.service.ts, partilhados com o
// POST /demo/start: o seed e o botão "Experimentar a demo" criam exactamente a mesma loja.
async function main() {
  await prisma.$transaction((tx) => resetDemoData(tx), { timeout: 20_000, maxWait: 20_000 });
  console.log(
    `Seed concluído: 1 admin, ${DEMO_COUNTS.categories} categorias, ${DEMO_COUNTS.products} produtos, ${DEMO_COUNTS.sales} vendas.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
