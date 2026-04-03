import React, { forwardRef } from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', type = 'text', ...props }, ref) => {
        return (
            <input
                type={type}
                className={`input-field ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
