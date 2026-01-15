import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gradient?: boolean;
  hover?: boolean;
}

export const Card = ({ children, gradient = false, hover = false, className, ...props }: CardProps) => {
  return (
    <div
      className={clsx(
        'rounded-xl p-6 transition-all duration-200',
        {
          'bg-white shadow-lg': !gradient,
          'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-colored-primary': gradient,
          'hover:shadow-xl hover:-translate-y-1 cursor-pointer': hover,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
