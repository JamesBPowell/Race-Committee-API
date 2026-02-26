import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';

export interface RegattaResponse {
    id: number;
    name: string;
    organization: string;
    startDate: string;
    endDate: string | null;
    location: string;
    status: string;
}

export function useRegattas() {
    const [managingRegattas, setManagingRegattas] = useState<RegattaResponse[]>([]);
    const [joinedRegattas, setJoinedRegattas] = useState<RegattaResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchManagingRegattas = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<RegattaResponse[]>('/api/regattas/managing');
            setManagingRegattas(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch managing regattas");
            console.error("Failed to fetch managing regattas:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchJoinedRegattas = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<RegattaResponse[]>('/api/regattas/joined');
            setJoinedRegattas(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch joined regattas");
            console.error("Failed to fetch joined regattas:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchManagingRegattas();
        fetchJoinedRegattas();
    }, [fetchManagingRegattas, fetchJoinedRegattas]);

    return {
        managingRegattas,
        joinedRegattas,
        isLoading,
        error,
        refetchManaging: fetchManagingRegattas,
        refetchJoined: fetchJoinedRegattas
    };
}
