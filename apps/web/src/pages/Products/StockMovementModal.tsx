import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useAddStockMovement } from '../../hooks/useProducts';

type Props = { productId: string; isOpen: boolean; onClose: () => void };

export function StockMovementModal({ productId, isOpen, onClose }: Props) {
  const addStockMovement = useAddStockMovement(productId);
  const { showToast } = useToast();
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
      showToast('Movimento de stock registado com sucesso.');
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registar o movimento.');
    }
  }

  return (
    <Modal title="Entrada de stock" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select label="Tipo" value={type} onChange={(event) => setType(event.target.value as 'IN' | 'ADJUSTMENT')}>
          <option value="IN">Entrada</option>
          <option value="ADJUSTMENT">Ajuste (quebra, inventário...)</option>
        </Select>
        <Input
          label={type === 'IN' ? 'Quantidade' : 'Quantidade (negativa para reduzir)'}
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />
        <Input label="Motivo (opcional)" value={reason} onChange={(event) => setReason(event.target.value)} />
        {error && (
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
        )}
        <Button type="submit" isLoading={addStockMovement.isPending}>
          {addStockMovement.isPending ? 'A guardar...' : 'Guardar'}
        </Button>
      </form>
    </Modal>
  );
}
