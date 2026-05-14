'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    ChevronLeft, Trophy, Calendar, Anchor, Users, Target, Info, Trash2
} from 'lucide-react';
import { RegattaResponse, ScoringMethod, useRegatta } from '@/hooks/useRegattas';
import { useRaces, FinishResultDto } from '@/hooks/useRaces';
import { useCertificates } from '@/hooks/useCertificates';
import { RegattaResultsView, formatDuration, courseLabel } from '@/features/scoring';
import { AlertCircle, Edit, Save, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmContext';
import Button from '@/components/ui/Button';

interface RacerRegattaPageProps {
    regatta: RegattaResponse;
}

export default function RacerRegattaPage({ regatta: initialRegatta }: RacerRegattaPageProps) {
    const [activeTab, setActiveTab] = useState<'Results' | 'Schedule' | 'My Entry' | 'Class'>('Results');
    const { regatta, updateEntry, deleteEntry, isLoading: isUpdating } = useRegatta(initialRegatta.id);
    const { showToast } = useToast();
    const confirm = useConfirm();
    const { getRaceResults } = useRaces();

    const myEntryId = regatta?.myEntryId || initialRegatta.myEntryId;
    const currentRegatta = regatta || initialRegatta;
    const myEntry = currentRegatta.entries?.find(e => e.id === myEntryId);
    const myFleetId = myEntry?.fleetId;
    const myFleet = currentRegatta.fleets?.find(f => f.id === myFleetId);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        activeCertificateId: myEntry?.activeCertificateId || null,
        configuration: myEntry?.configuration || 'Spinnaker'
    });

    const { certificates } = useCertificates(myEntry?.boatId || null);

    const router = useRouter();

    const handleSaveEntry = async () => {
        if (!myEntryId) return;
        try {
            await updateEntry(myEntryId, {
                ...editData,
                registrationStatus: myEntry?.registrationStatus || 'Pending'
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update entry:", err);
            alert("Failed to save changes. Please try again.");
        }
    };

    const handleWithdraw = async () => {
        if (!myEntry) return;
        if (await confirm({
            title: 'Withdraw Entry?',
            message: 'Are you sure you want to withdraw your entry? This cannot be undone once processed.',
            confirmText: 'Withdraw',
            variant: 'danger'
        })) {
            try {
                await deleteEntry(myEntry.id);
                router.push('/dashboard');
            } catch (err) {
                showToast(err instanceof Error ? err.message : 'Failed to withdraw entry', 'error');
            }
        }
    };

    const scoredRaces = useMemo(() =>
        (currentRegatta.races || []).filter(r => r.status === 'Completed' || r.status === 'Scored' || r.status === 'Racing'),
        [currentRegatta.races]
    );
    const allRaces = currentRegatta.races || [];

    // Standing summary for hero banner
    interface BoatStanding {
        entryId: number;
        total: number;
        lastRace?: FinishResultDto;
    }
    const [standings, setStandings] = useState<BoatStanding[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchAndCompute = async () => {
            if (!myFleetId) return;
            const boatMap: Record<number, BoatStanding> = {};
            for (const race of scoredRaces) {
                if (!isMounted) return;
                try {
                    const results = await getRaceResults(race.id);
                    if (!isMounted) return;
                    for (const r of results) {
                        if (r.fleetId !== myFleetId) continue;
                        if (!boatMap[r.entryId]) {
                            boatMap[r.entryId] = { entryId: r.entryId, total: 0 };
                        }
                        boatMap[r.entryId].total += r.points ?? 0;
                        if (r.entryId === myEntryId) boatMap[r.entryId].lastRace = r;
                    }
                } catch { /* skip */ }
            }
            if (isMounted) {
                setStandings(Object.values(boatMap).sort((a, b) => a.total - b.total));
            }
        };
        fetchAndCompute();
        return () => { isMounted = false; };
    }, [myFleetId, myEntryId, scoredRaces, getRaceResults]);

    const myPosition = standings.findIndex(s => s.entryId === myEntryId) + 1;
    const totalInFleet = standings.length;
    const myLastRaceResult = standings.find(s => s.entryId === myEntryId)?.lastRace;

    const tabClass = (tab: string) =>
        `px-5 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors duration-300 cursor-pointer ${activeTab === tab
            ? 'text-indigo-400 border-indigo-400'
            : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
        }`;

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Back link */}
            <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-2">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>

            {/* Hero Banner */}
            <div className="glass-container relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-cyan-500/5" />
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">{currentRegatta.name}</h1>
                            <p className="text-slate-400 mt-1">{currentRegatta.organization} · {currentRegatta.location}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`badge-base ${currentRegatta.status === 'Live' ? 'badge-live' :
                                currentRegatta.status === 'Completed' ? 'badge-completed' :
                                    'badge-upcoming'
                                }`}>
                                {currentRegatta.status}
                            </span>
                        </div>
                    </div>

                    {/* At-a-glance standing */}
                    {myFleet && myPosition > 0 && (
                        <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <Trophy className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-white">{myPosition}<span className="text-base text-slate-400">/{totalInFleet}</span></p>
                                    <p className="text-xs text-slate-400 font-medium">in {myFleet.name}</p>
                                </div>
                            </div>
                            {myLastRaceResult && (
                                <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                                    <Target className="h-5 w-5 text-cyan-400" />
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            Last Race: {myLastRaceResult.points ?? '—'} pts
                                            {myLastRaceResult.correctedDuration && ` · ${formatDuration(myLastRaceResult.correctedDuration)}`}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Elapsed: {formatDuration(myLastRaceResult.elapsedDuration)}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {scoredRaces.length > 0 && (
                                <div className="text-xs text-slate-500 ml-auto">
                                    After {scoredRaces.length} race{scoredRaces.length !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-white/10 overflow-x-auto">
                <button onClick={() => setActiveTab('Results')} className={tabClass('Results')}>Results</button>
                <button onClick={() => setActiveTab('Schedule')} className={tabClass('Schedule')}>Schedule</button>
                <button onClick={() => setActiveTab('My Entry')} className={tabClass('My Entry')}>My Entry</button>
                <button onClick={() => setActiveTab('Class')} className={tabClass('Class')}>Class</button>
            </div>

            {/* ═══════════ RESULTS TAB ═══════════ */}
            {activeTab === 'Results' && (
                <RegattaResultsView regatta={currentRegatta} myEntryId={myEntryId} />
            )}

            {/* ═══════════ SCHEDULE TAB ═══════════ */}
            {activeTab === 'Schedule' && (
                <div className="space-y-4">
                    {allRaces.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No races scheduled yet.</p>
                        </div>
                    ) : (
                        allRaces.map(race => (
                            <div key={race.id} className="glass-container flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/10 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${race.status === 'Completed' || race.status === 'Scored'
                                        ? 'bg-emerald-500/10 border-emerald-500/20'
                                        : race.status === 'Racing'
                                            ? 'bg-rose-500/10 border-rose-500/20'
                                            : 'bg-slate-500/10 border-slate-500/20'
                                        }`}>
                                        <Target className={`h-5 w-5 ${race.status === 'Completed' || race.status === 'Scored' ? 'text-emerald-400' :
                                            race.status === 'Racing' ? 'text-rose-400' : 'text-slate-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{race.name}</h4>
                                        <p className="text-xs text-slate-400">
                                            {race.scheduledStartTime
                                                ? new Date(race.scheduledStartTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                                : 'TBD'}
                                            {race.scheduledStartTime && ` · ${new Date(race.scheduledStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    {race.courseType != null && <span className="px-2 py-1 bg-slate-800/60 rounded border border-white/5">{courseLabel(race.courseType)}</span>}
                                    {race.courseDistance && <span className="px-2 py-1 bg-slate-800/60 rounded border border-white/5">{race.courseDistance} nm</span>}
                                    <span className={`badge-base border-none ${race.status === 'Completed' || race.status === 'Scored' ? 'bg-emerald-500/20 text-emerald-400 font-bold uppercase' :
                                        race.status === 'Racing' ? 'badge-live font-bold uppercase' :
                                            'bg-slate-500/20 text-slate-300 font-bold uppercase'
                                        }`}>
                                        {race.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ═══════════ MY ENTRY TAB ═══════════ */}
            {activeTab === 'My Entry' && (
                <div className="max-w-2xl mx-auto space-y-6">
                    {myEntry ? (
                        <div className="glass-container relative overflow-visible">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Anchor className="w-5 h-5 text-cyan-400" /> My Entry
                                </h3>
                                {!isEditing ? (
                                    <button 
                                        onClick={() => {
                                            setIsEditing(true);
                                            setEditData({
                                                activeCertificateId: myEntry.activeCertificateId || null,
                                                configuration: myEntry.configuration || 'Spinnaker'
                                            });
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
                                    >
                                        <Edit className="w-3.5 h-3.5" /> Edit Entry
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            onClick={handleSaveEntry}
                                            isLoading={isUpdating}
                                            size="sm"
                                            variant="gradient"
                                            className="px-4"
                                        >
                                            <Save className="w-3.5 h-3.5 mr-2" /> Save
                                        </Button>
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="p-2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <InfoField label="Boat Name" value={myEntry.boatName} />
                                <InfoField label="Sail Number" value={myEntry.sailNumber} />
                                <InfoField label="Make / Model" value={myEntry.boatType || '—'} />
                                
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Configuration</p>
                                    {isEditing ? (
                                        <select
                                            value={editData.configuration}
                                            onChange={(e) => setEditData({ ...editData, configuration: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                        >
                                            <option value="Spinnaker">Spinnaker</option>
                                            <option value="Non-Spinnaker">Non-Spinnaker</option>
                                        </select>
                                    ) : (
                                        <p className="text-white font-medium">{myEntry.configuration || 'Spinnaker'}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Rating Certificate</p>
                                    {isEditing ? (
                                        <select
                                            value={editData.activeCertificateId || ''}
                                            onChange={(e) => setEditData({ ...editData, activeCertificateId: e.target.value ? parseInt(e.target.value) : null })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                        >
                                            <option value="">-- No Certificate Selected --</option>
                                            {certificates?.map(c => (
                                                <option key={c.id} value={c.id}>{c.certificateType} #{c.certificateNumber}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-white font-medium">
                                            {myEntry.activeCertificateId 
                                                ? `${myEntry.activeCertificateType} #${myEntry.activeCertificateNumber}`
                                                : 'No certificate selected'}
                                        </p>
                                    )}
                                </div>

                                <InfoField label="Rating" value={myEntry.rating?.toString() ?? '—'} />
                                <InfoField label="Class" value={myFleet?.name ?? 'Unassigned'} />
                                <InfoField label="Scoring Method" value={myFleet ? ScoringMethod[myFleet.scoringMethod]?.replace(/_/g, ' ') : '—'} />
                                
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Registration Status</p>
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${myEntry.registrationStatus === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        myEntry.registrationStatus === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                        {myEntry.registrationStatus}
                                    </span>
                                </div>
                            </div>

                            {myEntry.statusNote && (
                                <div className="mt-10 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">Status Note</p>
                                        <p className="text-sm text-amber-100/80 leading-relaxed font-medium">{myEntry.statusNote}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 pt-8 border-t border-white/5 flex justify-center">
                                <button 
                                    onClick={handleWithdraw}
                                    className="text-xs font-bold text-slate-500 hover:text-rose-400 flex items-center gap-2 transition-colors uppercase tracking-wider"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Withdraw Entry from Regatta
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                            <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No entry found.</p>
                            <p className="text-sm opacity-60">Your entry information will appear here once you are registered.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ CLASS TAB ═══════════ */}
            {activeTab === 'Class' && (
                <div className="space-y-6">
                    {myFleet ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-cyan-400" /> {myFleet.name} Competitors
                                </h3>
                                <span className="text-xs text-slate-400 font-medium">
                                    {(regatta?.entries || []).filter(e => e.fleetId === myFleet.id).length} boats
                                </span>
                            </div>
                            <div className="bg-slate-800/40 rounded-xl border border-white/5 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Sail #</th>
                                            <th className="px-5 py-3 font-medium">Boat</th>
                                            <th className="px-5 py-3 font-medium">Make/Model</th>
                                            <th className="px-5 py-3 font-medium">Owner</th>
                                            <th className="px-5 py-3 font-medium">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(regatta?.entries || [])
                                            .filter(e => e.fleetId === myFleet.id)
                                            .map(entry => {
                                                const isMe = entry.id === myEntryId;
                                                return (
                                                    <tr key={entry.id} className={`transition-colors ${isMe ? 'bg-indigo-500/15' : 'hover:bg-slate-800/30'}`}>
                                                        <td className="px-5 py-3 font-bold text-slate-300">{entry.sailNumber}</td>
                                                        <td className={`px-5 py-3 font-bold ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                                                            {entry.boatName}
                                                            {isMe && <span className="ml-2 text-[10px] text-indigo-400 font-bold uppercase">(You)</span>}
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-400">{entry.boatType || '—'}</td>
                                                        <td className="px-5 py-3 text-slate-400">{entry.ownerName}</td>
                                                        <td className="px-5 py-3 text-slate-400">{entry.rating ?? '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">Not assigned to a class yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{label}</p>
            <p className="text-white font-medium">{value}</p>
        </div>
    );
}
