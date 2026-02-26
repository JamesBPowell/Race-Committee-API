'use client';

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import BoatCard from '@/components/BoatCard';
import BoatFormModal, { BoatData } from '@/components/BoatFormModal';
import { useBoats } from '@/hooks/useBoats';
import { apiClient } from '@/lib/api';

export default function MyBoatsPage() {
    const { boats, isLoading, error, refetch } = useBoats();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBoat, setEditingBoat] = useState<BoatData | null>(null);

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
            await apiClient.delete(`/api/boats/${id}`);
            // Optimistically update or refetch
            refetch();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete boat.');
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingBoat(null);
        refetch(); // Refresh the list after an add/edit
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Boats</h1>
                    <p className="text-slate-400">Manage your vessels and their rating certificates.</p>
                </div>
                <Button
                    onClick={handleAddClick}
                    rounded="full"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Boat</span>
                </Button>
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
