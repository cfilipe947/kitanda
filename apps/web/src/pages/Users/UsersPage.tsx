import { UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http';
import type { Role } from '../../api/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { SkeletonTableRows } from '../../components/ui/Skeleton';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { useCreateUser, useUsers } from '../../hooks/useUsers';

export function UsersPage() {
  const usersQuery = useUsers();
  const createUser = useCreateUser();
  const { showToast } = useToast();
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
      showToast('Utilizador criado com sucesso.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o utilizador.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold text-neutral-900">Utilizadores</h1>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<UserPlus className="h-4 w-4" />}>
          Novo vendedor
        </Button>
      </div>

      {usersQuery.isLoading && <SkeletonTableRows columns={3} />}
      {usersQuery.isError && <ErrorState onRetry={() => usersQuery.refetch()} />}

      {usersQuery.data && (
        <Table
          rowKey={(user) => user.id}
          columns={[
            { header: 'Nome', cell: (user) => user.name },
            { header: 'Email', cell: (user) => user.email },
            {
              header: 'Papel',
              cell: (user) => (
                <Badge tone={user.role === 'ADMIN' ? 'info' : 'neutral'}>
                  {user.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                </Badge>
              ),
            },
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
          <Select label="Papel" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="CASHIER">Vendedor</option>
            <option value="ADMIN">Administrador</option>
          </Select>
          {error && (
            <p role="alert" className="text-sm text-danger-600">
              {error}
            </p>
          )}
          <Button type="submit" isLoading={createUser.isPending}>
            {createUser.isPending ? 'A criar...' : 'Criar'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
