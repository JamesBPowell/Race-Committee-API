import React from 'react';
import { Trophy, Wind, Navigation, Clock, Loader2 } from 'lucide-react';
import { RegattaResponse, ScoringMethod } from '@/hooks/useRegattas';
import { useRegattaResults } from '../../hooks/useRegattaResults';
import { RaceResultTables } from './RaceResultTables';
import { SeriesStandingsTable } from './SeriesStandingsTable';
import { courseLabel } from '../../utils';

interface RegattaResultsViewProps {
    regatta: RegattaResponse;
    myEntryId?: number | null;
}

export function RegattaResultsView({ regatta, myEntryId }: RegattaResultsViewProps) {
    const {
        selectedRaceId,
        setSelectedRaceId,
        raceResults,
        scoredRaces,
        loadingResults,
        computeSeriesStandings
    } = useRegattaResults(regatta);

    if (scoredRaces.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No races scored yet.</p>
                <p className="text-sm opacity-60">Results will appear here once races are completed and scored.</p>
            </div>
        );
    }

    const allRaces = regatta.races || [];

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

            {/* Wind Conditions */}
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

                    {/* Overall Standings */}
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
