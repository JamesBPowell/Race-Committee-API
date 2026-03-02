'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Wind, Navigation, Clock, Loader2, Ruler } from 'lucide-react';
import { RegattaResponse, FleetResponse, ScoringMethod, CourseType } from '@/hooks/useRegattas';
import { useRaces, FinishResultDto } from '@/hooks/useRaces';

interface RegattaResultsViewProps {
    regatta: RegattaResponse;
    myEntryId?: number | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDuration(isoOrTimeSpan: string | null | undefined): string {
    if (!isoOrTimeSpan) return '—';
    const parts = isoOrTimeSpan.replace(/\.\d+$/, '').split(':');
    if (parts.length < 2) return isoOrTimeSpan;
    const h = parseInt(parts[0]);
    const m = parts[1].padStart(2, '0');
    const s = parts.length > 2 ? parts[2].padStart(2, '0') : '00';
    return `${h}:${m}:${s}`;
}

function formatDelta(isoOrTimeSpan: string | null | undefined): string {
    if (!isoOrTimeSpan) return '—';
    const parts = isoOrTimeSpan.replace(/\.\d+$/, '').split(':');
    if (parts.length < 2) return isoOrTimeSpan;
    const h = parseInt(parts[0]);
    const m = parts[1].padStart(2, '0');
    const s = parts.length > 2 ? parts[2].padStart(2, '0') : '00';
    if (h === 0 && parseInt(m) === 0 && parseInt(s) === 0) return '—';
    return `+${h > 0 ? h + ':' : ''}${m}:${s}`;
}

function courseLabel(ct: CourseType | null | undefined): string {
    if (ct == null) return '';
    const labels: Record<number, string> = {
        0: 'W/L', 1: 'Random', 2: 'Triangle', 3: 'Olympic'
    };
    return labels[ct] ?? '';
}

export default function RegattaResultsView({ regatta, myEntryId }: RegattaResultsViewProps) {
    const { getRaceResults, isLoading: loadingResults } = useRaces();

    const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
    const [raceResults, setRaceResults] = useState<FinishResultDto[]>([]);
    const [allRaceResults, setAllRaceResults] = useState<Record<number, FinishResultDto[]>>({});

    const scoredRaces = (regatta.races || []).filter(r => r.status === 'Completed' || r.status === 'Scored' || r.status === 'Racing');
    const allRaces = regatta.races || [];

    useEffect(() => {
        if (scoredRaces.length > 0 && !selectedRaceId) {
            setSelectedRaceId(scoredRaces[scoredRaces.length - 1].id);
        }
    }, [scoredRaces, selectedRaceId]);

    const loadResults = useCallback(async (raceId: number) => {
        try {
            const data = await getRaceResults(raceId);
            setRaceResults(data);
            setAllRaceResults(prev => ({ ...prev, [raceId]: data }));
        } catch {
            setRaceResults([]);
        }
    }, [getRaceResults]);

    useEffect(() => {
        if (selectedRaceId) {
            if (allRaceResults[selectedRaceId]) {
                setRaceResults(allRaceResults[selectedRaceId]);
            } else {
                loadResults(selectedRaceId);
            }
        }
    }, [selectedRaceId, allRaceResults, loadResults]);

    useEffect(() => {
        const fetchAll = async () => {
            for (const race of scoredRaces) {
                if (!allRaceResults[race.id]) {
                    try {
                        const data = await getRaceResults(race.id);
                        setAllRaceResults(prev => ({ ...prev, [race.id]: data }));
                    } catch { /* skip */ }
                }
            }
        };
        if (scoredRaces.length > 0) fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scoredRaces.length]);

    const computeSeriesStandings = (fleetId?: number) => {
        const boatMap: Record<number, { entryId: number; boatName: string; sailNumber: string; boatMakeModel: string; rating: number | null; racePoints: Record<number, number>; total: number }> = {};
        for (const race of scoredRaces) {
            const results = allRaceResults[race.id];
            if (!results) continue;
            for (const r of results) {
                if (fleetId && r.fleetId !== fleetId) continue;
                // If calculating overall, only include boats with an overall rank in this race
                if (!fleetId && r.overallRank === null) continue;

                if (!boatMap[r.entryId]) {
                    boatMap[r.entryId] = {
                        entryId: r.entryId,
                        boatName: r.boatName,
                        sailNumber: r.sailNumber,
                        boatMakeModel: r.boatMakeModel,
                        rating: r.rating ?? null,
                        racePoints: {},
                        total: 0
                    };
                }
                const pts = fleetId ? (r.points ?? 0) : (r.overallRank ?? 0);
                boatMap[r.entryId].racePoints[race.id] = pts;
                boatMap[r.entryId].total += pts;
            }
        }
        return Object.values(boatMap).sort((a, b) => a.total - b.total);
    };

    if (scoredRaces.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No races scored yet.</p>
                <p className="text-sm opacity-60">Results will appear here once races are completed and scored.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Race Selector Pills */}
            <div className="flex flex-wrap gap-2">
                {scoredRaces.map(race => (
                    <button
                        key={race.id}
                        onClick={() => setSelectedRaceId(race.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedRaceId === race.id
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-900/20'
                            : 'bg-slate-800/50 text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        {race.name}
                    </button>
                ))}
            </div>

            {/* Wind Conditions Badge */}
            {selectedRaceId && (() => {
                const race = allRaces.find(r => r.id === selectedRaceId);
                if (!race) return null;
                return (
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        {race.windSpeed != null && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-white/5">
                                <Wind className="h-3.5 w-3.5 text-sky-400" /> {race.windSpeed} kts
                            </span>
                        )}
                        {race.windDirection != null && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-white/5">
                                <Navigation className="h-3.5 w-3.5 text-rose-400" /> {race.windDirection}°
                            </span>
                        )}
                        {race.courseType != null && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-white/5">
                                {courseLabel(race.courseType)}
                            </span>
                        )}
                        {race.courseDistance != null && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-white/5">
                                {race.courseDistance} nm
                            </span>
                        )}
                        {race.actualStartTime && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-white/5">
                                <Clock className="h-3.5 w-3.5 text-emerald-400" /> Started {new Date(race.actualStartTime).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                );
            })()}

            {/* Race Result Tables */}
            {loadingResults ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
            ) : (
                <RaceResultTables
                    results={raceResults}
                    fleets={regatta.fleets || []}
                    myEntryId={myEntryId}
                    race={allRaces.find(r => r.id === selectedRaceId) || null}
                />
            )}

