import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { RaceResponse, StartType, CourseType } from './useRegattas';

export interface RecordFinishDto {
    entryId: number;
    finishTime?: string | null;
    timePenalty?: string | null;
    pointPenalty?: number | null;
    code?: string;
    notes?: string;
}

export interface RecordRaceFinishes {
    windSpeed?: number | null;
    windDirection?: number | null;
    actualStartTime?: string | null;
    finishes: RecordFinishDto[];
}

export interface FinishResultDto {
    finishId: number;
    raceId: number;
    entryId: number;
    fleetId: number;
    boatName: string;
    sailNumber: string;
    fleetName: string;
    finishTime?: string | null;
    elapsedDuration?: string | null;
    correctedDuration?: string | null;
    timePenalty?: string | null;
    code?: string;
    notes?: string;
    points?: number | null;
    overallPoints?: number | null;
    overallRank?: number | null;
    scoringMethodUsed: string;
}

export function useRaces() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createRace = useCallback(async (regattaId: number | string, data: {
        name: string;
        scheduledStartTime?: string | null;
        status?: string;
        startType?: StartType;
        courseType?: CourseType;
        courseDistance?: number | null;
        raceFleets?: {
            fleetId: number;
            raceNumber?: number | null;
            startTimeOffset?: string | null;
            courseType?: CourseType | null;
            courseDistance?: number | null;
            includeInOverall?: boolean;
        }[];
    }) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiClient.post<RaceResponse>(`/api/regattas/${regattaId}/races`, data);
            return result;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create race';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateRace = useCallback(async (id: number, data: {
        name?: string;
        scheduledStartTime?: string | null;
        actualStartTime?: string | null;
        status?: string;
        startType?: StartType;
        courseType?: CourseType;
        courseDistance?: number | null;
        raceFleets?: {
            id?: number;
            fleetId: number;
            raceNumber?: number | null;
            startTimeOffset?: string | null;
            courseType?: CourseType | null;
            courseDistance?: number | null;
            includeInOverall?: boolean;
        }[];
    }) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiClient.put<RaceResponse>(`/api/races/${id}`, data);
            return result;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update race';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteRace = useCallback(async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/api/races/${id}`);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete race';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveFinishes = useCallback(async (raceId: number, data: RecordRaceFinishes) => {
        setIsLoading(true);
        setError(null);
        try {
            await apiClient.post(`/api/races/${raceId}/finishes`, data);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save finishes';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const scoreRace = useCallback(async (raceId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiClient.post<FinishResultDto[]>(`/api/races/${raceId}/score`, {});
            return result;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to score race';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getRaceResults = useCallback(async (raceId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiClient.get<FinishResultDto[]>(`/api/races/${raceId}/results`);
            return result;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get race results';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        createRace,
        updateRace,
        deleteRace,
        saveFinishes,
        scoreRace,
        getRaceResults,
        isLoading,
        error
    };
}
