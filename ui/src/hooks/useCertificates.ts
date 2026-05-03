'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { API_BASE_URL } from '../lib/constants';

export interface CertificateResponse {
    id: number;
    boatId: number;
    certificateType: string;
    certificateNumber: string;
    issueDate: string | null;
    validUntil: string | null;
    ratingSpinnaker: number | null;
    ratingNonSpinnaker: number | null;
    ratingType: string;
    normalizedToD: number | null;
    configuration: string | null;
    fileName: string | null;
    hasFile: boolean;
    fileDownloadUrl: string | null;
    sourceUrl: string | null;
    parseStatus: string;
    schemaVersion: string | null;
}

export interface CertificateSearchResult {
    sku: string;
    certificateNumber: string;
    boatName: string;
    sailNumber: string;
    boatType: string;
    displayText: string;
    url: string;
}

export function useCertificates(boatId: number | null) {
    const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isInitialLoad = React.useRef(true);

    const fetchCertificates = useCallback(async () => {
        if (!boatId) return;
        if (isInitialLoad.current) {
            setIsLoading(true);
        }
        setError(null);
        try {
            const data = await apiClient.get<CertificateResponse[]>(`/api/boats/${boatId}/certificates`);
            setCertificates(data);
            isInitialLoad.current = false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch certificates');
        } finally {
            setIsLoading(false);
        }
    }, [boatId]);

    useEffect(() => {
        fetchCertificates();
    }, [fetchCertificates]);

    const createManual = useCallback(async (data: {
        certificateType: string;
        certificateNumber?: string;
        issueDate?: string;
        validUntil?: string;
        ratingSpinnaker?: number;
        ratingNonSpinnaker?: number;
    }) => {
        if (!boatId) throw new Error('No boat selected');
        const result = await apiClient.post<CertificateResponse>(`/api/boats/${boatId}/certificates`, data);
        await fetchCertificates();
        return result;
    }, [boatId, fetchCertificates]);

    const importCertificate = useCallback(async (data: { certificateType: string; sourceUrl: string }) => {
        if (!boatId) throw new Error('No boat selected');
        const result = await apiClient.post<CertificateResponse>(`/api/boats/${boatId}/certificates/import`, data);
        await fetchCertificates();
        return result;
    }, [boatId, fetchCertificates]);

    const uploadFile = useCallback(async (certId: number, file: File) => {
        if (!boatId) throw new Error('No boat selected');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/boats/${boatId}/certificates/${certId}/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Upload failed');
        }

        await fetchCertificates();
        return response.json();
    }, [boatId, fetchCertificates]);

    const updateCertificate = useCallback(async (certId: number, data: {
        certificateNumber?: string;
        issueDate?: string;
        validUntil?: string;
        ratingSpinnaker?: number;
        ratingNonSpinnaker?: number;
    }) => {
        if (!boatId) throw new Error('No boat selected');
        await apiClient.put(`/api/boats/${boatId}/certificates/${certId}`, data);
        await fetchCertificates();
    }, [boatId, fetchCertificates]);

    const deleteCertificate = useCallback(async (certId: number) => {
        if (!boatId) throw new Error('No boat selected');
        await apiClient.delete(`/api/boats/${boatId}/certificates/${certId}`);
        await fetchCertificates();
    }, [boatId, fetchCertificates]);

    const refreshCertificate = useCallback(async (certId: number) => {
        if (!boatId) throw new Error('No boat selected');
        const result = await apiClient.post<CertificateResponse>(`/api/boats/${boatId}/certificates/${certId}/refresh`, {});
        await fetchCertificates();
        return result;
    }, [boatId, fetchCertificates]);

    return React.useMemo(() => ({
        certificates,
        isLoading,
        error,
        refetch: fetchCertificates,
        createManual,
        importCertificate,
        uploadFile,
        updateCertificate,
        deleteCertificate,
        refreshCertificate,
    }), [
        certificates,
        isLoading,
        error,
        fetchCertificates,
        createManual,
        importCertificate,
        uploadFile,
        updateCertificate,
        deleteCertificate,
        refreshCertificate,
    ]);
}

export function useCertificateSearch() {
    const [results, setResults] = useState<CertificateSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback(async (type: string, query: string) => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data = await apiClient.get<CertificateSearchResult[]>(
                `/api/certificates/search?type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}`
            );
            setResults(data);
        } catch (err) {
            console.error('Certificate search failed:', err);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
    }, []);

    return React.useMemo(() => ({ 
        results, 
        isSearching, 
        search, 
        clearResults 
    }), [results, isSearching, search, clearResults]);
}
