import React from 'react';
import RegattaCard, { RegattaCardProps } from './RegattaCard';

interface RegattaListSectionProps {
    title: string;
    countLabel: string;
    themeColor: 'cyan' | 'indigo';
    isLoading: boolean;
    regattas: RegattaCardProps[];
    emptyMessage: string;
    emptyActionText: string;
    onEmptyAction: () => void;
}

export default function RegattaListSection({
    title,
    countLabel,
    themeColor,
    isLoading,
    regattas,
    emptyMessage,
    emptyActionText,
    onEmptyAction
}: RegattaListSectionProps) {
    const colorClasses = {
        cyan: {
            bg: 'bg-cyan-500',
            text: 'text-cyan-400',
            badgeBg: 'bg-cyan-500/10',
            badgeBorder: 'border-cyan-500/20',
            hoverText: 'hover:text-cyan-300'
        },
        indigo: {
            bg: 'bg-indigo-500',
            text: 'text-indigo-400',
            badgeBg: 'bg-indigo-500/10',
            badgeBorder: 'border-indigo-500/20',
            hoverText: 'hover:text-indigo-300'
        }
    };

    const theme = colorClasses[themeColor];

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <span className={`w-2 h-8 rounded-full ${theme.bg} block`}></span>
                    {title}
                </h2>
                <span className={`text-sm font-medium ${theme.text} ${theme.badgeBg} px-3 py-1 rounded-full border ${theme.badgeBorder}`}>
                    {isLoading ? '...' : regattas.length} {countLabel}
                </span>
            </div>

            {isLoading ? (
                <div className="w-full h-48 border-2 border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                    <p className="animate-pulse">Loading regattas...</p>
                </div>
            ) : regattas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regattas.map(regatta => (
                        <RegattaCard key={regatta.id} {...regatta} />
                    ))}
                </div>
            ) : (
                <div className="w-full h-48 border-2 border-dashed border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                    <p className="mb-2">{emptyMessage}</p>
                    <button onClick={onEmptyAction} className={`${theme.text} ${theme.hoverText} font-medium transition-colors`}>
                        {emptyActionText} &rarr;
                    </button>
                </div>
            )}
        </section>
    );
}
