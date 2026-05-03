import React, { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';

import { CertificateResponse } from './useCertificates';

export interface BoatResponse {
    id: number;
    boatName: string;
    sailNumber: string;
    makeModel: string;
    defaultRating: number;
    defaultRatingType: string;
    certificates?: CertificateResponse[];
}

export function useBoats(includeCertificates = false) {
    const [boats, setBoats] = useState<BoatResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isInitialLoad = React.useRef(true);

    const fetchBoats = useCallback(async () => {
        if (isInitialLoad.current) {
            setIsLoading(true);
        }
        setError(null);
        try {
            const data = await apiClient.get<BoatResponse[]>(`/api/boats${includeCertificates ? '?includeCertificates=true' : ''}`);
            setBoats(data);
            isInitialLoad.current = false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch boats');
            console.error("Failed to fetch boats:", err);
        } finally {
            setIsLoading(false);
        }
    }, [includeCertificates]);

    useEffect(() => {
        fetchBoats();
    }, [fetchBoats]);

    return React.useMemo(() => ({
        boats,
        isLoading,
        error,
        refetch: fetchBoats
    }), [boats, isLoading, error, fetchBoats]);
}
