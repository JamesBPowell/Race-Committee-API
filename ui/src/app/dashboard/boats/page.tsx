'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';
import BoatCard from '@/components/BoatCard';
import BoatFormModal, { BoatData } from '@/components/BoatFormModal';

export default function MyBoatsPage() {
    const [boats, setBoats] = useState<BoatData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBoat, setEditingBoat] = useState<BoatData | null>(null);

    const fetchBoats = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/boats`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Pass the auth cookie
                cache: 'no-store'
            });

            if (res.ok) {
                const data = await res.json();
                setBoats(data);
            } else {
                setError('Failed to load your boats. Are you signed in?');
            }
        } catch {
            setError('A network error occurred while fetching boats.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBoats();
    }, []);

    const handleAddClick = () => {
        setEditingBoat(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (boat: BoatData) => {
        setEditingBoat(boat);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id: number) => {
        if (!confirm('Are you sure you want to delete this boat?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/boats/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                setBoats(boats.filter(b => b.id !== id));
            } else {
                alert('Failed to delete boat.');
            }
        } catch {
            alert('A network error occurred.');
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingBoat(null);
        fetchBoats(); // Refresh the list after an add/edit
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Boats</h1>
                    <p className="text-slate-400">Manage your vessels and their rating certificates.</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex justify-center items-center gap-2 px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)] shadow-cyan-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Boat</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/20 text-rose-200 border border-rose-500/50 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
            ) : boats.length === 0 && !error ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-3xl text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-white/10">
                        <Plus className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No boats found</h3>
                    <p className="text-slate-400 max-w-sm mb-6">You haven&apos;t added any boats to your profile yet. Add your first boat to start entering regattas.</p>
                    <button
                        onClick={handleAddClick}
                        className="text-cyan-400 hover:text-cyan-300 font-medium pb-1 border-b-2 border-cyan-400/30 hover:border-cyan-400 transition-colors"
                    >
                        + Add your first boat
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boats.map((boat) => (
                        <BoatCard
                            key={boat.id}
                            boat={boat}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            )}

            <BoatFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                editingBoat={editingBoat}
            />
        </div>
    );
}
