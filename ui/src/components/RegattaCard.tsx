import React from 'react';
import { Calendar, MapPin, Users, Settings, Target } from 'lucide-react';

export type RegattaStatus = 'Upcoming' | 'Live' | 'Completed';
export type RegattaRole = 'RC' | 'Competitor';

export interface RegattaCardProps {
    id: string;
    name: string;
    organization: string;
    startDate: string;
    endDate: string;
    location: string;
    status: RegattaStatus;
    role: RegattaRole;
    boatsEntered?: number;
}

export default function RegattaCard({
    name,
    organization,
    startDate,
    endDate,
    location,
    status,
    role,
    boatsEntered
}: RegattaCardProps) {

    // Status Badge Styling
    const statusColors = {
        'Upcoming': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'Live': 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse',
        'Completed': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };

    return (
        <div className="group relative backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-cyan-500/10">
            {/* Subtle Gradient Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/10 transition-all duration-500 opacity-0 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col h-full">

                {/* Header: Title & Status */}
                <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors line-clamp-1">{name}</h3>
                        <p className="text-sm text-slate-400 font-medium">{organization}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusColors[status]}`}>
                        {status === 'Live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-ping" />}
                        {status}
                    </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 mb-6 mt-auto">
                    <div className="flex items-center text-sm text-slate-300">
                        <Calendar className="w-4 h-4 mr-2 text-cyan-500/70" />
                        {startDate} {endDate && `- ${endDate}`}
                    </div>
                    <div className="flex items-center text-sm text-slate-300">
                        <MapPin className="w-4 h-4 mr-2 text-cyan-500/70" />
                        <span className="line-clamp-1">{location}</span>
                    </div>

                    {role === 'RC' && (
                        <div className="flex items-center text-sm text-slate-300">
                            <Users className="w-4 h-4 mr-2 text-cyan-500/70" />
                            {boatsEntered || 0} Boats Registered
                        </div>
                    )}
                </div>

                {/* Footer Action Area */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">
                        {role === 'RC' ? 'Managing as Race Committee' : 'Racing as Competitor'}
                    </span>

                    <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors border border-white/10 hover:border-cyan-500/50">
                        {role === 'RC' ? <Settings className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
