import React from 'react';
import Link from 'next/link';
import {
    ChevronLeft, Calendar, MapPin, Users,
    Target, Anchor, Shield, TrendingUp
} from 'lucide-react';

export default async function RegattaPage({ params }: { params: Promise<{ id: string }> }) {
    // In a real app we'd fetch regatta data here based on params.id
    // For now we'll use placeholder data
    const { id } = await params;
    const regattaName = id === 'summer-series-1' ? 'Summer Series I' : 'Regional Championship';
    const status = 'Upcoming';
    const startDate = 'Jun 15';
    const endDate = 'Jun 16';
    const location = 'Newport, RI';
    const organization = 'Newport Yacht Club';

    const statusColors = {
        'Upcoming': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'Live': 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse',
        'Completed': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* Minimalist Top Navigation */}
            <nav className="flex items-center space-x-4 mb-8">
                <Link href="/dashboard" className="p-2 rounded-full bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-slate-600">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="h-4 w-px bg-slate-700"></div>
                <div className="text-sm font-medium text-slate-400">
                    Dashboard / <span className="text-cyan-400">{regattaName}</span>
                </div>
            </nav>

            {/* Header Section */}
            <div className="relative mb-10 p-8 rounded-3xl overflow-hidden backdrop-blur-md bg-slate-900/40 border border-slate-800 shadow-2xl">
                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <span className={`px - 3 py - 1 rounded - full text - xs font - semibold border whitespace - nowrap ${statusColors[status]} `}>
                                {status}
                            </span>
                            <span className="text-sm font-medium text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                Race Committee
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                            {regattaName}
                        </h1>
                        <p className="text-lg text-slate-400 font-medium max-w-2xl">{organization}</p>

                        <div className="flex flex-wrap items-center gap-6 mt-6">
                            <div className="flex items-center text-slate-300 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                                <Calendar className="w-5 h-5 mr-3 text-cyan-400" />
                                <span className="font-medium">{startDate} {endDate && `- ${endDate} `}</span>
                            </div>
                            <div className="flex items-center text-slate-300 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                                <MapPin className="w-5 h-5 mr-3 text-cyan-400" />
                                <span className="font-medium">{location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Boats Entered" value="24" icon={<Anchor className="w-6 h-6" />} color="cyan" />
                <StatCard title="Classes" value="3" icon={<Target className="w-6 h-6" />} color="indigo" />
                <StatCard title="Scheduled Races" value="6" icon={<TrendingUp className="w-6 h-6" />} color="emerald" />
                <StatCard title="Protests" value="0" icon={<Shield className="w-6 h-6" />} color="slate" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-800 mb-8 pb-px scrollbar-hide">
                <Tab active label="Overview" />
                <Tab label="Entries" />
                <Tab label="Classes" />
                <Tab label="Races" />
                <Tab label="Settings" />
            </div>

            {/* Main Content Area (Overview) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                            <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">View All</button>
                        </div>
                        <div className="space-y-4">
                            <ActivityItem time="2 hours ago" action="New Entry:" target="J/105 'Velocity'" />
                            <ActivityItem time="5 hours ago" action="Class Added:" target="PHRF Spinnaker" />
                            <ActivityItem time="Yesterday" action="Regatta Created" target="by Race Officer" />
                        </div>
                    </div>
                </div>

                {/* Right Column - Actions & Info */}
                <div className="space-y-6">
                    <div className="backdrop-blur-md bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <ActionBtn icon={<Users className="w-4 h-4" />} label="Manage Entries" />
                            <ActionBtn icon={<Target className="w-4 h-4" />} label="Configure Classes" />
                            <ActionBtn icon={<Calendar className="w-4 h-4" />} label="Edit Schedule" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponents for cleaner code

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: 'cyan' | 'indigo' | 'emerald' | 'slate' }) {
    const colors = {
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/50',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/50',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50',
        slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20 group-hover:border-slate-500/50',
    };

    return (
        <div className={`group relative backdrop - blur - md bg - white / 5 border border - white / 10 rounded - 2xl p - 6 transition - all duration - 300 hover: bg - white / 10 overflow - hidden`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</span>
                <div className={`p - 2 rounded - xl transition - colors duration - 300 ${colors[color]} `}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        </div>
    );
}

function Tab({ label, active = false }: { label: string, active?: boolean }) {
    return (
        <button className={`px - 6 py - 3 font - medium text - sm whitespace - nowrap border - b - 2 transition - colors duration - 300 ${active
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
            } `}>
            {label}
        </button>
    );
}

function ActivityItem({ time, action, target }: { time: string, action: string, target: string }) {
    return (
        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 flex-shrink-0"></div>
            <div>
                <p className="text-sm font-medium text-white">
                    <span className="text-slate-300 mr-1">{action}</span>
                    {target}
                </p>
                <p className="text-xs text-slate-500 mt-1">{time}</p>
            </div>
        </div>
    );
}

function ActionBtn({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl text-sm font-medium text-slate-200 hover:text-white transition-all duration-300 group">
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">{icon}</span>
            {label}
        </button>
    );
}
