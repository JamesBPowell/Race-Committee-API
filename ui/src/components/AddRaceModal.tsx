'use client';

import React, { useState } from 'react';
import { X, Loader2, Ruler, Wind } from 'lucide-react';
import { useRaces } from '@/hooks/useRaces';
import { StartType, CourseType, FleetResponse, ScoringMethod } from '@/hooks/useRegattas';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

function courseLabel(ct: CourseType | null | undefined): string {
    if (ct == null) return '';
    const labels: Record<number, string> = {
        [CourseType.WindwardLeeward]: 'W/L',
        [CourseType.RandomLeg]: 'Random Leg',
        [CourseType.MostlyLW]: 'Mostly L/W',
        [CourseType.MostlyReach]: 'Mostly Reach',
        [CourseType.CircularRandom]: 'Circular Random',
        [CourseType.MostlyWW]: 'Mostly W/W',
        [CourseType.WL5050]: 'W/L 50/50',
        [CourseType.WL6040]: 'W/L 60/40',
        [CourseType.ClosedCourse]: 'Closed Course',
        [CourseType.BayviewMac]: 'Bayview Mac',
        [CourseType.ChicagoMac]: 'Chicago Mac',
        [CourseType.PacificCup]: 'Pacific Cup',
        [CourseType.Transpac]: 'Transpac',
        [CourseType.Triangle]: 'Triangle',
        [CourseType.Olympic]: 'Olympic'
    };
    return labels[ct] ?? `Course ${ct}`;
}

interface AddRaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    regattaId: number;
    fleets: FleetResponse[];
    onSuccess: () => void;
}

