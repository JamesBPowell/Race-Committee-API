import React, { forwardRef } from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', type = 'text', ...props }, ref) => {
        return (
            <input
                type={type}
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
