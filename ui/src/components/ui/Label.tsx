import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: React.ReactNode;
    required?: boolean;
}

export function Label({ children, required, className = '', ...props }: LabelProps) {
    return (
        <label className={`label-text ${className}`} {...props}>
            {children}
            {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
    );
}
