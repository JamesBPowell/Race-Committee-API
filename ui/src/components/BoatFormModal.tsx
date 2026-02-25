'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';
import { useRouter } from 'next/navigation';

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

        const url = editingBoat
            ? `${API_BASE_URL}/api/boats/${editingBoat.id}`
            : `${API_BASE_URL}/api/boats`;

        const method = editingBoat ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include' // Important for Identity Cookies
            });

            if (res.ok) {
                onClose();
                router.refresh(); // Tell Next.js to re-fetch Server Components (like the boat list)
            } else {
                setError('Failed to save boat details.');
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
                        <label className="block text-sm font-medium text-slate-300 mb-1">Boat Name <span className="text-rose-400">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.boatName}
                            onChange={(e) => setFormData({ ...formData, boatName: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Relentless"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Sail Number <span className="text-rose-400">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.sailNumber}
                                onChange={(e) => setFormData({ ...formData, sailNumber: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. USA 420"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Make / Model</label>
                            <input
                                type="text"
                                value={formData.makeModel}
                                onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. J/105"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Default Rating</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.defaultRating}
                            onChange={(e) => setFormData({ ...formData, defaultRating: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. 75"
                        />
                        <p className="mt-1 text-xs text-slate-500">Optional. Can be used as a fallback if no certificate is provided.</p>
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
                            {editingBoat ? 'Save Changes' : 'Add Boat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
