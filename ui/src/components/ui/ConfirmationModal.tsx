'use client';

import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import Button from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmationModalProps) {
    const [isLoading, setIsLoading] = React.useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            // Error handling should be done by the caller
        } finally {
            setIsLoading(false);
        }
    };

    const variantStyles = {
        danger: {
            icon: <AlertTriangle className="w-8 h-8 text-rose-500" />,
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
        },
        warning: {
            icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20'
        },
        info: {
            icon: <AlertTriangle className="w-8 h-8 text-cyan-500" />,
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20',
            button: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20'
        }
    }[variant];

    return (
        <div className="modal-overlay">
            <div className="modal-container max-w-md animate-in zoom-in-95 fade-in duration-200">
                <div className="absolute top-4 right-4">
                    <button 
                        onClick={onClose}
                        className="p-1 text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${variantStyles.bg} border ${variantStyles.border}`}>
                        {variantStyles.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-slate-400 leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="flex-1 order-2 sm:order-1"
                        >
                            {cancelText}
                        </Button>
                        <button
                            disabled={isLoading}
                            onClick={handleConfirm}
                            className={`flex-1 order-1 sm:order-2 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${variantStyles.button}`}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
