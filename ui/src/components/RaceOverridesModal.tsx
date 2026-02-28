'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Ruler, Save, Calendar } from 'lucide-react';
import { useRaces } from '@/hooks/useRaces';
import { RaceResponse, CourseType, FleetResponse, StartType } from '@/hooks/useRegattas';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface RaceOverridesModalProps {
    isOpen: boolean;
    onClose: () => void;
    fleet: FleetResponse | null;
    races: RaceResponse[];
    onSuccess: () => void;
}

interface RaceFleetOverride {
    id: number;
    fleetId: number;
    raceNumber: number;
    startTimeOffset: string | null;
    courseType: CourseType;
    windSpeed: number;
    windDirection: number;
    courseDistance: number;
    includeInOverall: boolean;
}

export default function RaceOverridesModal({ isOpen, onClose, fleet, races, onSuccess }: RaceOverridesModalProps) {
    const { updateRace } = useRaces();
    const [overrides, setOverrides] = useState<Record<number, RaceFleetOverride>>({});
    const [pendingChanges, setPendingChanges] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && fleet && races.length > 0) {
            const initialOverrides: Record<number, RaceFleetOverride> = {};
            races.forEach(race => {
                const rf = race.raceFleets?.find(r => r.fleetId === fleet.id);
                if (rf) {
                    initialOverrides[race.id] = {
                        id: rf.id,
                        fleetId: fleet.id,
                        raceNumber: rf.raceNumber ?? 1,
                        startTimeOffset: rf.startTimeOffset || '',
                        courseType: rf.courseType ?? race.courseType ?? CourseType.WindwardLeeward,
                        windSpeed: rf.windSpeed ?? race.windSpeed ?? 0,
                        windDirection: rf.windDirection ?? race.windDirection ?? 0,
                        courseDistance: rf.courseDistance ?? race.courseDistance ?? 0,
                        includeInOverall: rf.includeInOverall ?? true
                    };
                }
            });
            setOverrides(initialOverrides);
            setPendingChanges(new Set());
        }
    }, [isOpen, fleet, races]);

    if (!isOpen || !fleet) return null;

    const handleFieldChange = (raceId: number, field: keyof RaceFleetOverride, value: string | number | boolean | null) => {
        setOverrides(prev => ({
            ...prev,
            [raceId]: {
                ...prev[raceId],
                [field]: value
            }
        }));
        setPendingChanges(prev => new Set(prev).add(raceId));
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const promises = Array.from(pendingChanges).map(raceId => {
                const override = overrides[raceId];
                const race = races.find(r => r.id === raceId);
                if (!race) return Promise.resolve();

                // Clean up the override data for the API
                const cleanedOverride = { ...override };
                if (!cleanedOverride.startTimeOffset || cleanedOverride.startTimeOffset.trim() === '') {
                    cleanedOverride.startTimeOffset = null;
                }

                return updateRace(raceId, {
                    raceFleets: [cleanedOverride]
                });
            });

            await Promise.all(promises);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to save overrides:", err);
            alert("Failed to save some overrides. Please check console.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container max-w-4xl max-h-[90vh] flex flex-col">
                <div className="modal-header border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                            <Calendar className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Race Overrides: {fleet.name}</h2>
                            <p className="text-xs text-slate-400">Configure class-specific parameters for each race</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        title="Close overrides modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {races.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No races scheduled for this regatta yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {races.map(race => {
                                const override = overrides[race.id];
                                if (!override) return null;

                                return (
                                    <div key={race.id} className="p-4 bg-slate-800/40 rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{race.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                        Start: {race.scheduledStartTime ? new Date(race.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded border border-white/10">
                                                        {race.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="bg-slate-900/50 p-2 rounded-xl flex items-center gap-3 border border-white/5">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] m-0 leading-none">Race #</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={override.raceNumber}
                                                            onChange={(e) => handleFieldChange(race.id, 'raceNumber', parseInt(e.target.value) || 1)}
                                                            className="h-8 w-16 text-xs px-2 bg-slate-800 border-none"
                                                        />
                                                    </div>
                                                    {race.startType === StartType.Staggered && (
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] m-0 leading-none">Start Offset</Label>
                                                            <Input
                                                                type="time"
                                                                step="1"
                                                                value={override.startTimeOffset || ''}
                                                                onChange={(e) => handleFieldChange(race.id, 'startTimeOffset', e.target.value)}
                                                                className="h-8 w-28 text-xs px-2 bg-slate-800 border-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-slate-900/30 p-2 rounded-xl">
                                                <Label className="text-[10px] text-slate-500 mb-1 block">Course Type</Label>
                                                <select
                                                    value={override.courseType}
                                                    onChange={(e) => handleFieldChange(race.id, 'courseType', parseInt(e.target.value))}
                                                    className="w-full bg-slate-800 border-none rounded-lg py-1 px-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                                    title="Select course type"
                                                >
                                                    <option value={CourseType.WindwardLeeward}>Windward/Leeward</option>
                                                    <option value={CourseType.RandomLeg}>Random Leg</option>
                                                    <option value={CourseType.Triangle}>Triangle</option>
                                                    <option value={CourseType.Olympic}>Olympic</option>
                                                </select>
                                            </div>
                                            <div className="bg-slate-900/30 p-2 rounded-xl">
                                                <Label className="text-[10px] text-slate-500 mb-1 flex items-center gap-1.5">
                                                    <Ruler className="w-3 h-3 text-emerald-400" /> Dist (nm)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={override.courseDistance}
                                                    onChange={(e) => handleFieldChange(race.id, 'courseDistance', parseFloat(e.target.value) || 0)}
                                                    className="h-7 text-sm px-2 bg-slate-800 border-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 px-1">
                                            <input
                                                type="checkbox"
                                                id={`include-overall-${race.id}`}
                                                checked={override.includeInOverall}
                                                onChange={(e) => handleFieldChange(race.id, 'includeInOverall', e.target.checked)}
                                                className="w-4 h-4 rounded border-white/10 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 transition-all cursor-pointer"
                                                title="Include this fleet in overall results"
                                            />
                                            <Label htmlFor={`include-overall-${race.id}`} className="text-xs text-slate-400 cursor-pointer font-medium hover:text-slate-300 transition-colors">
                                                Include this fleet in overall race results
                                            </Label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 flex justify-between items-center bg-slate-900/50 shrink-0">
                    <p className="text-xs text-slate-500">
                        {pendingChanges.size > 0 ? `${pendingChanges.size} races modified` : 'No changes pending'}
                    </p>
                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={pendingChanges.size === 0 || isSaving}
                            onClick={handleSaveAll}
                            className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-lg shadow-cyan-900/20"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save All Overrides
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
