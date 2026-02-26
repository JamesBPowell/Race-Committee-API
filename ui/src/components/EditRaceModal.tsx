'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRaces } from '@/hooks/useRaces';
import { RaceResponse } from '@/hooks/useRegattas';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface EditRaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    race: RaceResponse | null;
    onSuccess: () => void;
}

export default function EditRaceModal({ isOpen, onClose, race, onSuccess }: EditRaceModalProps) {
    const { updateRace, isLoading, error } = useRaces();
    const [formData, setFormData] = useState({
        raceNumber: 1,
        scheduledStartTime: '',
        actualStartTime: '',
        status: 'Scheduled'
    });

    useEffect(() => {
        if (race) {
            setFormData({
                raceNumber: race.raceNumber,
                scheduledStartTime: race.scheduledStartTime ? new Date(race.scheduledStartTime).toISOString().slice(0, 16) : '',
                actualStartTime: race.actualStartTime ? new Date(race.actualStartTime).toISOString().slice(0, 16) : '',
                status: race.status || 'Scheduled'
            });
        }
    }, [race]);

    if (!isOpen || !race) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateRace(race.id, {
                raceNumber: formData.raceNumber,
                scheduledStartTime: formData.scheduledStartTime ? new Date(formData.scheduledStartTime).toISOString() : null,
                actualStartTime: formData.actualStartTime ? new Date(formData.actualStartTime).toISOString() : null,
                status: formData.status
            });

            onSuccess();
            onClose();
        } catch (err) {
            // Error handled by hook
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white">Edit Race {race.raceNumber}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-500/20 text-rose-200 border border-rose-500/50 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <Label required>Race Number</Label>
                        <Input
                            type="number"
                            min="1"
                            required
                            value={formData.raceNumber}
                            onChange={(e) => setFormData({ ...formData, raceNumber: parseInt(e.target.value) || 1 })}
                        />
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

                    <div>
                        <Label>Status</Label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all appearance-none"
                        >
                            <option value="Scheduled">Scheduled</option>
                            <option value="InSequence">In Sequence</option>
                            <option value="Racing">Racing</option>
                            <option value="Completed">Completed</option>
                            <option value="Postponed">Postponed</option>
                            <option value="Abandoned">Abandoned</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
