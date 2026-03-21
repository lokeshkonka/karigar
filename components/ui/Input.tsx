import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="font-bold text-sm uppercase tracking-wider text-[#1a1a1a]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`px-4 py-3 bg-white border-neo text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-electricYellow focus:border-electricYellow transition-all ${className}`}
          {...props}
        />
        {error && (
          <span className="text-red font-bold text-xs mt-1 uppercase">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
