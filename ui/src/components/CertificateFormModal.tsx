'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Search, ExternalLink, CheckCircle2, XCircle, RefreshCw, FileText, Loader2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCertificates, useCertificateSearch, CertificateResponse } from '@/hooks/useCertificates';
import { API_BASE_URL } from '@/lib/constants';

interface CertificateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    boatId: number;
    editingCert: CertificateResponse | null;
    onCertificatesChanged: () => void;
}

type CertificateType = 'PHRF' | 'ORR' | 'ORREZ';

export default function CertificateFormModal({ isOpen, onClose, boatId, editingCert, onCertificatesChanged }: CertificateFormModalProps) {
    const { importCertificate, refreshCertificate, deleteCertificate, createManual, updateCertificate, uploadFile } = useCertificates(editingCert?.boatId || boatId);
    const confirm = useConfirm();
    const [step, setStep] = useState<'type' | 'form' | 'import'>(editingCert ? 'form' : 'type');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentCert, setCurrentCert] = useState<CertificateResponse | null>(editingCert);
    const { results: searchResults, isSearching, search, clearResults } = useCertificateSearch();

    // Update currentCert when editingCert prop changes (e.g. initial open)
    useEffect(() => {
        setCurrentCert(editingCert);
        if (editingCert) setStep('form');
    }, [editingCert]);

    const [certType, setCertType] = useState<CertificateType>('PHRF');
    const [importResult, setImportResult] = useState<CertificateResponse | null>(null);

    // PHRF form data
    const [phrfData, setPhrfData] = useState({
        certificateNumber: '',
        ratingSpinnaker: '',
        ratingNonSpinnaker: '',
        issueDate: '',
        validUntil: '',
    });

    // ORR/ORREZ form data
    const [orrInputMode, setOrrInputMode] = useState<'search' | 'url'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [manualUrl, setManualUrl] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // File upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state on open/close
    useEffect(() => {
        if (isOpen) {
            if (editingCert) {
                setCertType(editingCert.certificateType as CertificateType);
                setPhrfData({
                    certificateNumber: editingCert.certificateNumber || '',
                    ratingSpinnaker: editingCert.ratingSpinnaker?.toString() || '',
                    ratingNonSpinnaker: editingCert.ratingNonSpinnaker?.toString() || '',
                    issueDate: editingCert.issueDate?.split('T')[0] || '',
                    validUntil: editingCert.validUntil?.split('T')[0] || '',
                });
                setStep('form');
            } else {
                setStep('type');
                setPhrfData({ certificateNumber: '', ratingSpinnaker: '', ratingNonSpinnaker: '', issueDate: '', validUntil: '' });
                setManualUrl('');
                setSearchQuery('');
            }
            setError('');
            setImportResult(null);
            setSelectedFile(null);
            clearResults();
        }
    }, [isOpen, editingCert, clearResults]);

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            clearResults();
            return;
        }
        const timeout = setTimeout(() => {
            search(certType, searchQuery);
            setShowDropdown(true);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, certType, search, clearResults]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (!isOpen) return null;

    const handleTypeSelect = (type: CertificateType) => {
        setCertType(type);
        setStep('form');
    };

    const handlePhrfSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            if (editingCert) {
                await updateCertificate(editingCert.id, {
                    certificateNumber: phrfData.certificateNumber || undefined,
                    ratingSpinnaker: phrfData.ratingSpinnaker ? parseFloat(phrfData.ratingSpinnaker) : undefined,
                    ratingNonSpinnaker: phrfData.ratingNonSpinnaker ? parseFloat(phrfData.ratingNonSpinnaker) : undefined,
                    issueDate: phrfData.issueDate || undefined,
                    validUntil: phrfData.validUntil || undefined,
                });
            } else {
                const result = await createManual({
                    certificateType: 'PHRF',
                    certificateNumber: phrfData.certificateNumber || undefined,
                    ratingSpinnaker: phrfData.ratingSpinnaker ? parseFloat(phrfData.ratingSpinnaker) : undefined,
                    ratingNonSpinnaker: phrfData.ratingNonSpinnaker ? parseFloat(phrfData.ratingNonSpinnaker) : undefined,
                    issueDate: phrfData.issueDate || undefined,
                    validUntil: phrfData.validUntil || undefined,
                });

                // Upload file if selected
                if (selectedFile && result?.id) {
                    await uploadFile(result.id, selectedFile);
                }
            }
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save certificate');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrrImport = async (url: string) => {
        setIsLoading(true);
        setError('');
        setImportResult(null);
        try {
            const result = await importCertificate({
                certificateType: certType,
                sourceUrl: url,
            });
            setCurrentCert(result);
            onCertificatesChanged();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import certificate');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSelect = (result: { url: string }) => {
        setShowDropdown(false);
        setSearchQuery('');
        handleOrrImport(result.url);
    };

    const handleManualUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualUrl) handleOrrImport(manualUrl);
    };

    const handleRefresh = async () => {
        if (!currentCert) return;
        setIsLoading(true);
        setError('');
        try {
            const result = await refreshCertificate(currentCert.id);
            setCurrentCert(result);
            onCertificatesChanged();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh certificate');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingCert) return;
        if (await confirm({
            title: 'Remove Certificate?',
            message: 'Are you sure you want to remove this certificate? This action cannot be undone.',
            confirmText: 'Remove',
            variant: 'danger'
        })) {

        setIsLoading(true);
        setError('');
        try {
            await deleteCertificate(editingCert.id);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete certificate');
        } finally {
            setIsLoading(false);
        }
    }
};

    const renderTypeSelector = () => (
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400">Choose the type of certificate to add:</p>
            <div className="grid grid-cols-1 gap-3">
                {([
                    { type: 'PHRF' as const, label: 'PHRF', desc: 'Manual entry with optional PDF upload' },
                    { type: 'ORREZ' as const, label: 'ORR-EZ', desc: 'Import from regattaman.com' },
                    { type: 'ORR' as const, label: 'ORR', desc: 'Import from regattaman.com' },
                ]).map(({ type, label, desc }) => (
                    <button
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-500/30">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block text-white font-semibold">{label}</span>
                            <span className="block text-xs text-slate-400">{desc}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderPhrfForm = () => (
        <form onSubmit={handlePhrfSubmit} className="p-6 space-y-4">
            <div>
                <Label>Certificate Number</Label>
                <Input
                    value={phrfData.certificateNumber}
                    onChange={(e) => setPhrfData({ ...phrfData, certificateNumber: e.target.value })}
                    placeholder="e.g. PHRF-SE-2026-001"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Spinnaker Rating</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={phrfData.ratingSpinnaker}
                        onChange={(e) => setPhrfData({ ...phrfData, ratingSpinnaker: e.target.value })}
                        placeholder="e.g. 108"
                    />
                </div>
                <div>
                    <Label>Non-Spinnaker Rating</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={phrfData.ratingNonSpinnaker}
                        onChange={(e) => setPhrfData({ ...phrfData, ratingNonSpinnaker: e.target.value })}
                        placeholder="e.g. 126"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Issue Date</Label>
                    <Input
                        type="date"
                        value={phrfData.issueDate}
                        onChange={(e) => setPhrfData({ ...phrfData, issueDate: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Valid Until</Label>
                    <Input
                        type="date"
                        value={phrfData.validUntil}
                        onChange={(e) => setPhrfData({ ...phrfData, validUntil: e.target.value })}
                    />
                </div>
            </div>

            {/* File upload */}
            {!editingCert && (
                <div>
                    <Label>Certificate PDF (for RC verification)</Label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-cyan-500/30 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <Upload className="w-8 h-8 text-slate-500 mb-2" />
                        {selectedFile ? (
                            <span className="text-sm text-cyan-400">{selectedFile.name}</span>
                        ) : (
                            <span className="text-sm text-slate-500">Click to upload PDF, JPEG, or PNG</span>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                </div>
            )}

            <div className="pt-4 flex justify-between items-center">
                {editingCert ? (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Certificate
                    </button>
                ) : (
                    <div />
                )}
                <div className="flex gap-3">
                    <Button type="button" variant="ghost" onClick={() => editingCert ? onClose() : setStep('type')}>
                        {editingCert ? 'Cancel' : 'Back'}
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {editingCert ? 'Save Changes' : 'Add Certificate'}
                    </Button>
                </div>
            </div>
        </form>
    );

    const renderOrrForm = () => (
        <div className="p-6 space-y-4">
            {/* Edit mode with refresh */}
            {currentCert && (
                <div className="space-y-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Certificate</span>
                            <span className="text-white font-medium">{currentCert.certificateNumber}</span>
                        </div>
                        {currentCert.certificateType === 'ORR' ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">GPH</span>
                                <span className="text-white">{currentCert.ratingSpinnaker ?? '—'}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Spin (PHRF-BM)</span>
                                    <span className="text-white">{currentCert.ratingSpinnaker ?? '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Non-Spin (PHRF-BM)</span>
                                    <span className="text-white">{currentCert.ratingNonSpinnaker ?? '—'}</span>
                                </div>
                            </>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Status</span>
                            <ParseStatusBadge status={currentCert.parseStatus} />
                        </div>
                    </div>

                    {currentCert.sourceUrl && (
                        <div className="flex gap-2">
                            <Button onClick={handleRefresh} isLoading={isLoading} variant="ghost" className="flex-1">
                                <RefreshCw className="w-4 h-4 mr-2" /> Re-parse from Source
                            </Button>
                            {currentCert.sourceContentPath ? (
                                <a
                                    href={`${API_BASE_URL}/api/boats/${currentCert.boatId}/certificates/${currentCert.id}/mhtml`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex-1"
                                >
                                    <FileText className="w-4 h-4" /> View MHTML Certificate
                                </a>
                            ) : (
                                <a
                                    href={currentCert.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-cyan-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex-1"
                                >
                                    <ExternalLink className="w-4 h-4" /> View on Regattaman
                                </a>
                            )}
                        </div>
                    )}

                    <div className="pt-2 flex justify-between items-center">
                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Certificate
                        </button>
                        <Button variant="ghost" onClick={onClose}>Close</Button>
                    </div>
                </div>
            )}

            {/* Import mode — new certificate */}
            {!currentCert && (
                <>
                    {/* Toggle: Search / URL */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                        <button
                            onClick={() => setOrrInputMode('search')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${orrInputMode === 'search' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Search className="w-4 h-4 inline mr-1.5" />Search Certificate
                        </button>
                        <button
                            onClick={() => setOrrInputMode('url')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${orrInputMode === 'url' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <ExternalLink className="w-4 h-4 inline mr-1.5" />Paste URL
                        </button>
                    </div>

                    {orrInputMode === 'search' && (
                        <div ref={searchRef} className="relative">
                            <Label>Search by boat name or sail number</Label>
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${certType === 'ORREZ' ? 'ORR-EZ' : 'ORR'} certificates...`}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-9">
                                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                </div>
                            )}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="mt-4 w-full max-h-[400px] overflow-y-auto bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
                                    {searchResults.map((r) => (
                                        <button
                                            key={r.sku}
                                            onClick={() => handleSearchSelect(r)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors"
                                        >
                                            <span className="block text-sm text-white font-medium">{r.displayText}</span>
                                            <span className="block text-xs text-slate-400">{r.boatType}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showDropdown && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                <div className="mt-4 w-full bg-white/5 border border-white/10 rounded-xl p-8 text-sm text-slate-400 text-center">
                                    No certificates found
                                </div>
                            )}
                        </div>
                    )}

                    {orrInputMode === 'url' && (
                        <form onSubmit={handleManualUrlSubmit}>
                            <Label>Regattaman.com Certificate URL</Label>
                            <Input
                                value={manualUrl}
                                onChange={(e) => setManualUrl(e.target.value)}
                                placeholder="https://www.regattaman.com/cert_form.php?sku=..."
                            />
                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setStep('type')}>Back</Button>
                                <Button type="submit" isLoading={isLoading} disabled={!manualUrl}>
                                    Import Certificate
                                </Button>
                            </div>
                        </form>
                    )}

                    {orrInputMode === 'search' && (
                        <div className="pt-2 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setStep('type')}>Back</Button>
                        </div>
                    )}
                </>
            )}

            {/* Import result summary */}
            {importResult && (
                <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <ParseStatusBadge status={importResult.parseStatus} />
                            <span className="text-white font-semibold">Certificate Imported</span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Certificate #</span>
                                <span className="text-white">{importResult.certificateNumber || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Spinnaker Rating</span>
                                <span className="text-white">{importResult.ratingSpinnaker ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Non-Spin Rating</span>
                                <span className="text-white">{importResult.ratingNonSpinnaker ?? '—'}</span>
                            </div>
                            {importResult.configuration && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Configuration</span>
                                    <span className="text-white">{importResult.configuration}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={onClose}>Done</Button>
                    </div>
                </div>
            )}

            {isLoading && !importResult && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mr-3" />
                    <span className="text-slate-400">Importing and parsing certificate...</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white">
                        {editingCert ? 'Certificate Details' : step === 'type' ? 'Add Certificate' : `Add ${certType === 'ORREZ' ? 'ORR-EZ' : certType} Certificate`}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-rose-500/20 text-rose-200 border border-rose-500/50 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Content */}
                {step === 'type' && renderTypeSelector()}
                {step === 'form' && certType === 'PHRF' && renderPhrfForm()}
                {step === 'form' && (certType === 'ORR' || certType === 'ORREZ') && renderOrrForm()}
            </div>
        </div>
    );
}

function ParseStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'Success':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Parsed
                </span>
            );
        case 'Failed':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <XCircle className="w-3 h-3" /> Parse Failed
                </span>
            );
        case 'Manual':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Manual
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
                    {status}
                </span>
            );
    }
}
