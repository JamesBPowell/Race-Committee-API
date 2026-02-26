'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export interface BoatData {
    id: number;
    boatName: string;
    sailNumber: string;
    makeModel: string;
    defaultRating?: number;
}

interface BoatFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingBoat: BoatData | null;
}

export default function BoatFormModal({ isOpen, onClose, editingBoat }: BoatFormModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        boatName: '',
        sailNumber: '',
        makeModel: '',
        defaultRating: ''
    });

    useEffect(() => {
        if (editingBoat) {
            setFormData({
                boatName: editingBoat.boatName || '',
                sailNumber: editingBoat.sailNumber || '',
                makeModel: editingBoat.makeModel || '',
                defaultRating: editingBoat.defaultRating ? editingBoat.defaultRating.toString() : ''
            });
        } else {
            setFormData({ boatName: '', sailNumber: '', makeModel: '', defaultRating: '' });
        }
        setError('');
    }, [editingBoat, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const payload = {
            ...formData,
            defaultRating: formData.defaultRating ? parseFloat(formData.defaultRating) : null
        };

        try {
            if (editingBoat) {
                await apiClient.put(`/api/boats/${editingBoat.id}`, payload);
            } else {
                await apiClient.post('/api/boats', payload);
            }

            onClose();
            router.refresh(); // Tell Next.js to re-fetch Server Components (like the boat list)
        } catch {
            setError('A network error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white">
                        {editingBoat ? 'Edit Boat' : 'Add New Boat'}
                    </h2>
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
                        <Label required>Boat Name</Label>
                        <Input
                            required
                            value={formData.boatName}
                            onChange={(e) => setFormData({ ...formData, boatName: e.target.value })}
                            placeholder="e.g. Relentless"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label required>Sail Number</Label>
                            <Input
                                required
                                value={formData.sailNumber}
                                onChange={(e) => setFormData({ ...formData, sailNumber: e.target.value })}
                                placeholder="e.g. USA 420"
                            />
                        </div>
                        <div>
                            <Label>Make / Model</Label>
                            <Input
                                value={formData.makeModel}
                                onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                                placeholder="e.g. J/105"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Default Rating</Label>
                        <Input
                            type="number"
                            step="0.1"
                            value={formData.defaultRating}
                            onChange={(e) => setFormData({ ...formData, defaultRating: e.target.value })}
                            placeholder="e.g. 75"
                        />
                        <p className="mt-1 text-xs text-slate-500">Optional. Can be used as a fallback if no certificate is provided.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                        >
                            {editingBoat ? 'Save Changes' : 'Add Boat'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
