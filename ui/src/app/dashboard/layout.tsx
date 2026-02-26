'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sailboat, Settings, CalendarDays } from 'lucide-react';
import SignOutButton from '@/components/SignOutButton';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isDashboard = pathname === '/dashboard';
    const isBoats = pathname === '/dashboard/boats';
    const isSettings = pathname === '/dashboard/settings';

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-white/10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo & Primary Nav Left */}
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 group-hover:bg-cyan-500/30 transition-colors">
                                    <Sailboat className="w-5 h-5 text-cyan-400" />
                                </div>
                                <span className="font-bold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                                    RaceKrewe
                                </span>
                            </Link>

                            <div className="hidden md:flex items-center gap-1">
                                <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isDashboard ? 'text-white bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4" />
                                        Dashboard
                                    </div>
                                </Link>
                                <Link href="/dashboard/boats" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isBoats ? 'text-white bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                                    My Boats
                                </Link>
                            </div>
                        </div>

                        {/* Secondary Nav Right */}
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/settings" className={`p-2 rounded-full transition-colors hidden sm:block ${isSettings ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'}`}>
                                <Settings className="w-5 h-5" />
                            </Link>
                            <SignOutButton />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:py-12">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
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
        </div>
    );
}
