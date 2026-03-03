import React from 'react';
import { Wind, Navigation, Clock } from 'lucide-react';

interface RaceConditionsProps {
    windSpeed: number;
    setWindSpeed: (v: number) => void;
    windDirection: number;
    setWindDirection: (v: number) => void;
    actualStartTime: string;
    setActualStartTime: (v: string) => void;
    startDayOffset: number;
    setStartDayOffset: (v: number) => void;
    onSetActualStart: () => void;
}

const inputBase = "bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2";
const selectBase = "bg-slate-900 border border-slate-700 text-white text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 appearance-none cursor-pointer hover:bg-slate-800";
const labelGroup = "flex items-center gap-2";
const labelText = "text-sm font-bold text-slate-300";

export function RaceConditions({
    windSpeed, setWindSpeed,
    windDirection, setWindDirection,
    actualStartTime, setActualStartTime,
    startDayOffset, setStartDayOffset,
    onSetActualStart
}: RaceConditionsProps) {
    return (
        <div className="p-4 bg-slate-800/60 rounded-xl border border-white/10 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
                <div className={labelGroup}>
                    <Wind className="h-4 w-4 text-sky-400" />
                    <label className={labelText}>Wind Strength (kts):</label>
                </div>
                <input
                    type="number"
                    step="0.1"
                    title="Wind Speed"
                    placeholder="0.0"
                    className={`w-20 ${inputBase}`}
                    value={windSpeed}
                    onChange={e => setWindSpeed(parseFloat(e.target.value) || 0)}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className={labelGroup}>
                    <Navigation className="h-4 w-4 text-rose-400" />
                    <label className={labelText}>Wind Direction (deg):</label>
                </div>
                <input
                    type="number"
                    max="359"
                    title="Wind Direction"
                    placeholder="000"
                    className={`w-20 ${inputBase}`}
                    value={windDirection}
                    onChange={e => setWindDirection(parseInt(e.target.value) || 0)}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className={labelGroup}>
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <label className={labelText}>Actual Start:</label>
                </div>
                <div className="flex items-center gap-1.5">
                    <select
                        className={selectBase}
                        value={startDayOffset}
                        title="Start Day"
                        onChange={e => setStartDayOffset(parseInt(e.target.value))}
                    >
                        <option value={0}>Day 1</option>
                        <option value={1}>Day 2</option>
                        <option value={2}>Day 3</option>
                        <option value={3}>Day 4</option>
                        <option value={4}>Day 5</option>
                    </select>
                    <input
                        type="text"
                        placeholder="HH:MM:SS"
                        title="Actual Start Time"
                        className={`w-24 ${inputBase}`}
                        value={actualStartTime}
                        onChange={e => setActualStartTime(e.target.value)}
                    />
                    <button
                        onClick={onSetActualStart}
                        title="Set to Current Time"
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="ml-auto text-[10px] text-slate-500 font-mono italic">CAPTURE CONDITIONS AT TIME OF RACE</div>
        </div>
    );
}
