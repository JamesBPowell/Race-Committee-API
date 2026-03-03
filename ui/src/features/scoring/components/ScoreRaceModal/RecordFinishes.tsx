import React from 'react';
import { Save } from 'lucide-react';
import { RegattaResponse } from '@/hooks/useRegattas';
import { RecordFinishDto } from '@/hooks/useRaces';

interface RecordFinishesProps {
    regatta: RegattaResponse;
    finishesMap: Record<number, RecordFinishDto & { dayOffset: number }>;
    setFinishesMap: React.Dispatch<React.SetStateAction<Record<number, RecordFinishDto & { dayOffset: number }>>>;
    onRecordFinish: (entryId: number) => void;
}

const tableHeader = "text-xs text-slate-400 uppercase bg-slate-900/50";
const headerCell = "px-5 py-3 font-medium";
const rowBase = "hover:bg-slate-800/30 transition-colors";
const inputBase = "bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2";
const selectBase = "bg-slate-900 border border-slate-700 text-white text-[10px] rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 min-w-[70px] appearance-none cursor-pointer hover:bg-slate-800";

export function RecordFinishes({ regatta, finishesMap, setFinishesMap, onRecordFinish }: RecordFinishesProps) {
    const relevantFleets = regatta.fleets || [];

    return (
        <div className="space-y-8">
            {relevantFleets.map(fleet => {
                const fleetEntries = (regatta.entries || []).filter(e => e.fleetId === fleet.id);
                if (fleetEntries.length === 0) return null;

                return (
                    <div key={fleet.id} className="bg-slate-800/40 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-5 py-3 bg-slate-800/80 border-b border-white/5 font-bold flex justify-between items-center">
                            <span className="text-indigo-300">{fleet.name} Fleet</span>
                            <span className="text-xs font-normal text-slate-400">{fleetEntries.length} entries</span>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className={tableHeader}>
                                    <tr>
                                        <th className={`${headerCell} w-20`}>Sail</th>
                                        <th className={headerCell}>Boat</th>
                                        <th className={`${headerCell} w-80`}>Finish Time (ToD)</th>
                                        <th className={`${headerCell} w-40`}>Status Code</th>
                                        <th className={`${headerCell} w-32`}>Penalty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {fleetEntries.map(entry => {
                                        const fState = finishesMap[entry.id];
                                        if (!fState) return null;

                                        return (
                                            <tr key={entry.id} className={rowBase}>
                                                <td className="px-5 py-3 font-bold text-slate-300">{entry.sailNumber}</td>
                                                <td className="px-5 py-3 text-slate-400">{entry.boatName}</td>
                                                <td className="px-5 py-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <select
                                                            className={selectBase}
                                                            value={fState.dayOffset}
                                                            title="Finish Day"
                                                            onChange={e => {
                                                                const val = parseInt(e.target.value);
                                                                setFinishesMap(prev => ({
                                                                    ...prev,
                                                                    [entry.id]: { ...prev[entry.id], dayOffset: val }
                                                                }));
                                                            }}
                                                        >
                                                            <option value={0}>Day 1</option>
                                                            <option value={1}>Day 2</option>
                                                            <option value={2}>Day 3</option>
                                                            <option value={3}>Day 4</option>
                                                            <option value={4}>Day 5</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            placeholder="Clock Time"
                                                            title="Finish Time"
                                                            aria-label="Finish Time"
                                                            className={`w-full font-mono ${inputBase}`}
                                                            value={fState.finishTime || ''}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setFinishesMap(prev => ({
                                                                    ...prev,
                                                                    [entry.id]: { ...prev[entry.id], finishTime: val }
                                                                }));
                                                            }}
                                                            disabled={!!fState.code && fState.code !== 'OCS' && fState.code !== 'SCP'}
                                                        />
                                                        <button
                                                            onClick={() => onRecordFinish(entry.id)}
                                                            disabled={!!fState.code && fState.code !== 'OCS' && fState.code !== 'SCP'}
                                                            title="Record Current Clock"
                                                            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg transition-colors group disabled:opacity-30"
                                                        >
                                                            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2">
                                                    <select
                                                        className={`w-full ${inputBase}`}
                                                        value={fState.code || ''}
                                                        title="Status Code"
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setFinishesMap(prev => ({
                                                                ...prev,
                                                                [entry.id]: { ...prev[entry.id], code: val }
                                                            }));
                                                        }}
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
                                                        className={`w-full ${inputBase}`}
                                                        value={fState.timePenalty || ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setFinishesMap(prev => ({
                                                                ...prev,
                                                                [entry.id]: { ...prev[entry.id], timePenalty: val }
                                                            }));
                                                        }}
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
    );
}
