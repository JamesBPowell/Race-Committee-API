import React from 'react';
import Link from 'next/link';
import { Sailboat, Settings, CalendarDays } from 'lucide-react';
import SignOutButton from '@/components/SignOutButton';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
                                <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4" />
                                        Dashboard
                                    </div>
                                </Link>
                                <Link href="/dashboard/boats" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                                    My Boats
                                </Link>
                            </div>
                        </div>

                        {/* Secondary Nav Right */}
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard/settings" className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block">
                                <Settings className="w-5 h-5" />
                            </Link>
                            <SignOutButton />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {children}
            </main>
        </div>
    );
}
