'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface RegattaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RegattaFormModal({ isOpen, onClose }: RegattaFormModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        startDate: '',
        endDate: '',
        location: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const payload = {
            ...formData,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(formData.startDate).toISOString()
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/regattas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (res.ok) {
                // Reset form
                setFormData({ name: '', organization: '', startDate: '', endDate: '', location: '' });
                onClose();
                router.refresh();
            } else {
                setError('Failed to create regatta.');
            }
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
                    <h2 className="text-xl font-bold text-white">Create New Regatta</h2>
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
                        <Label required>Regatta Name</Label>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Annual Summer Regatta"
                        />
                    </div>

                    <div>
                        <Label required>Organization / Hosting Club</Label>
                        <Input
                            required
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            placeholder="e.g. New Orleans Yacht Club"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label required>Start Date</Label>
                            <Input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="[color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div>
                        <Label required>Location</Label>
                        <Input
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. New Orleans, LA"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Regatta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
