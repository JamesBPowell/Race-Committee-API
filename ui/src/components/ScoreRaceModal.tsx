import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Calculator, AlertTriangle, Save, RefreshCw, Wind, Navigation } from 'lucide-react';
import { RaceResponse, RegattaResponse } from '@/hooks/useRegattas';
import { useRaces, RecordFinishDto, FinishResultDto } from '@/hooks/useRaces';

interface ScoreRaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    race: RaceResponse | null;
    regatta: RegattaResponse;
    defaultTab?: 'record' | 'results';
}

export function ScoreRaceModal({ isOpen, onClose, race, regatta, defaultTab = 'record' }: ScoreRaceModalProps) {
    const { saveFinishes, scoreRace, getRaceResults, isLoading, error } = useRaces();
    const [activeTab, setActiveTab] = useState<'record' | 'results'>(defaultTab);

    // Initial map setup moved to useMemo to allow useState initialization
    const initialFinishesMap = useMemo(() => {
        if (!race || !regatta.entries) return {};
        const initialMap: Record<number, RecordFinishDto> = {};
        const participatingFleetIds = race.raceFleets?.map(rf => rf.fleetId) || [];
        const relevantEntries = regatta.entries.filter(e =>
            e.fleetId && (participatingFleetIds.length === 0 || participatingFleetIds.includes(e.fleetId))
        );
        relevantEntries.forEach(entry => {
            initialMap[entry.id] = {
                entryId: entry.id,
                finishTime: '',
                timePenalty: '',
                pointPenalty: 0,
                code: '',
                notes: ''
            };
        });
        return initialMap;
    }, [race, regatta.entries]);

    // State for recording finishes - initialized from memo to avoid useEffect cascade
    const [finishesMap, setFinishesMap] = useState<Record<number, RecordFinishDto>>(initialFinishesMap);

    // State for race conditions (wind) - initialized from props
    const [windSpeed, setWindSpeed] = useState<number>(race?.windSpeed || 0);
    const [windDirection, setWindDirection] = useState<number>(race?.windDirection || 0);

    // State for displaying results
    const [results, setResults] = useState<FinishResultDto[]>([]);

    const handleScoreRace = useCallback(async () => {
        if (!race) return;
        try {
            const computedResults = await scoreRace(race.id);
            setResults(computedResults);
        } catch (err) {
            console.error(err);
        }
    }, [race, scoreRace]);

    const loadExistingResults = useCallback(async (raceId: number) => {
        try {
            const data = await getRaceResults(raceId);
            setResults(data);

            // If we have results, populate the finishesMap so editing is easy
            if (data.length > 0) {
                setFinishesMap((prev: Record<number, RecordFinishDto>) => {
                    const newMap = { ...prev };
                    data.forEach((result: FinishResultDto) => {
                        let localTimeStr = '';
                        if (result.finishTime) {
                            const d = new Date(result.finishTime);
                            const hours = String(d.getHours()).padStart(2, '0');
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            const seconds = String(d.getSeconds()).padStart(2, '0');
                            localTimeStr = `${hours}:${minutes}:${seconds}`;
                        }
                        newMap[result.entryId] = {
                            entryId: result.entryId,
                            finishTime: localTimeStr,
                            code: result.code || '',
                            timePenalty: result.timePenalty || '',
                            pointPenalty: 0, // DTO doesn't expose point penalty directly in results yet, using 0
                            notes: result.notes || ''
                        };
                    });
                    return newMap;
                });
            }
        } catch (err) {
            console.error(err);
        }
    }, [getRaceResults]);

    // Initialize results when opened
    useEffect(() => {
        if (isOpen && race) {
            loadExistingResults(race.id);
        }
    }, [isOpen, race, loadExistingResults]);

    const handleSaveFinishes = async () => {
        if (!race) return;

        // Convert map to array and format finish time correctly
        let year = new Date().getFullYear();
        let month = String(new Date().getMonth() + 1).padStart(2, '0');
        let day = String(new Date().getDate()).padStart(2, '0');

        if (race.actualStartTime) {
            const d = new Date(race.actualStartTime);
            year = d.getFullYear();
            month = String(d.getMonth() + 1).padStart(2, '0');
            day = String(d.getDate()).padStart(2, '0');
        }
        const localDateString = `${year}-${month}-${day}`;

        const finishesArr = Object.values(finishesMap).map(f => {
            const dto: RecordFinishDto = { ...f };
            // Empty string to null for nullable fields
            if (!dto.finishTime) dto.finishTime = null;
            if (!dto.code) dto.code = '';
            // timePenalty must be null or a valid TimeSpan string - empty string breaks ASP.NET deserialization
            if (!dto.timePenalty || dto.timePenalty.trim() === '') {
                delete dto.timePenalty;
            }
            if (!dto.pointPenalty) dto.pointPenalty = null;
            if (!dto.notes) dto.notes = '';

            // If finishTime is provided (e.g. HH:mm:ss), parse as local time and convert to ISO string (UTC) for backend
            if (dto.finishTime) {
                try {
                    // Combine local date and local time "YYYY-MM-DDTHH:mm:ss"
                    const localDateTimeStr = `${localDateString}T${dto.finishTime}`;
                    const localDateTime = new Date(localDateTimeStr);
                    if (!isNaN(localDateTime.getTime())) {
                        dto.finishTime = localDateTime.toISOString();
                    }
                } catch { }
            }
            return dto;
        });

        const success = await saveFinishes(race.id, {
            windSpeed,
            windDirection,
            finishes: finishesArr
        });
        if (success) {
            // Auto-trigger calculation
            await handleScoreRace();
            setActiveTab('results');
        }
    };

    if (!isOpen || !race) return null;

    const participatingFleetIds = race.raceFleets?.map(rf => rf.fleetId) || [];
    const relevantFleets = (regatta.fleets || []).filter(f => participatingFleetIds.length === 0 || participatingFleetIds.includes(f.id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <Calculator className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Score: {race.name}</h2>
                            <p className="text-xs text-slate-400">
                                {race.status === 'Racing' ? <span className="text-emerald-400 font-bold">In Progress</span> : race.status}
                                {race.actualStartTime && ` • Started: ${new Date(race.actualStartTime).toLocaleTimeString()}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} title="Close Modal" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 px-6">
                    <button
                        onClick={() => setActiveTab('record')}
                        className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'record' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                    >
                        Record Finishes
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'results' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                    >
                        Calculated Results
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-200">{error}</p>
                        </div>
                    )}

                    {activeTab === 'record' && (
                        <div className="space-y-8">
                            <div className="p-4 bg-slate-800/60 rounded-xl border border-white/10 flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Wind className="h-4 w-4 text-sky-400" />
                                        <label className="text-sm font-bold text-slate-300">Wind Strength (kts):</label>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.1"
                                        title="Wind Speed"
                                        placeholder="0.0"
                                        className="w-20 bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                        value={windSpeed}
                                        onChange={e => setWindSpeed(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Navigation className="h-4 w-4 text-rose-400" />
                                        <label className="text-sm font-bold text-slate-300">Wind Direction (deg):</label>
                                    </div>
                                    <input
                                        type="number"
                                        max="359"
                                        title="Wind Direction"
                                        placeholder="000"
                                        className="w-20 bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                        value={windDirection}
                                        onChange={e => setWindDirection(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="ml-auto text-[10px] text-slate-500 font-mono italic">CAPTURE CONDITIONS AT TIME OF RACE</div>
                            </div>

                            {relevantFleets.map(fleet => {
                                const fleetEntries = (regatta.entries || []).filter(e => e.fleetId === fleet.id);
                                if (fleetEntries.length === 0) return null;

                                return (
                                    <div key={fleet.id} className="bg-slate-800/40 rounded-xl border border-white/5 overflow-hidden">
                                        <div className="px-5 py-3 bg-slate-800/80 border-b border-white/5 font-bold flex justify-between items-center">
                                            <span className="text-indigo-300">{fleet.name} Fleet</span>
                                            <span className="text-xs font-normal text-slate-400">{fleetEntries.length} entries</span>
                                        </div>
                                        <div className="p-0">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                                    <tr>
                                                        <th className="px-5 py-3 font-medium">Sail</th>
                                                        <th className="px-5 py-3 font-medium">Boat</th>
                                                        <th className="px-5 py-3 font-medium w-48" id="time-header">Time (HH:MM:SS)</th>
                                                        <th className="px-5 py-3 font-medium w-32" id="status-header">Status Code</th>
                                                        <th className="px-5 py-3 font-medium" id="penalty-header">Penalty</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {fleetEntries.map(entry => {
                                                        const fState = finishesMap[entry.id];
                                                        if (!fState) return null;

                                                        return (
                                                            <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                                                                <td className="px-5 py-3 font-bold text-slate-300">{entry.sailNumber}</td>
                                                                <td className="px-5 py-3 text-slate-400">{entry.boatName}</td>
                                                                <td className="px-5 py-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="HH:MM:SS"
                                                                        title="Finish Time"
                                                                        aria-labelledby="time-header"
                                                                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                                                        value={fState.finishTime || ''}
                                                                        onChange={e => setFinishesMap({ ...finishesMap, [entry.id]: { ...fState, finishTime: e.target.value } })}
                                                                        disabled={!!fState.code && fState.code !== 'OCS' && fState.code !== 'SCP'}
                                                                    />
                                                                </td>
                                                                <td className="px-5 py-2">
                                                                    <select
                                                                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                                                        value={fState.code || ''}
                                                                        title="Status Code"
                                                                        onChange={e => setFinishesMap({ ...finishesMap, [entry.id]: { ...fState, code: e.target.value } })}
                                                                    >
                                                                        <option value="">Finished</option>
                                                                        <option value="DNF">DNF (Did Not Finish)</option>
                                                                        <option value="DNS">DNS (Did Not Start)</option>
                                                                        <option value="DNC">DNC (Did Not Compete)</option>
                                                                        <option value="OCS">OCS (On Course Side)</option>
                                                                        <option value="DSQ">DSQ (Disqualified)</option>
                                                                        <option value="RET">RET (Retired)</option>
                                                                        <option value="SCP">SCP (Scoring Penalty)</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-5 py-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="+mm:ss"
                                                                        title="Time Penalty"
                                                                        aria-labelledby="penalty-header"
                                                                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                                                        value={fState.timePenalty || ''}
                                                                        onChange={e => setFinishesMap({ ...finishesMap, [entry.id]: { ...fState, timePenalty: e.target.value } })}
                                                                    />
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
                    )}

                    {activeTab === 'results' && (
                        <div className="space-y-8">
                            {results.length === 0 ? (
                                <div className="text-center py-12 rounded-xl border border-dashed border-slate-700">
                                    <Calculator className="h-10 w-10 text-slate-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">No Results Calculated</h3>
                                    <p className="text-slate-400 mb-6">Record finishes and trigger scoring to see results.</p>
                                    <button
                                        onClick={handleScoreRace}
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-bold transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        Calculate Scores
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={handleScoreRace}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 border border-slate-700 font-bold transition-all text-sm disabled:opacity-50"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                            Recalculate
                                        </button>
                                    </div>
                                    {relevantFleets.map(fleet => {
                                        const fleetResults = results.filter((r: FinishResultDto) => r.fleetId === fleet.id).sort((a: FinishResultDto, b: FinishResultDto) => (a.points || 0) - (b.points || 0));
                                        if (fleetResults.length === 0) return null;

                                        return (
                                            <div key={fleet.id} className="bg-slate-800/40 rounded-xl border border-white/5 overflow-hidden">
                                                <div className="px-5 py-3 bg-slate-800/80 border-b border-white/5 font-bold flex justify-between items-center">
                                                    <span className="text-indigo-300">{fleet.name} Fleet Results</span>
                                                    <span className="text-xs font-normal text-slate-400">{fleet.scoringMethod}</span>
                                                </div>
                                                <div className="p-0">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                                            <tr>
                                                                <th className="px-5 py-3 font-medium w-16">Pos</th>
                                                                <th className="px-5 py-3 font-medium">Sail</th>
                                                                <th className="px-5 py-3 font-medium">Boat</th>
                                                                <th className="px-5 py-3 font-medium">Elapsed</th>
                                                                <th className="px-5 py-3 font-medium">Corrected</th>
                                                                <th className="px-5 py-3 font-medium">Pts</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {fleetResults.map((result, index) => (
                                                                <tr key={result.finishId} className="hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-5 py-3 font-bold text-white">{index + 1}</td>
                                                                    <td className="px-5 py-3 text-slate-400">{result.sailNumber}</td>
                                                                    <td className="px-5 py-3 text-slate-300 font-medium">
                                                                        {result.boatName}
                                                                        {result.code && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">{result.code}</span>}
                                                                        {result.timePenalty && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">PEN</span>}
                                                                    </td>
                                                                    <td className="px-5 py-3 text-slate-400">{result.elapsedDuration ? result.elapsedDuration.substring(0, 8) : '-'}</td>
                                                                    <td className="px-5 py-3 text-indigo-300 font-medium">{result.correctedDuration ? result.correctedDuration.substring(0, 8) : '-'}</td>
                                                                    <td className="px-5 py-3 text-emerald-400 font-bold">{result.points !== null ? result.points : '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-slate-900 flex justify-between items-center rounded-b-2xl">
                    <span className="text-xs text-slate-500">Changes are saved automatically when calculating scores.</span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                        >
                            Close
                        </button>
                        {activeTab === 'record' && (
                            <button
                                onClick={handleSaveFinishes}
                                disabled={isLoading}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center min-w-[140px] disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save & Score
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

