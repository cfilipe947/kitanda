-- AlterTable: adiciona a coluna como opcional, faz o backfill a partir do
-- custo actual do produto e só depois torna-a obrigatória (há vendas antigas
-- a preencher — ver docs/SPEC.md §3).
ALTER TABLE "SaleItem" ADD COLUMN     "costCentsAtSale" INTEGER;

UPDATE "SaleItem" si
SET "costCentsAtSale" = p."costCents"
FROM "Product" p
WHERE p.id = si."productId";

ALTER TABLE "SaleItem" ALTER COLUMN "costCentsAtSale" SET NOT NULL;
