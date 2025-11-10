import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          'w-full rounded-lg border bg-white px-4 py-2 text-gray-900 transition-colors',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          {
            'border-gray-300 focus:border-blue-500 focus:ring-blue-500': !error,
            'border-red-300 focus:border-red-500 focus:ring-red-500': error,
          },
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
