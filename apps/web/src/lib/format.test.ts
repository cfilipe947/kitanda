import { describe, expect, it } from 'vitest';
import { formatKz } from './format';

describe('formatKz', () => {
  it('converte cêntimos para Kwanzas', () => {
    const text = formatKz(150000);
    expect(text).toContain('1');
    expect(text).toContain('500,00');
  });
});
