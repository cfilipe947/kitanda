const kzFormatter = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' });

/** Converte cêntimos (inteiro vindo da API) para texto em Kwanzas. Ex.: 150000 → "1 500,00 Kz" */
export function formatKz(cents: number): string {
  return kzFormatter.format(cents / 100);
}

/** Converte o valor de um <input type="number"> (sempre com ponto decimal) para cêntimos inteiros. */
export function parseKzToCents(value: string): number {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}
