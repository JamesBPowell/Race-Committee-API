import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';

export interface RaceResponse {
    id: number;
    regattaId: number;
    fleetId: number | null;
    raceNumber: number;
    scheduledStartTime: string | null;
    actualStartTime: string | null;
    status: string;
}

export interface EntryResponse {
    id: number;
    boatName: string;
    boatType: string;
    sailNumber: string;
    registrationStatus: string;
}

export interface FleetResponse {
    id: number;
    name: string;
    sequenceOrder: number;
}

export interface RegattaResponse {
    id: number;
    name: string;
    organization: string;
    startDate: string;
    endDate: string | null;
    location: string;
    status: string;
    boatsEnteredCount?: number;
    classesCount?: number;
    scheduledRacesCount?: number;
    races: RaceResponse[];
    entries?: EntryResponse[];
    fleets?: FleetResponse[];
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

export function useRegatta(id: string | number) {
    const [regatta, setRegatta] = useState<RegattaResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRegatta = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<RegattaResponse>(`/api/regattas/${id}`);
            setRegatta(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch regatta");
            console.error(`Failed to fetch regatta ${id}:`, err);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchRegatta();
    }, [fetchRegatta]);

    const updateRegatta = async (data: Partial<RegattaResponse>) => {
        setIsLoading(true);
        try {
            await apiClient.put(`/api/regattas/${id}`, data);
            await fetchRegatta();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update regatta");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        regatta,
        isLoading,
        error,
        refetch: fetchRegatta,
        updateRegatta
    };
}

export function useFleets() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createFleet = async (regattaId: number, data: { name: string, sequenceOrder: number }) => {
        setIsLoading(true);
        try {
            await apiClient.post(`/api/fleets/regatta/${regattaId}`, data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create fleet");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateFleet = async (id: number, data: { name: string, sequenceOrder: number }) => {
        setIsLoading(true);
        try {
            await apiClient.put(`/api/fleets/${id}`, data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update fleet");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteFleet = async (id: number) => {
        setIsLoading(true);
        try {
            await apiClient.delete(`/api/fleets/${id}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to delete fleet");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createFleet,
        updateFleet,
        deleteFleet,
        isLoading,
        error
    };
}
