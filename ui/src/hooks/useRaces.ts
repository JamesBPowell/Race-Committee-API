import { useState } from 'react';
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
    scoringMethodUsed: string;
}

export function useRaces() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createRace = async (regattaId: number | string, data: {
        name: string;
        scheduledStartTime?: string | null;
        status?: string;
        startType?: StartType;
        courseType?: CourseType;
        windSpeed?: number | null;
        windDirection?: number | null;
        courseDistance?: number | null;
        raceFleets?: {
            fleetId: number;
            raceNumber?: number | null;
            startTimeOffset?: string | null;
            courseType?: CourseType | null;
            windSpeed?: number | null;
            windDirection?: number | null;
            courseDistance?: number | null;
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
    };

    const updateRace = async (id: number, data: {
        name?: string;
        scheduledStartTime?: string | null;
        actualStartTime?: string | null;
        status?: string;
        startType?: StartType;
        courseType?: CourseType;
        windSpeed?: number | null;
        windDirection?: number | null;
        courseDistance?: number | null;
        raceFleets?: {
            id?: number;
            fleetId: number;
            raceNumber?: number | null;
            startTimeOffset?: string | null;
            courseType?: CourseType | null;
            windSpeed?: number | null;
            windDirection?: number | null;
            courseDistance?: number | null;
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
    };

    const deleteRace = async (id: number) => {
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
    };

    const saveFinishes = async (raceId: number, finishes: RecordFinishDto[]) => {
        setIsLoading(true);
        setError(null);
        try {
            await apiClient.post(`/api/races/${raceId}/finishes`, finishes);
            return true;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save finishes';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const scoreRace = async (raceId: number) => {
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
    };

    const getRaceResults = async (raceId: number) => {
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
    };

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
