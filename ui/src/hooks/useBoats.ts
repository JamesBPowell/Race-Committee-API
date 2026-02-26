import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';

export interface BoatResponse {
    id: number;
    boatName: string;
    sailNumber: string;
    makeModel: string;
    defaultRating: number;
}

export function useBoats() {
    const [boats, setBoats] = useState<BoatResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBoats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<BoatResponse[]>('/api/boats');
            setBoats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch boats');
            console.error("Failed to fetch boats:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBoats();
    }, [fetchBoats]);

    return {
        boats,
        isLoading,
        error,
        refetch: fetchBoats
    };
}
