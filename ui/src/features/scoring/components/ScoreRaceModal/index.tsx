import React, { useState } from 'react';
import { X, Calculator, AlertTriangle, Save, RefreshCw, Clock } from 'lucide-react';
import { RaceResponse, RegattaResponse } from '@/hooks/useRegattas';
import { useScoreRace } from '../../hooks/useScoreRace';
import { RaceConditions } from './RaceConditions';
import { RecordFinishes } from './RecordFinishes';
import { RaceResults } from './RaceResults';

interface ScoreRaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    race: RaceResponse | null;
    regatta: RegattaResponse;
    defaultTab?: 'record' | 'results';
    onSuccess?: () => void;
}

export function ScoreRaceModal({ isOpen, onClose, race, regatta, defaultTab = 'record', onSuccess }: ScoreRaceModalProps) {
    const [activeTab, setActiveTab] = useState<'record' | 'results'>(defaultTab);
    const { states, actions, helpers } = useScoreRace({ race, regatta, onSuccess, isOpen });

    if (!isOpen || !race) return null;

    const { finishesMap, windSpeed, windDirection, actualStartTime, startDayOffset, results, now, isLoading, error } = states;
    const { setFinishesMap, setWindSpeed, setWindDirection, setActualStartTime, setStartDayOffset, handleRecordFinish, handleSetActualStart, handleScoreRace, handleSaveFinishes } = actions;
    const { getBaseDate, formatTimeToClock } = helpers;

    const tabButtonClass = (isActive: boolean) =>
        `py-3 px-4 font-bold text-sm border-b-2 transition-colors ${isActive ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`;

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
                    <button onClick={() => setActiveTab('record')} className={tabButtonClass(activeTab === 'record')}>Record Finishes</button>
                    <button onClick={() => setActiveTab('results')} className={tabButtonClass(activeTab === 'results')}>Calculated Results</button>
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
                            {/* Race Clock */}
                            <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                                <div className="flex-1 p-5 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-between shadow-lg shadow-indigo-500/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                            <Clock className="h-7 w-7 text-indigo-400" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">RACE CLOCK (TOD)</div>
                                            <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tighter">
                                                {formatTimeToClock(now)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">BASE DATE</div>
                                            <div className="text-sm font-medium text-slate-400">{getBaseDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <RaceConditions
                                windSpeed={windSpeed} setWindSpeed={setWindSpeed}
                                windDirection={windDirection} setWindDirection={setWindDirection}
                                actualStartTime={actualStartTime} setActualStartTime={setActualStartTime}
                                startDayOffset={startDayOffset} setStartDayOffset={setStartDayOffset}
                                onSetActualStart={handleSetActualStart}
                            />

                            <RecordFinishes
                                regatta={regatta}
                                finishesMap={finishesMap}
                                setFinishesMap={setFinishesMap}
                                onRecordFinish={handleRecordFinish}
                            />
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <RaceResults
                            race={race}
                            regatta={regatta}
                            results={results}
                            isLoading={isLoading}
                            onScoreRace={handleScoreRace}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-slate-900 flex justify-between items-center rounded-b-2xl">
                    <span className="text-xs text-slate-500">Changes are saved automatically when calculating scores.</span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors">Close</button>
                        {activeTab === 'record' && (
                            <button
                                onClick={async () => {
                                    setActiveTab('results');
                                    await handleSaveFinishes();
                                }}
                                disabled={isLoading}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center min-w-[140px] disabled:opacity-50"
                            >
                                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Save & Score</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