export default function AddRaceModal({ isOpen, onClose, regattaId, fleets, onSuccess }: AddRaceModalProps) {
    const { createRace, isLoading, error } = useRaces();
    const [formData, setFormData] = useState({
        name: 'Race 1',
        scheduledStartTime: '',
        status: 'Scheduled',
        startType: StartType.Staggered,
        courseType: CourseType.WindwardLeeward,
        courseDistance: 0,
        windSpeed: 0,
        windDirection: 0,
        raceFleets: [] as {
            fleetId: number;
            fleetName: string;
            raceNumber: number;
            startTimeOffset: string;
            courseType: CourseType | null;
            courseDistance: number | null;
            windSpeed: number | null;
            windDirection: number | null;
            includeInOverall: boolean;
        }[]
    });
    const [wasOpen, setWasOpen] = useState(false);

    if (isOpen && !wasOpen) {
        setWasOpen(true);
        setFormData(prev => ({
            ...prev,
            raceFleets: fleets.map(f => ({
                fleetId: f.id,
                fleetName: f.name,
                raceNumber: 1,
                startTimeOffset: '',
                courseType: null,
                courseDistance: null,
                windSpeed: null,
                windDirection: null,
                includeInOverall: true
            }))
        }));
    } else if (!isOpen && wasOpen) {
        setWasOpen(false);
    }

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createRace(regattaId, {
                name: formData.name,
                scheduledStartTime: formData.scheduledStartTime ? new Date(formData.scheduledStartTime).toISOString() : null,
                status: formData.status,
                startType: formData.startType,
                courseType: formData.courseType,
                courseDistance: formData.courseDistance !== undefined ? formData.courseDistance : null,
                windSpeed: formData.windSpeed !== undefined ? formData.windSpeed : null,
                windDirection: formData.windDirection !== undefined ? formData.windDirection : null,
                raceFleets: formData.raceFleets.map(rf => ({
                    fleetId: rf.fleetId,
                    raceNumber: rf.raceNumber,
                    startTimeOffset: rf.startTimeOffset || null,
                    courseType: rf.courseType,
                    courseDistance: rf.courseDistance || null,
                    windSpeed: rf.windSpeed,
                    windDirection: rf.windDirection,
                    includeInOverall: rf.includeInOverall
                }))
            });

            setFormData({
                name: 'Race ' + (parseInt(formData.name.replace(/\D/g, '')) + 1 || 1),
                scheduledStartTime: '',
                status: 'Scheduled',
                startType: StartType.Staggered,
                courseType: CourseType.WindwardLeeward,
                courseDistance: 0,
                windSpeed: 0,
                windDirection: 0,
                raceFleets: []
            });
            onSuccess();
            onClose();
        } catch {
            // Error is handled by useRaces hook
        }
    };

    const SCORING_METHOD_COURSE_TYPES: Record<number, CourseType[]> = {
        [ScoringMethod.OneDesign]: [CourseType.WindwardLeeward, CourseType.Triangle, CourseType.Olympic],
        [ScoringMethod.PHRF_TOT]: [CourseType.WindwardLeeward, CourseType.RandomLeg, CourseType.Triangle, CourseType.Olympic],
        [ScoringMethod.PHRF_TOD]: [CourseType.WindwardLeeward, CourseType.RandomLeg, CourseType.Triangle, CourseType.Olympic],
        [ScoringMethod.ORR_EZ_GPH]: Object.values(CourseType).filter(v => typeof v === 'number') as CourseType[],
        [ScoringMethod.ORR_EZ_PC]: [
            CourseType.WindwardLeeward, CourseType.RandomLeg, CourseType.MostlyLW, CourseType.MostlyReach,
            CourseType.CircularRandom, CourseType.MostlyWW, CourseType.WL5050, CourseType.WL6040,
            CourseType.Triangle, CourseType.Olympic
        ],
        [ScoringMethod.ORR_Full_PC]: [
            CourseType.WindwardLeeward, CourseType.RandomLeg, CourseType.MostlyLW, CourseType.MostlyReach,
            CourseType.CircularRandom, CourseType.MostlyWW, CourseType.WL5050, CourseType.WL6040,
            CourseType.Triangle, CourseType.Olympic
        ],
        [ScoringMethod.Portsmouth]: [CourseType.WindwardLeeward, CourseType.RandomLeg, CourseType.Triangle, CourseType.Olympic]
    };

    // Calculate which course types are supported by ALL fleets in this race
    const supportedByAll = Object.values(CourseType)
        .filter(v => typeof v === 'number')
        .filter(ct => fleets.every(f => (SCORING_METHOD_COURSE_TYPES[f.scoringMethod] || []).includes(ct as CourseType)));

    return (
        <div className="modal-overlay">
            <div className="modal-container max-w-lg">
                <div className="modal-header">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Configure New Race</h2>
                    <button onClick={onClose} title="Close Modal" className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label required>Race Name</Label>
                            <Input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Start Type</Label>
                            <select
                                value={formData.startType}
                                title="Start Type"
                                onChange={(e) => setFormData({ ...formData, startType: parseInt(e.target.value) })}
                                className="form-select"
                            >
                                <option value={StartType.Single_Gun}>Single Gun (All Fleets)</option>
                                <option value={StartType.Staggered}>Staggered (Sequential)</option>
                                <option value={StartType.Pursuit}>Pursuit (Steeplechase)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Course Type</Label>
                            <select
                                value={formData.courseType}
                                title="Course Type"
                                onChange={(e) => setFormData({ ...formData, courseType: parseInt(e.target.value) })}
                                className={`form-select ${!supportedByAll.includes(formData.courseType) ? 'border-rose-500/50 text-rose-300' : ''}`}
                            >
                                <optgroup label="Supported by all classes">
                                    {supportedByAll.map(ct => (
                                        <option key={ct} value={ct}>{courseLabel(ct as CourseType)}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Other course types">
                                    {Object.values(CourseType)
                                        .filter(v => typeof v === 'number' && !supportedByAll.includes(v))
                                        .map(ct => (
                                            <option key={ct} value={ct}>{courseLabel(ct as CourseType)} (Limited Support)</option>
                                        ))
                                    }
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <Label>Scheduled Start</Label>
                            <Input
                                type="datetime-local"
                                value={formData.scheduledStartTime}
                                onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                                className="scheme-dark"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Default Race Parameters</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="flex items-center gap-2 text-[10px]">
                                    <Ruler className="w-3 h-3 text-emerald-400" />
                                    Dist (nm)
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.courseDistance}
                                    onChange={(e) => setFormData({ ...formData, courseDistance: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="flex items-center gap-2 text-[10px]">
                                    <Wind className="w-3 h-3 text-cyan-400" />
                                    Wind (kts)
                                </Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.windSpeed}
                                    onChange={(e) => setFormData({ ...formData, windSpeed: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="flex items-center gap-2 text-[10px]">
                                    <Wind className="w-3 h-3 text-indigo-400" />
                                    Dir (°)
                                </Label>
                                <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="360"
                                    value={formData.windDirection}
                                    onChange={(e) => setFormData({ ...formData, windDirection: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <p className="mt-3 text-[9px] text-slate-500 italic">Required for deterministic ORR-EZ Performance Curve scoring.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} variant="gradient">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Create Race
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
