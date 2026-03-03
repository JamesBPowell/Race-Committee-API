import React from 'react';
import { Ruler, Navigation, Clock, Wind } from 'lucide-react';
import { FleetResponse, ScoringMethod, RaceResponse } from '@/hooks/useRegattas';
import { FinishResultDto } from '@/hooks/useRaces';
import { formatDuration, formatDelta, courseLabel } from '../../utils';

interface RaceResultTablesProps {
    results: FinishResultDto[];
    fleets: FleetResponse[];
    myEntryId?: number | null;
    race: RaceResponse | null;
}

const tableHeader = "text-xs text-slate-400 uppercase bg-slate-900/50";
const headerCell = "px-4 py-3 font-medium";
const infoPill = "flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap";

export function RaceResultTables({ results, fleets, myEntryId, race }: RaceResultTablesProps) {
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
                                        <div className={infoPill}>
                                            <Ruler className="h-3 w-3 text-emerald-400/70" />
                                            <span>{override.courseDistance} NM</span>
                                        </div>
                                    )}
                                    {override?.courseType !== undefined && override?.courseType !== null && (
                                        <div className={infoPill}>
                                            <Navigation className="h-3 w-3 text-sky-400/70" />
                                            <span>{courseLabel(override.courseType)}</span>
                                        </div>
                                    )}
                                    {override?.startTimeOffset && override.startTimeOffset !== '00:00:00' && (
                                        <div className={infoPill}>
                                            <Clock className="h-3 w-3 text-indigo-400/70" />
                                            <span>+{override.startTimeOffset}</span>
                                        </div>
                                    )}
                                    {(override?.windSpeed || override?.windDirection) ? (
                                        <div className={infoPill}>
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
                                <thead className={tableHeader}>
                                    <tr>
                                        <th className={`${headerCell} w-12`}>Pos</th>
                                        <th className={headerCell}>Sail</th>
                                        <th className={headerCell}>Boat</th>
                                        <th className={headerCell}>Make/Model</th>
                                        <th className={headerCell}>Rating</th>
                                        <th className={headerCell}>Elapsed</th>
                                        <th className={headerCell}>Corrected</th>
                                        <th className={headerCell}>Delta</th>
                                        <th className={`${headerCell} text-center`}>Pts</th>
                                        <th className={`${headerCell} text-right w-20`}>Overall</th>
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
                                                <td className="px-4 py-3 text-slate-400 text-xs">{r.rating ?? '—'}</td>
                                                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                                    {r.code && r.code !== 'SCP' ? <span className="text-rose-400 font-bold">{r.code}</span> : formatDuration(r.elapsedDuration)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                                                    {r.code && r.code !== 'SCP' ? '—' : formatDuration(r.correctedDuration)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                                                    {r.code && r.code !== 'SCP' ? '—' : formatDelta(r.timeDelta)}
                                                </td>
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
