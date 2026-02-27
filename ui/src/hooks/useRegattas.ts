import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';

export enum ScoringMethod {
    OneDesign = 0,
    PHRF_TOT = 1,
    PHRF_TOD = 2,
    ORR_EZ_GPH = 3,
    ORR_EZ_PC = 4,
    ORR_Full_PC = 5,
    Portsmouth = 6
}

export enum StartType {
    Single_Gun = 0,
    Staggered = 1,
    Pursuit = 2
}

export enum CourseType {
    WindwardLeeward = 0,
    RandomLeg = 1,
    Triangle = 2,
    Olympic = 3
}

export interface RaceFleetResponse {
    id: number;
    fleetId: number;
    fleetName: string;
    raceNumber?: number | null;
    startTimeOffset?: string | null;
    courseType?: CourseType | null;
    windSpeed?: number | null;
    windDirection?: number | null;
    courseDistance?: number | null;
}

export interface RaceResponse {
    id: number;
    regattaId: number;
    fleetId: number | null;
    name: string;
    scheduledStartTime: string | null;
    actualStartTime: string | null;
    status: string;
    startType: StartType;
    courseType: CourseType;
    windSpeed: number | null;
    windDirection: number | null;
    courseDistance: number | null;
    raceFleets?: RaceFleetResponse[];
}

export interface EntryResponse {
    id: number;
    fleetId?: number | null;
    boatName: string;
    boatType: string;
    sailNumber: string;
    ownerName: string;
    rating?: number | null;
    registrationStatus: string;
}

export interface FleetResponse {
    id: number;
    name: string;
    sequenceOrder: number;
    scoringMethod: ScoringMethod;
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

    const updateEntry = async (entryId: number, data: { fleetId?: number | null, registrationStatus: string }) => {
        setIsLoading(true);
        try {
            await apiClient.put(`/api/regattas/${id}/entries/${entryId}`, data);
            await fetchRegatta();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update entry");
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
        updateRegatta,
        updateEntry
    };
}

export function useFleets() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createFleet = async (regattaId: number, data: { name: string, sequenceOrder: number, scoringMethod: ScoringMethod }) => {
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

    const updateFleet = async (id: number, data: { name: string, sequenceOrder: number, scoringMethod: ScoringMethod }) => {
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
