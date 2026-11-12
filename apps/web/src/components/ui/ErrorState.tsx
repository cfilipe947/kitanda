import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

type ErrorStateProps = { message?: string; onRetry?: () => void };

export function ErrorState({ message = 'Não foi possível carregar os dados.', onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-danger-50 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-danger-600">
        <AlertTriangle aria-hidden="true" className="h-6 w-6" />
      </span>
      <p className="text-sm text-neutral-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
