'use client';

import React, { useState } from 'react';
import { X, Loader2, Wind, Ruler, Navigation } from 'lucide-react';
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
        windSpeed: 0,
        windDirection: 0,
        courseDistance: 0,
        raceFleets: [] as {
            id: number;
            fleetId: number;
            fleetName: string;
            raceNumber: number;
            startTimeOffset: string;
            courseType: CourseType;
            windSpeed: number;
            windDirection: number;
            courseDistance: number;
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
            windSpeed: race.windSpeed ?? 0,
            windDirection: race.windDirection ?? 0,
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
                    windSpeed: rf?.windSpeed ?? race.windSpeed ?? 0,
                    windDirection: rf?.windDirection ?? race.windDirection ?? 0,
                    courseDistance: rf?.courseDistance ?? race.courseDistance ?? 0
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
                windSpeed: formData.windSpeed || null,
                windDirection: formData.windDirection || null,
                courseDistance: formData.courseDistance || null,
                raceFleets: formData.raceFleets.map(rf => ({
                    id: rf.id,
                    fleetId: rf.fleetId,
                    raceNumber: rf.raceNumber,
                    startTimeOffset: rf.startTimeOffset || null,
                    courseType: rf.courseType,
                    windSpeed: rf.windSpeed || null,
                    windDirection: rf.windDirection || null,
                    courseDistance: rf.courseDistance || null
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
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
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
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Race Conditions</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className="flex items-center gap-2 text-[10px]">
                                    <Wind className="w-3 h-3 text-sky-400" />
                                    Wind (kts)
                                </Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.windSpeed}
                                    onChange={(e) => setFormData({ ...formData, windSpeed: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="flex items-center gap-2 text-[10px]">
                                    <Navigation className="w-3 h-3 text-rose-400" />
                                    Dir (deg)
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="359"
                                    value={formData.windDirection}
                                    onChange={(e) => setFormData({ ...formData, windDirection: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <Label className="flex items-center gap-2 text-[10px]">
                                    <Ruler className="w-3 h-3 text-emerald-400" />
                                    Dist (nm)
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

                    {formData.raceFleets && formData.raceFleets.length > 0 && (
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 space-y-4">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Class Overrides</h3>
                            <div className="space-y-4">
                                {formData.raceFleets.map((fleet, index) => (
                                    <div key={fleet.id} className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-white">{fleet.fleetName}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-[10px] m-0">Race #</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={fleet.raceNumber}
                                                        onChange={(e) => {
                                                            const newFleets = [...formData.raceFleets];
                                                            newFleets[index].raceNumber = parseInt(e.target.value) || 1;
                                                            setFormData({ ...formData, raceFleets: newFleets });
                                                        }}
                                                        className="h-7 w-16 text-xs px-2"
                                                    />
                                                </div>
                                                {formData.startType === StartType.Staggered && (
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-[10px] m-0">Start Offset</Label>
                                                        <Input
                                                            type="time"
                                                            step="1"
                                                            value={fleet.startTimeOffset || ''}
                                                            onChange={(e) => {
                                                                const newFleets = [...formData.raceFleets];
                                                                newFleets[index].startTimeOffset = e.target.value;
                                                                setFormData({ ...formData, raceFleets: newFleets });
                                                            }}
                                                            className="h-7 w-28 text-xs px-2"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div>
                                                <Label className="text-[10px]">Course Type</Label>
                                                <select
                                                    value={fleet.courseType}
                                                    onChange={(e) => {
                                                        const newFleets = [...formData.raceFleets];
                                                        newFleets[index].courseType = parseInt(e.target.value);
                                                        setFormData({ ...formData, raceFleets: newFleets });
                                                    }}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                                >
                                                    <option value={CourseType.WindwardLeeward}>W/L</option>
                                                    <option value={CourseType.RandomLeg}>Random</option>
                                                    <option value={CourseType.Triangle}>Triangle</option>
                                                    <option value={CourseType.Olympic}>Olympic</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-[10px]">Wind</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={fleet.windSpeed}
                                                    onChange={(e) => {
                                                        const newFleets = [...formData.raceFleets];
                                                        newFleets[index].windSpeed = parseFloat(e.target.value) || 0;
                                                        setFormData({ ...formData, raceFleets: newFleets });
                                                    }}
                                                    className="h-7 text-xs px-2"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px]">Dir</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="359"
                                                    value={fleet.windDirection}
                                                    onChange={(e) => {
                                                        const newFleets = [...formData.raceFleets];
                                                        newFleets[index].windDirection = parseInt(e.target.value) || 0;
                                                        setFormData({ ...formData, raceFleets: newFleets });
                                                    }}
                                                    className="h-7 text-xs px-2"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px]">Dist (nm)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={fleet.courseDistance}
                                                    onChange={(e) => {
                                                        const newFleets = [...formData.raceFleets];
                                                        newFleets[index].courseDistance = parseFloat(e.target.value) || 0;
                                                        setFormData({ ...formData, raceFleets: newFleets });
                                                    }}
                                                    className="h-7 text-xs px-2"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
