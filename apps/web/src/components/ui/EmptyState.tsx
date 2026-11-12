import { PackageSearch } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ message = 'Nada para mostrar.', icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        {icon ?? <PackageSearch aria-hidden="true" className="h-6 w-6" />}
      </span>
      <p className="text-sm text-neutral-500">{message}</p>
      {action}
    </div>
  );
}