            {/* Series Standings */}
            {scoredRaces.length > 1 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" /> Series Standings
                    </h3>

                    {(regatta.fleets || []).map(fleet => {
                        const standings = computeSeriesStandings(fleet.id);
                        if (standings.length === 0) return null;
                        return (
                            <div key={fleet.id} className="bg-slate-800/40 rounded-xl border border-white/5 overflow-hidden">
                                <div className="px-5 py-3 bg-slate-800/80 border-b border-white/5 font-bold text-indigo-300 flex justify-between items-center">
                                    <span>{fleet.name}</span>
                                    <span className="text-xs font-normal text-slate-400">
                                        {ScoringMethod[fleet.scoringMethod]?.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <SeriesStandingsTable standings={standings} scoredRaces={scoredRaces} myEntryId={myEntryId} />
                            </div>
                        );
                    })}

                    {/* Overall Series Standings */}
                    {(() => {
                        const overallStandings = computeSeriesStandings();
                        if (overallStandings.length === 0) return null;
                        return (
                            <div className="bg-indigo-900/10 rounded-xl border border-indigo-500/20 overflow-hidden">
                                <div className="px-5 py-4 bg-indigo-500/10 border-b border-indigo-500/20 font-bold flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        <span className="text-indigo-200">Regatta Overall Standings</span>
                                    </div>
                                    <span className="text-[10px] py-0.5 px-2 bg-indigo-500/20 rounded-full text-indigo-300 uppercase tracking-widest leading-none border border-indigo-500/30 font-black">
                                        Combined Fleets
                                    </span>
                                </div>
                                <SeriesStandingsTable standings={overallStandings} scoredRaces={scoredRaces} myEntryId={myEntryId} />
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

function RaceResultTables({ results, fleets, myEntryId, race }: {
    results: FinishResultDto[];
    fleets: FleetResponse[];
    myEntryId?: number | null;
    race: import('@/hooks/useRegattas').RaceResponse | null;
}) {
    const grouped: Record<number, FinishResultDto[]> = {};
    for (const r of results) {
        if (!grouped[r.fleetId]) grouped[r.fleetId] = [];
        grouped[r.fleetId].push(r);
    }

    for (const key of Object.keys(grouped)) {
        grouped[parseInt(key)].sort((a, b) => (a.points ?? 999) - (b.points ?? 999));
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <p className="text-sm">No results for this race yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {fleets.map(fleet => {
                const fleetResults = grouped[fleet.id];
                if (!fleetResults || fleetResults.length === 0) return null;

                const override = race?.raceFleets?.find(rf => rf.fleetId === fleet.id);

                return (
                    <div key={fleet.id} className="bg-slate-800/40 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-5 py-3 bg-slate-800/80 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-white uppercase tracking-tight">{fleet.name}</span>
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                                        {ScoringMethod[fleet.scoringMethod]?.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 overflow-x-auto pb-1 no-scrollbar">
                                    {override?.courseDistance !== undefined && override?.courseDistance !== null && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                                            <Ruler className="h-3 w-3 text-emerald-400/70" />
                                            <span>{override.courseDistance} NM</span>
                                        </div>
                                    )}
                                    {override?.courseType !== undefined && override?.courseType !== null && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                                            <Navigation className="h-3 w-3 text-sky-400/70" />
                                            <span>{courseLabel(override.courseType)}</span>
                                        </div>
                                    )}
                                    {override?.startTimeOffset && override.startTimeOffset !== '00:00:00' && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                                            <Clock className="h-3 w-3 text-indigo-400/70" />
                                            <span>+{override.startTimeOffset}</span>
                                        </div>
                                    )}
                                    {(override?.windSpeed || override?.windDirection) ? (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                                            <Wind className="h-3 w-3 text-amber-400/70" />
                                            <span>{override.windSpeed || 0}KT / {override.windDirection || 0}°</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Fleet Class</div>
                                <div className="text-xs font-medium text-slate-400">{fleetResults.length} Boats Scored</div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 font-medium w-12">Pos</th>
                                        <th className="px-4 py-3 font-medium">Sail</th>
                                        <th className="px-4 py-3 font-medium">Boat</th>
                                        <th className="px-4 py-3 font-medium">Make/Model</th>
                                        <th className="px-4 py-3 font-medium text-center">Pts</th>
                                        <th className="px-4 py-3 font-medium text-right w-20">Overall</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {fleetResults.map((r, idx) => {
                                        const isMe = r.entryId === myEntryId;
                                        return (
                                            <tr key={r.finishId} className={`transition-colors ${isMe ? 'bg-indigo-500/15 hover:bg-indigo-500/20' : 'hover:bg-slate-800/30'}`}>
                                                <td className="px-4 py-3 font-bold text-slate-300">{idx + 1}</td>
                                                <td className="px-4 py-3 font-bold text-slate-300">{r.sailNumber}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`font-bold ${isMe ? 'text-indigo-300' : 'text-white'}`}>{r.boatName}</span>
                                                    {isMe && <span className="ml-2 text-[10px] text-indigo-400 font-bold uppercase">(You)</span>}
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 text-xs">{r.boatMakeModel || '—'}</td>
                                                <td className={`px-4 py-3 text-center font-bold ${isMe ? 'text-indigo-300' : 'text-emerald-400'}`}>
                                                    {r.points ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-500 text-xs font-medium">
                                                    {r.overallRank ?? '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function SeriesStandingsTable({ standings, scoredRaces, myEntryId }: {
    standings: any[];
    scoredRaces: any[];
    myEntryId?: number | null
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                    <tr>
                        <th className="px-4 py-3 font-medium w-12">Pos</th>
                        <th className="px-4 py-3 font-medium">Boat</th>
                        <th className="px-4 py-3 font-medium">Make/Model</th>
                        {scoredRaces.map(r => (
                            <th key={r.id} className="px-3 py-3 font-medium text-center whitespace-nowrap">
                                {r.name.replace('Race ', 'R')}
                            </th>
                        ))}
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {standings.map((s, idx) => {
                        const isMe = s.entryId === myEntryId;
                        return (
                            <tr key={s.entryId} className={`transition-colors ${isMe ? 'bg-indigo-500/15 hover:bg-indigo-500/20' : 'hover:bg-slate-800/30'}`}>
                                <td className="px-4 py-3 font-bold text-slate-300">{idx + 1}</td>
                                <td className="px-4 py-3">
                                    <div className={`font-bold ${isMe ? 'text-indigo-300' : 'text-white'}`}>{s.boatName}</div>
                                    <div className="text-xs text-slate-500">{s.sailNumber}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{s.boatMakeModel || '—'}</td>
                                {scoredRaces.map(r => (
                                    <td key={r.id} className="px-3 py-3 text-center text-slate-300 text-xs font-mono">
                                        {s.racePoints[r.id] ?? '—'}
                                    </td>
                                ))}
                                <td className={`px-4 py-3 text-right font-bold ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                                    {s.total}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
