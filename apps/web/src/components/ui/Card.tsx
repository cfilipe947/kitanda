import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
};

export function Card({ title, action, padded = true, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-heading text-lg font-semibold text-neutral-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
