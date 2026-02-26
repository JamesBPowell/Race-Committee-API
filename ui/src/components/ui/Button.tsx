import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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
    const baseClasses = 'flex justify-center items-center gap-2 font-bold transition-all duration-300 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

    // Width
    const widthClass = fullWidth ? 'w-full' : '';

    // Border Radius
    const roundedClass = {
        'full': 'rounded-full',
        'xl': 'rounded-xl',
        'md': 'rounded-md'
    }[rounded];

    // Sizes
    const sizeClasses = {
        'sm': 'px-4 py-2 text-sm',
        'md': 'px-6 py-2.5',
        'lg': 'px-6 py-3.5 text-lg'
    }[size];

    // Variants and Themes
    const cyanPrimary = 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:bg-cyan-600 focus:ring-cyan-500 hover:scale-105';
    const indigoPrimary = 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:bg-indigo-600 focus:ring-indigo-500 hover:scale-105';

    const secondary = 'bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 backdrop-blur-sm focus:ring-white/50';
    const ghost = 'text-slate-300 hover:text-white hover:bg-white/5 bg-transparent font-medium focus:ring-white/20';
    const danger = 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:bg-rose-500/30 font-semibold focus:ring-rose-500/50';

    let variantClasses = '';
    if (variant === 'primary') {
        variantClasses = colorTheme === 'indigo' ? indigoPrimary : cyanPrimary;
    } else if (variant === 'secondary') {
        variantClasses = secondary;
    } else if (variant === 'ghost') {
        variantClasses = ghost;
    } else if (variant === 'danger') {
        variantClasses = danger;
    }

    const finalClasses = `${baseClasses} ${widthClass} ${roundedClass} ${sizeClasses} ${variantClasses} ${className}`;

    return (
        <button className={finalClasses} disabled={disabled || isLoading} {...props}>
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {!isLoading && children}
        </button>
    );
}
