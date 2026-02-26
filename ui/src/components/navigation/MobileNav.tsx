'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sailboat, Settings, CalendarDays } from 'lucide-react';

export default function MobileNav() {
    const pathname = usePathname();
    const isDashboard = pathname === '/dashboard';
    const isBoats = pathname === '/dashboard/boats';
    const isSettings = pathname === '/dashboard/settings';

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                <Link href="/dashboard" className={`flex flex-col items-center justify-center p-2 w-full transition-colors ${isDashboard ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'}`}>
                    <CalendarDays className="w-6 h-6 mb-1" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Dashboard</span>
                </Link>
                <Link href="/dashboard/boats" className={`flex flex-col items-center justify-center p-2 w-full transition-colors ${isBoats ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'}`}>
                    <Sailboat className="w-6 h-6 mb-1" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Boats</span>
                </Link>
                <Link href="/dashboard/settings" className={`flex flex-col items-center justify-center p-2 w-full transition-colors ${isSettings ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-300'}`}>
                    <Settings className="w-6 h-6 mb-1" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Settings</span>
                </Link>
            </div>
        </div>
    );
}
