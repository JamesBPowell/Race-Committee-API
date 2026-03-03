import React from 'react';
import { Calculator, RefreshCw, Ruler, Navigation, Clock, Wind, Loader2 } from 'lucide-react';
import { RaceResponse, RegattaResponse } from '@/hooks/useRegattas';
import { FinishResultDto } from '@/hooks/useRaces';

interface RaceResultsProps {
    race: RaceResponse;
    regatta: RegattaResponse;
    results: FinishResultDto[];
    isLoading: boolean;
    onScoreRace: () => void;
}

const tableHeader = "text-xs text-slate-400 uppercase bg-slate-900/50";
const headerCell = "px-5 py-3 font-medium";
const rowBase = "hover:bg-slate-800/30 transition-colors";
const badgeBase = "px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none";
const infoPill = "flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap";

export function RaceResults({ race, regatta, results, isLoading, onScoreRace }: RaceResultsProps) {
    if (isLoading && results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Calculating results...</p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-700">
                <Calculator className="h-10 w-10 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Results Calculated</h3>
                <p className="text-slate-400 mb-6">Record finishes and trigger scoring to see results.</p>
                <button
                    onClick={onScoreRace}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-bold transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Calculate Scores
                </button>
            </div>
        );
    }

    const relevantFleets = regatta.fleets || [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-indigo-400" />
                    Race Results
                </h3>
                <button
                    onClick={onScoreRace}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 border border-slate-700 font-bold transition-all text-sm disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Recalculate
                </button>
            </div>

            {relevantFleets.map(fleet => {
                const fleetResults = results
                    .filter(r => r.fleetId === fleet.id)
                    .sort((a, b) => (a.points || 0) - (b.points || 0));

                if (fleetResults.length === 0) return null;

                const override = race.raceFleets?.find(rf => rf.fleetId === fleet.id);

                return (
                    <div key={fleet.id} className="bg-slate-800/40 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-5 py-3 bg-slate-800/80 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-white uppercase tracking-tight">{fleet.name}</span>
                                    <span className={badgeBase}>{fleet.scoringMethod}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 overflow-x-auto pb-1 no-scrollbar">
                                    {override?.courseDistance !== undefined && (
                                        <div className={infoPill}>
                                            <Ruler className="h-3 w-3 text-emerald-400/70" />
                                            <span>{override.courseDistance} NM</span>
                                        </div>
                                    )}
                                    {override?.courseType !== undefined && (
                                        <div className={infoPill}>
                                            <Navigation className="h-3 w-3 text-sky-400/70" />
                                            <span className="uppercase">
                                                {override.courseType === 0 ? 'W/L' : override.courseType === 1 ? 'Random' : override.courseType === 2 ? 'Triangle' : 'Olympic'}
                                            </span>
                                        </div>
                                    )}
                                    {override?.startTimeOffset && override.startTimeOffset !== '00:00:00' && (
                                        <div className={infoPill}>
                                            <Clock className="h-3 w-3 text-indigo-400/70" />
                                            <span>+{override.startTimeOffset}</span>
                                        </div>
                                    )}
                                    {(override?.windSpeed || override?.windDirection) && (
                                        <div className={infoPill}>
                                            <Wind className="h-3 w-3 text-amber-400/70" />
                                            <span>{override.windSpeed || 0}KT / {override.windDirection || 0}°</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Fleet Class</div>
                                <div className="text-xs font-medium text-slate-400">{fleetResults.length} Boats Scored</div>
                            </div>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className={tableHeader}>
                                    <tr>
                                        <th className={`${headerCell} w-16`}>Pos</th>
                                        <th className={headerCell}>Sail</th>
                                        <th className={headerCell}>Boat</th>
                                        <th className={headerCell}>Elapsed</th>
                                        <th className={headerCell}>Corrected</th>
                                        <th className={`${headerCell} w-16 text-center`}>Pts</th>
                                        <th className={`${headerCell} w-20 text-center`}>Overall</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {fleetResults.map((result, index) => (
                                        <tr key={result.finishId} className={rowBase}>
                                            <td className="px-5 py-3 font-bold text-white">{index + 1}</td>
                                            <td className="px-5 py-3 text-slate-400">{result.sailNumber}</td>
                                            <td className="px-5 py-3 text-slate-300 font-medium">
                                                {result.boatName}
                                                {result.code && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">{result.code}</span>}
                                                {result.timePenalty && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">PEN</span>}
                                            </td>
                                            <td className="px-5 py-3 text-slate-400">
                                                {result.elapsedDuration ? result.elapsedDuration.substring(0, 8) : '-'}
                                            </td>
                                            <td className="px-5 py-3 text-indigo-300 font-medium">
                                                {result.correctedDuration ? result.correctedDuration.substring(0, 8) : '-'}
                                            </td>
                                            <td className="px-5 py-3 text-emerald-400 font-bold text-center">
                                                {result.points !== null ? result.points : '-'}
                                            </td>
                                            <td className="px-5 py-3 text-slate-500 text-xs font-medium text-center">
                                                {result.overallRank !== null ? result.overallRank : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
