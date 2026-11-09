import { act, renderHook } from '@testing-library/react';
import { useCart } from './useCart';

const product = { id: 'p1', name: 'Arroz 1kg', priceCents: 85000, stockQuantity: 5 };

describe('useCart', () => {
  it('soma a quantidade ao adicionar o mesmo produto outra vez', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(product));
    act(() => result.current.addItem(product));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.quantity).toBe(2);
  });

  it('nunca deixa a quantidade passar do stock disponível', () => {
    const { result } = renderHook(() => useCart());

    for (let i = 0; i < 10; i++) {
      act(() => result.current.addItem(product));
    }

    expect(result.current.items[0]?.quantity).toBe(product.stockQuantity);
  });

  it('remove um item do carrinho', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(product));
    act(() => result.current.removeItem(product.id));

    expect(result.current.items).toHaveLength(0);
  });

  it('calcula o total em cêntimos', () => {
    const { result } = renderHook(() => useCart());
    const other = { id: 'p2', name: 'Feijão 1kg', priceCents: 95000, stockQuantity: 10 };

    act(() => result.current.addItem(product));
    act(() => result.current.setQuantity(product.id, 3));
    act(() => result.current.addItem(other));

    expect(result.current.totalCents).toBe(3 * 85000 + 95000);
  });

  it('setQuantity nunca deixa ir abaixo de 1 nem acima do stock', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(product));
    act(() => result.current.setQuantity(product.id, 0));
    expect(result.current.items[0]?.quantity).toBe(1);

    act(() => result.current.setQuantity(product.id, 999));
    expect(result.current.items[0]?.quantity).toBe(product.stockQuantity);
  });
});
