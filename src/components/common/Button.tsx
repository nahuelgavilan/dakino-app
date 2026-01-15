import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition-all duration-200 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        {
          // Variants
          'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-colored-primary':
            variant === 'primary',
          'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500':
            variant === 'secondary',
          'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500':
            variant === 'success',
          'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500':
            variant === 'error',
          'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500':
            variant === 'warning',
          'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-300':
            variant === 'ghost',

          // Sizes
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',

          // Width
          'w-full': fullWidth,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Cargando...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
