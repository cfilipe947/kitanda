import { formatKz } from './lib/format';

// Ecrã provisório. Fase 5: substituir pelas rotas da SPEC (login, painel, produtos, vendas...).
export function App() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Kitanda</h1>
      <p>Gestão de stock e vendas para pequenas lojas.</p>
      <p>Exemplo de preço: {formatKz(150000)}</p>
    </main>
  );
}
