import React from 'react';
import { Anchor, Edit2, Trash2 } from 'lucide-react';

import { BoatData } from './BoatFormModal';

interface BoatCardProps {
    boat: BoatData;
    onEdit: (boat: BoatData) => void;
    onDelete: (id: number) => void;
}

export default function BoatCard({ boat, onEdit, onDelete }: BoatCardProps) {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors flex flex-col h-full">
            <div className="p-6 flex-grow">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
                        <Anchor className="w-6 h-6" />
                    </div>
                    {boat.defaultRating && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            Rating: {boat.defaultRating}
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{boat.boatName}</h3>

                <div className="space-y-1 mt-3">
                    <p className="text-sm text-slate-400 flex justify-between">
                        <span>Sail Number:</span>
                        <span className="text-slate-200 font-medium">{boat.sailNumber}</span>
                    </p>
                    {boat.makeModel && (
                        <p className="text-sm text-slate-400 flex justify-between">
                            <span>Make/Model:</span>
                            <span className="text-slate-200">{boat.makeModel}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-slate-900/50 px-6 py-3 border-t border-white/5 flex justify-end gap-2">
                <button
                    onClick={() => onEdit(boat)}
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                    title="Edit Boat"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(boat.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                    title="Delete Boat"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
