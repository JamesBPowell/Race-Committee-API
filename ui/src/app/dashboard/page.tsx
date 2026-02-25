'use client';

import React from 'react';

import RegattaFormModal from '@/components/RegattaFormModal';
import { PlusCircle, Search } from 'lucide-react';
import RegattaCard, { RegattaCardProps } from '@/components/RegattaCard';

// Temporary Mock Data for UI Layout
const mockRcRegattas: RegattaCardProps[] = [
    {
        id: '1',
        name: 'Annual Summer Regatta',
        organization: 'Lake Pontchartrain Racing Fleet',
        startDate: 'Aug 15, 2026',
        endDate: 'Aug 17, 2026',
        location: 'New Orleans, LA',
        status: 'Upcoming',
        role: 'RC',
        boatsEntered: 42
    },
    {
        id: '2',
        name: 'Wednesday Night Series',
        organization: 'New Orleans Yacht Club',
        startDate: 'Sep 02, 2026',
        endDate: '',
        location: 'New Orleans, LA',
        status: 'Live',
        role: 'RC',
        boatsEntered: 18
    }
];

const mockRacerRegattas: RegattaCardProps[] = [
    {
        id: '3',
        name: 'Gulf Coast Championship',
        organization: 'Gulf Yachting Association',
        startDate: 'Oct 10, 2026',
        endDate: 'Oct 12, 2026',
        location: 'Gulfport, MS',
        status: 'Upcoming',
        role: 'Competitor'
    }
];

export default function DashboardPage() {
    const [isRegattaModalOpen, setIsRegattaModalOpen] = React.useState(false);

    return (
        <div className="space-y-12">

            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Mission Control</h1>
                    <p className="text-slate-400 mt-1">Manage your event logistics or track your racing campaigns.</p>
                </div>

                {/* Global Actions */}
                <div className="flex w-full md:w-auto items-center gap-3">
                    <button
                        onClick={() => setIsRegattaModalOpen(true)}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                        <PlusCircle className="w-5 h-5" />
                        New Regatta
                    </button>
                    <button className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/20 transition-all duration-300 backdrop-blur-sm">
                        <Search className="w-5 h-5" />
                        Find Race
                    </button>
                </div>
            </header>

            <div className="space-y-16">
                {/* Race Committee Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                            <span className="w-2 h-8 rounded-full bg-cyan-500 block"></span>
                            Managing as RC
                        </h2>
                        <span className="text-sm font-medium text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                            {mockRcRegattas.length} Active Events
                        </span>
                    </div>

                    {mockRcRegattas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mockRcRegattas.map(regatta => (
                                <RegattaCard key={regatta.id} {...regatta} />
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-48 border-2 border-dashed border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                            <p className="mb-2">You aren&apos;t organizing any regattas yet.</p>
                            <button className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Create your first event &rarr;</button>
                        </div>
                    )}
                </section>

                {/* Racer Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                            <span className="w-2 h-8 rounded-full bg-indigo-500 block"></span>
                            Racing
                        </h2>
                        <span className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                            {mockRacerRegattas.length} Entered Events
                        </span>
                    </div>

                    {mockRacerRegattas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mockRacerRegattas.map(regatta => (
                                <RegattaCard key={regatta.id} {...regatta} />
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-48 border-2 border-dashed border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                            <p className="mb-2">You aren&apos;t entered in any upcoming races.</p>
                            <button className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Find a regatta to join &rarr;</button>
                        </div>
                    )}
                </section>
            </div>

            <RegattaFormModal
                isOpen={isRegattaModalOpen}
                onClose={() => setIsRegattaModalOpen(false)}
            />
        </div>
    );
}
