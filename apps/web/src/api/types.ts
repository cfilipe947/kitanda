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
