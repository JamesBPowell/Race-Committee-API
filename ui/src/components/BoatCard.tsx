import React, { useState } from 'react';
import { Anchor, Edit2, Trash2, Plus, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { BoatData } from './BoatFormModal';
import { CertificateResponse } from '@/hooks/useCertificates';
import CertificateFormModal from './CertificateFormModal';

interface BoatCardProps {
    boat: BoatData;
    certificates: CertificateResponse[];
    onEdit: (boat: BoatData) => void;
    onDelete: (id: number) => void;
    onCertificatesChanged: () => void;
}

function CertTypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        PHRF: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
        ORR: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        ORREZ: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    };
    const labels: Record<string, string> = {
        PHRF: 'PHRF',
        ORR: 'ORR',
        ORREZ: 'ORR-EZ',
    };
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${colors[type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
            {labels[type] || type}
        </span>
    );
}

export default function BoatCard({ boat, certificates, onEdit, onDelete, onCertificatesChanged }: BoatCardProps) {
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [editingCert, setEditingCert] = useState<CertificateResponse | null>(null);

    const handleAddCert = () => {
        setEditingCert(null);
        setIsCertModalOpen(true);
    };

    const handleEditCert = (cert: CertificateResponse) => {
        setEditingCert(cert);
        setIsCertModalOpen(true);
    };

    const handleCertModalClose = () => {
        setIsCertModalOpen(false);
        setEditingCert(null);
        onCertificatesChanged();
    };

    return (
        <>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors flex flex-col h-full">
                <div className="p-6 flex-grow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
                            <Anchor className="w-6 h-6" />
                        </div>
                        {boat.defaultRating && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {boat.defaultRatingType === 'SecondsPerMile' || boat.defaultRatingType === 'GPH' ? 'GPH: ' : 'PHRF: '}{boat.defaultRating}
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

                    {/* Certificates section */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Certificates
                                {certificates.length > 0 && (
                                    <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                                        {certificates.length}
                                    </span>
                                )}
                            </span>
                            <button
                                onClick={handleAddCert}
                                className="p-1 text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors"
                                title="Add Certificate"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {certificates.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No certificates added</p>
                        ) : (
                            <div className="space-y-1.5">
                                {certificates.map((cert) => (
                                    <button
                                        key={cert.id}
                                        onClick={() => handleEditCert(cert)}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors text-left"
                                    >
                                        <CertTypeBadge type={cert.certificateType} />
                                        <span className="text-sm text-white truncate flex-1">
                                            {cert.certificateNumber || 'No #'}
                                        </span>
                                        <div className="text-right">
                                            {cert.ratingSpinnaker != null && (
                                                <div className="text-sm text-white tabular-nums leading-none">
                                                    {cert.ratingSpinnaker}
                                                </div>
                                            )}
                                            {cert.normalizedToD != null && cert.ratingType === 'PHRF' && (
                                                <div className="text-[10px] text-slate-500 tabular-nums mt-0.5">
                                                    {cert.normalizedToD} ToD
                                                </div>
                                            )}
                                        </div>
                                        {cert.hasFile ? (
                                            <FileText className="w-3.5 h-3.5 text-amber-400/60" />
                                        ) : cert.sourceUrl ? (
                                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400/60" />
                                        ) : null}
                                    </button>
                                ))}
                            </div>
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

            {isCertModalOpen && (
                <CertificateFormModal
                    isOpen={isCertModalOpen}
                    onClose={handleCertModalClose}
                    boatId={boat.id}
                    editingCert={editingCert}
                    onCertificatesChanged={onCertificatesChanged}
                />
            )}
        </>
    );
}
