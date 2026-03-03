import React from 'react';
import { RaceResponse } from '@/hooks/useRegattas';

interface SeriesStanding {
    entryId: number;
    boatName: string;
    sailNumber: string;
    boatMakeModel: string;
    rating: number | null;
    racePoints: Record<number, number>;
    total: number;
}

interface SeriesStandingsTableProps {
    standings: SeriesStanding[];
    scoredRaces: RaceResponse[];
    myEntryId?: number | null;
}

const tableHeader = "text-xs text-slate-400 uppercase bg-slate-900/50";
const headerCell = "px-4 py-3 font-medium";

export function SeriesStandingsTable({ standings, scoredRaces, myEntryId }: SeriesStandingsTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className={tableHeader}>
                    <tr>
                        <th className={`${headerCell} w-12`}>Pos</th>
                        <th className={headerCell}>Boat</th>
                        <th className={headerCell}>Make/Model</th>
                        {scoredRaces.map(r => (
                            <th key={r.id} className="px-3 py-3 font-medium text-center whitespace-nowrap">
                                {r.name.replace('Race ', 'R')}
                            </th>
                        ))}
                        <th className={`${headerCell} text-right`}>Total</th>
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
