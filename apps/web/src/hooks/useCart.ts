import { useMemo, useState } from 'react';

export type CartItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  stockQuantity: number;
};

type CartProduct = { id: string; name: string; priceCents: number; stockQuantity: number };

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(product: CartProduct) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQuantity) } : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unitPriceCents: product.priceCents,
          quantity: 1,
          stockQuantity: product.stockQuantity,
        },
      ];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stockQuantity)) } : item,
      ),
    );
  }

  function removeItem(productId: string) {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }

  function clear() {
    setItems([]);
  }

  const totalCents = useMemo(() => items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0), [items]);

  return { items, addItem, removeItem, setQuantity, clear, totalCents };
}
