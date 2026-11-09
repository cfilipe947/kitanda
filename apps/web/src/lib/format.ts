const kzFormatter = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' });

/** Converte cêntimos (inteiro vindo da API) para texto em Kwanzas. Ex.: 150000 → "1 500,00 Kz" */
export function formatKz(cents: number): string {
  return kzFormatter.format(cents / 100);
}
