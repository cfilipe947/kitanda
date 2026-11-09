export type Role = 'ADMIN' | 'CASHIER';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  priceCents: number;
  costCents: number;
  stockQuantity: number;
  minStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
};

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export type StockMovement = {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string };
};

export type ProductDetail = Product & { movements: StockMovement[] };

export type PaymentMethod = 'CASH' | 'MULTICAIXA' | 'TRANSFER';

export type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  product?: { id: string; name: string; sku: string };
};

export type Sale = {
  id: string;
  userId: string;
  totalCents: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  user?: { id: string; name: string };
};

export type SaleDetail = Sale & { items: SaleItem[] };
