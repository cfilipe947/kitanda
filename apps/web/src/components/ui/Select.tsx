import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
};

export function Select({ label, error, id, className = '', required, children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          required={required}
          className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-9 text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 disabled:bg-neutral-100 disabled:text-neutral-400 ${
            error ? 'border-danger-500' : 'border-neutral-300'
          } ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        />
      </div>
      {error && (
        <p id={`${selectId}-error`} role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
