import { type SelectHTMLAttributes, type ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export const Select = ({
  label,
  icon,
  error,
  className = '',
  children,
  ...props
}: SelectProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
          {props.required && <span className="text-primary-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none z-10">
            {icon}
          </div>
        )}

        <select
          className={`
            w-full px-4 py-4
            ${icon ? 'pl-12' : 'px-4'}
            border-2 border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-900
            text-neutral-900 dark:text-neutral-100
            rounded-2xl
            focus:border-primary-500 focus:outline-none
            text-lg font-medium
            transition-colors
            appearance-none cursor-pointer
            ${error ? 'border-red-500 dark:border-red-400' : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-neutral-400 dark:text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};
