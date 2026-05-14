'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmationModal from './ConfirmationModal';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<ConfirmOptions & { isOpen: boolean; resolve: (val: boolean) => void } | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setConfig({
                ...options,
                isOpen: true,
                resolve
            });
        });
    }, []);

    const handleClose = useCallback(() => {
        if (config) {
            config.resolve(false);
            setConfig(null);
        }
    }, [config]);

    const handleConfirm = useCallback(() => {
        if (config) {
            config.resolve(true);
            setConfig(null);
        }
    }, [config]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {config && (
                <ConfirmationModal
                    isOpen={config.isOpen}
                    title={config.title}
                    message={config.message}
                    confirmText={config.confirmText}
                    cancelText={config.cancelText}
                    variant={config.variant}
                    onClose={handleClose}
                    onConfirm={handleConfirm}
                />
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
}
