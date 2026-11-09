import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http';
import type { Role } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { useCreateUser, useUsers } from '../../hooks/useUsers';

export function UsersPage() {
  const usersQuery = useUsers();
  const createUser = useCreateUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CASHIER');
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setRole('CASHIER');
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createUser.mutateAsync({ name, email, password, role });
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o utilizador.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Utilizadores</h1>
        <Button onClick={() => setIsModalOpen(true)}>Novo vendedor</Button>
      </div>

      {usersQuery.isLoading && <Loading />}
      {usersQuery.isError && <ErrorState onRetry={() => usersQuery.refetch()} />}

      {usersQuery.data && (
        <Table
          rowKey={(user) => user.id}
          columns={[
            { header: 'Nome', cell: (user) => user.name },
            { header: 'Email', cell: (user) => user.email },
            { header: 'Papel', cell: (user) => (user.role === 'ADMIN' ? 'Administrador' : 'Vendedor') },
          ]}
          rows={usersQuery.data.data}
        />
      )}

      <Modal title="Novo vendedor" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
              Papel
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="CASHIER">Vendedor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? 'A criar...' : 'Criar'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
