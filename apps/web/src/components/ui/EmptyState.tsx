export function EmptyState({ message = 'Nada para mostrar.' }: { message?: string }) {
  return <div className="py-12 text-center text-sm text-slate-500">{message}</div>;
}
