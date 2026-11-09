import type { Role } from '../generated/prisma/enums.js';

export type SafeUser = { id: string; name: string; email: string; role: Role; createdAt: Date };

// Nunca devolver passwordHash ao cliente (ver docs/SPEC.md §5).
export function toSafeUser(user: { id: string; name: string; email: string; role: Role; createdAt: Date }): SafeUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}
