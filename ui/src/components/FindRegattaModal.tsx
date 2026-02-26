import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

interface FindRegattaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Regatta {
    id: number;
    name: string;
    organization: string;
    startDate: string;
    location: string;
}

interface Boat {
    id: number;
    boatName: string;
    sailNumber: string;
}

export default function FindRegattaModal({ isOpen, onClose, onSuccess }: FindRegattaModalProps) {
    const [regattas, setRegattas] = useState<Regatta[]>([]);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [selectedRegattaId, setSelectedRegattaId] = useState<string>('');
    const [selectedBoatId, setSelectedBoatId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setError('');
            setSelectedRegattaId('');
            setSelectedBoatId('');
            fetchRegattas();
            fetchBoats();
        }
    }, [isOpen]);

    const fetchRegattas = async () => {
        try {
            const data = await apiClient.get<Regatta[]>('/api/regattas');
            setRegattas(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBoats = async () => {
        try {
            const data = await apiClient.get<Boat[]>('/api/boats');
            setBoats(data);
            if (data.length > 0) {
                setSelectedBoatId(data[0].id.toString());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await apiClient.post(`/api/regattas/${selectedRegattaId}/entries`, {
                boatId: parseInt(selectedBoatId)
            });

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                onSuccess();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join regatta or a network error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400"></div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Search className="w-6 h-6 text-indigo-400" />
                            Find Race
                        </h2>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Entry Submitted!</h3>
                            <p className="text-slate-400 text-center">Your boat is now entered in the regatta.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleJoin} className="space-y-5">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <Label required>Select Regatta</Label>
                                <select
                                    required
                                    value={selectedRegattaId}
                                    onChange={e => setSelectedRegattaId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                                >
                                    <option value="" disabled>Choose an event to join...</option>
                                    {regattas.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} ({new Date(r.startDate).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label required>Select Your Boat</Label>
                                {boats.length === 0 ? (
                                    <div className="p-3 rounded-lg bg-slate-800 text-slate-400 text-sm border border-slate-700">
                                        You don&apos;t have any boats yet. Go to your My Boats page to add one first.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={selectedBoatId}
                                        onChange={e => setSelectedBoatId(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                                    >
                                        <option value="" disabled>Choose your vessel...</option>
                                        {boats.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.boatName} - {b.sailNumber}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={boats.length === 0}
                                colorTheme="indigo"
                                fullWidth
                                size="lg"
                                isLoading={isLoading}
                                className="mt-6"
                            >
                                Join Regatta
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
