import { render, screen } from '@testing-library/react';
import { App } from './App';
import { formatKz } from './lib/format';

describe('App', () => {
  it('mostra o nome do sistema', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Kitanda' })).toBeInTheDocument();
  });
});

describe('formatKz', () => {
  it('converte cêntimos para Kwanzas', () => {
    const text = formatKz(150000);
    expect(text).toContain('1');
    expect(text).toContain('500,00');
  });
});
