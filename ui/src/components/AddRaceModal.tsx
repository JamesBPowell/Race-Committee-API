'use client';

import React, { useState } from 'react';
import { X, Loader2, Wind, Ruler, Navigation } from 'lucide-react';
import { useRaces } from '@/hooks/useRaces';
import { StartType, CourseType, FleetResponse } from '@/hooks/useRegattas';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

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
        raceFleets: [] as {
            fleetId: number;
            fleetName: string;
            raceNumber: number;
            startTimeOffset: string;
            courseType: CourseType;
            courseDistance: number;
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
                courseType: prev.courseType,
                courseDistance: prev.courseDistance
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
                courseDistance: formData.courseDistance || null,
                raceFleets: formData.raceFleets.map(rf => ({
                    fleetId: rf.fleetId,
                    raceNumber: rf.raceNumber,
                    startTimeOffset: rf.startTimeOffset || null,
                    courseType: rf.courseType,
                    courseDistance: rf.courseDistance || null
                }))
            });

            setFormData({
                name: 'Race ' + (parseInt(formData.name.replace(/\D/g, '')) + 1 || 1),
                scheduledStartTime: '',
                status: 'Scheduled',
                startType: StartType.Staggered,
                courseType: CourseType.WindwardLeeward,
                courseDistance: 0,
                raceFleets: []
            });
            onSuccess();
            onClose();
        } catch {
            // Error is handled by useRaces hook
        }
    };

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
                                className="form-select"
                            >
                                <option value={CourseType.WindwardLeeward}>Windward-Leeward</option>
                                <option value={CourseType.RandomLeg}>Random Leg</option>
                                <option value={CourseType.Triangle}>Triangle</option>
                                <option value={CourseType.Olympic}>Olympic</option>
                            </select>
                        </div>
                        <div>
                            <Label>Scheduled Start</Label>
                            <Input
                                type="datetime-local"
                                value={formData.scheduledStartTime}
                                onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                                className="[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 space-y-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Race Parameters</h3>
                        <div className="col-span-3">
                            <Label className="flex items-center gap-2 text-[10px]">
                                <Ruler className="w-3 h-3 text-emerald-400" />
                                Default Dist (nm)
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.courseDistance}
                                onChange={(e) => setFormData({ ...formData, courseDistance: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-900/20">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Create Race
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
