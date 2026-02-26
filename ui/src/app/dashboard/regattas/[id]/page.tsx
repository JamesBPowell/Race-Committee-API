'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
    ChevronLeft, Calendar, MapPin, Users,
    Target, Anchor, Shield, TrendingUp, Loader2
} from 'lucide-react';
import { useRegatta, RaceResponse } from '@/hooks/useRegattas';
import { useRaces } from '@/hooks/useRaces';
import AddRaceModal from '@/components/AddRaceModal';
import EditRaceModal from '@/components/EditRaceModal';

export default function RegattaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { regatta, isLoading, error, refetch } = useRegatta(id);

    const [activeTab, setActiveTab] = useState<'Overview' | 'Entries' | 'Classes' | 'Races' | 'Settings'>('Overview');
    const { deleteRace, isLoading: isDeleting } = useRaces();
    const [isAddRaceOpen, setIsAddRaceOpen] = useState(false);
    const [editingRace, setEditingRace] = useState<RaceResponse | null>(null);

    if (isLoading) {
        return (
            <div className="flex-1 w-full flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (error || !regatta) {
        return (
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 text-center text-rose-400">
                {error || "Regatta not found"}
            </div>
        );
    }

    const regattaName = regatta.name;
    const status = regatta.status || 'Upcoming';

    // Format dates nicely if they exist
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        // Force UTC to prevent shifting to previous day
        return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const startDate = formatDate(regatta.startDate);
    const endDate = formatDate(regatta.endDate);
    const location = regatta.location;
    const organization = regatta.organization || 'Race Committee';

    const statusColors: Record<string, string> = {
        'Upcoming': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'Live': 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse',
        'Completed': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        'Draft': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };

    const handleDeleteRace = async (raceId: number) => {
        if (confirm('Are you sure you want to delete this race?')) {
            try {
                await deleteRace(raceId);
                refetch();
            } catch {
                alert('Failed to delete race');
            }
        }
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* Minimalist Top Navigation */}
            <nav className="flex items-center space-x-4 mb-8">
                <Link href="/dashboard" className="nav-button-round">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="h-4 w-px bg-slate-700"></div>
                <div className="text-sm font-medium text-slate-400">
                    Dashboard / <span className="text-cyan-400">{regattaName}</span>
                </div>
            </nav>

            {/* Header Section */}
            <div className="glass-header mb-10">
                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <span className={`badge-base ${statusColors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                {status}
                            </span>
                            <span className="badge-base text-indigo-300 bg-indigo-500/10 border-indigo-500/20">
                                Race Committee
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                            {regattaName}
                        </h1>
                        <p className="text-lg text-slate-400 font-medium max-w-2xl">{organization}</p>

                        <div className="flex flex-wrap items-center gap-6 mt-6">
                            <div className="info-pill">
                                <Calendar className="w-5 h-5 mr-3 text-cyan-400" />
                                <span className="font-medium">{startDate} {endDate && `- ${endDate}`}</span>
                            </div>
                            <div className="info-pill">
                                <MapPin className="w-5 h-5 mr-3 text-cyan-400" />
                                <span className="font-medium">{location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Boats Entered" value={regatta.boatsEnteredCount?.toString() || "0"} icon={<Anchor className="w-6 h-6" />} color="cyan" />
                <StatCard title="Classes" value={regatta.classesCount?.toString() || "0"} icon={<Target className="w-6 h-6" />} color="indigo" />
                <StatCard title="Scheduled Races" value={regatta.scheduledRacesCount?.toString() || "0"} icon={<TrendingUp className="w-6 h-6" />} color="emerald" />
                <StatCard title="Protests" value="0" icon={<Shield className="w-6 h-6" />} color="slate" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-800 mb-8 pb-px scrollbar-hide">
                <Tab active={activeTab === 'Overview'} label="Overview" onClick={() => setActiveTab('Overview')} />
                <Tab active={activeTab === 'Entries'} label="Entries" onClick={() => setActiveTab('Entries')} />
                <Tab active={activeTab === 'Classes'} label="Classes" onClick={() => setActiveTab('Classes')} />
                <Tab active={activeTab === 'Races'} label="Races" onClick={() => setActiveTab('Races')} />
                <Tab active={activeTab === 'Settings'} label="Settings" onClick={() => setActiveTab('Settings')} />
            </div>

            {/* Main Content Area */}
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-container">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                                <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">View All</button>
                            </div>
                            <div className="space-y-4">
                                <ActivityItem time="Just now" action="Regatta Statistics Updated" target={`with ${regatta.boatsEnteredCount} boats`} />
                                <ActivityItem time="Today" action="Races Configured" target={`Total of ${regatta.scheduledRacesCount} races`} />
                                <ActivityItem time="Recently" action="Regatta Initialized" target={`at ${location}`} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Actions & Info */}
                    <div className="space-y-6">
                        <div className="backdrop-blur-md bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <ActionBtn icon={<Users className="w-4 h-4" />} label="Manage Entries" onClick={() => setActiveTab('Entries')} />
                                <ActionBtn icon={<Target className="w-4 h-4" />} label="Configure Classes" onClick={() => setActiveTab('Classes')} />
                                <ActionBtn icon={<Calendar className="w-4 h-4" />} label="Manage Races" onClick={() => setActiveTab('Races')} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Entries' && (
                <div className="space-y-6">
                    <div className="glass-container">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Regatta Entries</h2>
                            <div className="text-sm text-slate-400">{regatta.boatsEnteredCount} Boats Confirmed</div>
                        </div>

                        {!regatta.entries || regatta.entries.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                No boats have entered this regatta yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-slate-400 text-sm">
                                            <th className="pb-3 font-medium">Boat Name</th>
                                            <th className="pb-3 font-medium">Design / Model</th>
                                            <th className="pb-3 font-medium">Sail #</th>
                                            <th className="pb-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {regatta.entries.map((entry) => (
                                            <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 text-white font-medium">{entry.boatName}</td>
                                                <td className="py-4 text-slate-300">{entry.boatType}</td>
                                                <td className="py-4 text-slate-300">{entry.sailNumber}</td>
                                                <td className="py-4">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                        {entry.registrationStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'Races' && (
                <div className="space-y-6">
                    <div className="glass-container">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Races</h2>
                            <button
                                onClick={() => setIsAddRaceOpen(true)}
                                className="px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-sm font-medium transition-colors"
                            >
                                + Add Race
                            </button>
                        </div>

                        {!regatta.races || regatta.races.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                No races have been added to this regatta yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-slate-400 text-sm">
                                            <th className="pb-3 font-medium">Race</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Start Time</th>
                                            <th className="pb-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {regatta.races.map((race) => (
                                            <tr key={race.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="py-4 text-white font-medium">
                                                    Race {race.raceNumber}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${race.status === 'Completed' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                                                        race.status === 'Racing' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                            'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                                        }`}>
                                                        {race.status || 'Scheduled'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-slate-300">
                                                    {race.scheduledStartTime ? new Date(race.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        onClick={() => setEditingRace(race)}
                                                        className="mr-3 text-cyan-400 hover:text-cyan-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRace(race.id)}
                                                        disabled={isDeleting}
                                                        className="text-rose-400 hover:text-rose-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AddRaceModal
                isOpen={isAddRaceOpen}
                onClose={() => setIsAddRaceOpen(false)}
                regattaId={regatta.id}
                onSuccess={refetch}
            />

            <EditRaceModal
                isOpen={!!editingRace}
                onClose={() => setEditingRace(null)}
                race={editingRace}
                onSuccess={refetch}
            />
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
        <div className={`group relative glass-container transition-all duration-300 hover:bg-white/10 overflow-hidden`}>
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

function Tab({ label, active = false, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors duration-300 ${active
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
                }`}>
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

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl text-sm font-medium text-slate-200 hover:text-white transition-all duration-300 group"
        >
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">{icon}</span>
            {label}
        </button>
    );
}
