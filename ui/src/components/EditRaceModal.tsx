'use client';

import React, { useState } from 'react';
import { X, Loader2, Ruler } from 'lucide-react';
import { useRaces } from '@/hooks/useRaces';
import { RaceResponse, StartType, CourseType, FleetResponse } from '@/hooks/useRegattas';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

// Format UTC date string to local YYYY-MM-DDTHH:mm for datetime-local inputs
function formatDateTimeLocal(utcDateString: string | null | undefined): string {
    if (!utcDateString) return '';
    const d = new Date(utcDateString);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface EditRaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    race: RaceResponse | null;
    fleets: FleetResponse[];
    onSuccess: () => void;
}

export default function EditRaceModal({ isOpen, onClose, race, fleets, onSuccess }: EditRaceModalProps) {
    const { updateRace, isLoading, error } = useRaces();
    const [formData, setFormData] = useState({
        name: '',
        scheduledStartTime: '',
        actualStartTime: '',
        status: 'Scheduled',
        startType: StartType.Staggered,
        courseType: CourseType.WindwardLeeward,
        courseDistance: 0,
        raceFleets: [] as {
            id: number;
            fleetId: number;
            fleetName: string;
            raceNumber: number;
            startTimeOffset: string;
            courseType: CourseType;
            courseDistance: number;
            includeInOverall: boolean;
        }[]
    });
    const [prevRaceId, setPrevRaceId] = useState<number | null>(null);

    // Sync state if race changes (using render-time sync to avoid useEffect lint warnings)
    if (race && race.id !== prevRaceId) {
        setPrevRaceId(race.id);
        setFormData({
            name: race.name || '',
            scheduledStartTime: formatDateTimeLocal(race.scheduledStartTime),
            actualStartTime: formatDateTimeLocal(race.actualStartTime),
            status: race.status || 'Scheduled',
            startType: race.startType ?? StartType.Staggered,
            courseType: race.courseType ?? CourseType.WindwardLeeward,
            courseDistance: race.courseDistance ?? 0,
            raceFleets: fleets.map(f => {
                const rf = race.raceFleets?.find(r => r.fleetId === f.id);
                return {
                    id: rf?.id ?? 0,
                    fleetId: f.id,
                    fleetName: f.name,
                    startTimeOffset: rf?.startTimeOffset || '',
                    raceNumber: rf?.raceNumber ?? 1,
                    courseType: rf?.courseType ?? race.courseType ?? CourseType.WindwardLeeward,
                    courseDistance: rf?.courseDistance ?? race.courseDistance ?? 0,
                    includeInOverall: rf?.includeInOverall ?? true
                };
            })
        });
    }

    if (!isOpen || !race) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateRace(race.id, {
                name: formData.name,
                scheduledStartTime: formData.scheduledStartTime ? new Date(formData.scheduledStartTime).toISOString() : null,
                actualStartTime: formData.actualStartTime ? new Date(formData.actualStartTime).toISOString() : null,
                status: formData.status,
                startType: formData.startType,
                courseType: formData.courseType,
                courseDistance: formData.courseDistance || null,
                raceFleets: formData.raceFleets.map(rf => ({
                    id: rf.id,
                    fleetId: rf.fleetId,
                    raceNumber: rf.raceNumber,
                    startTimeOffset: rf.startTimeOffset || null,
                    courseType: rf.courseType,
                    courseDistance: rf.courseDistance || null,
                    includeInOverall: rf.includeInOverall
                }))
            });

            onSuccess();
            onClose();
        } catch {
            // Error handled by hook
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container max-w-lg">
                <div className="modal-header">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">{race.name || 'Race'} Configuration</h2>
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
                            <Label>Status</Label>
                            <select
                                value={formData.status}
                                title="Race Status"
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="form-select"
                            >
                                <option value="Scheduled">Scheduled</option>
                                <option value="InSequence">In Sequence</option>
                                <option value="Racing">Racing</option>
                                <option value="Completed">Completed</option>
                                <option value="Postponed">Postponed</option>
                                <option value="Abandoned">Abandoned</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Scheduled Start</Label>
                            <Input
                                type="datetime-local"
                                value={formData.scheduledStartTime}
                                onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                                className="[color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <Label>Actual Start</Label>
                            <Input
                                type="datetime-local"
                                value={formData.actualStartTime}
                                onChange={(e) => setFormData({ ...formData, actualStartTime: e.target.value })}
                                className="[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 space-y-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Race Parameters</h3>
                        <div className="grid grid-cols-1">
                            <div>
                                <Label className="flex items-center gap-2 text-[10px]">
                                    <Ruler className="w-3 h-3 text-emerald-400" />
                                    Default Dist (nm)
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.courseDistance}
                                    onChange={(e) => setFormData({ ...formData, courseDistance: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-900/20">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Configuration
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
