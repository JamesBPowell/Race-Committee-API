import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
    colorTheme?: 'cyan' | 'indigo';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
    rounded?: 'full' | 'xl' | 'md';
}

export default function Button({
    children,
    variant = 'primary',
    colorTheme = 'cyan',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    rounded = 'xl',
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    let variantClasses = '';
    switch (variant) {
        case 'primary':
            variantClasses = colorTheme === 'indigo' ? 'btn-primary-indigo' : 'btn-primary-cyan';
            break;
        case 'secondary':
            variantClasses = 'btn-secondary';
            break;
        case 'ghost':
            variantClasses = 'btn-ghost';
            break;
        case 'danger':
            variantClasses = 'btn-danger';
            break;
        case 'gradient':
            variantClasses = 'btn-gradient';
            break;
    }

    const finalClasses = `btn-base ${fullWidth ? 'w-full' : ''} ${rounded === 'full' ? 'rounded-full' : rounded === 'xl' ? 'rounded-xl' : 'rounded-md'} ${size === 'sm' ? 'px-4 py-2 text-sm' : size === 'md' ? 'px-6 py-2.5' : 'px-6 py-3.5 text-lg'} ${variantClasses} ${className}`;

    return (
        <button className={finalClasses} disabled={disabled || isLoading} {...props}>
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {!isLoading && children}
        </button>
    );
}
