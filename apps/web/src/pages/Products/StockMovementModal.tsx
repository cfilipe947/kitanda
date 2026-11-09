import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAddStockMovement } from '../../hooks/useProducts';

type Props = { productId: string; isOpen: boolean; onClose: () => void };

export function StockMovementModal({ productId, isOpen, onClose }: Props) {
  const addStockMovement = useAddStockMovement(productId);
  const [type, setType] = useState<'IN' | 'ADJUSTMENT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setType('IN');
    setQuantity('');
    setReason('');
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity === 0 || (type === 'IN' && parsedQuantity <= 0)) {
      setError(type === 'IN' ? 'A quantidade tem de ser positiva.' : 'A quantidade não pode ser zero.');
      return;
    }

    try {
      await addStockMovement.mutateAsync({ type, quantity: parsedQuantity, reason: reason || undefined });
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registar o movimento.');
    }
  }

  return (
    <Modal title="Entrada de stock" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="movement-type" className="mb-1 block text-sm font-medium text-slate-700">
            Tipo
          </label>
          <select
            id="movement-type"
            value={type}
            onChange={(event) => setType(event.target.value as 'IN' | 'ADJUSTMENT')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="IN">Entrada</option>
            <option value="ADJUSTMENT">Ajuste (quebra, inventário...)</option>
          </select>
        </div>
        <Input
          label={type === 'IN' ? 'Quantidade' : 'Quantidade (negativa para reduzir)'}
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />
        <Input label="Motivo (opcional)" value={reason} onChange={(event) => setReason(event.target.value)} />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={addStockMovement.isPending}>
          {addStockMovement.isPending ? 'A guardar...' : 'Guardar'}
        </Button>
      </form>
    </Modal>
  );
}
