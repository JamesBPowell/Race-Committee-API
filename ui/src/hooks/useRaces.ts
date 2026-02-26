import { useState } from 'react';
import { apiClient } from '../lib/api';
import { RaceResponse, StartType, CourseType } from './useRegattas';

export function useRaces() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createRace = async (regattaId: number | string, data: {
        raceNumber: number;
        scheduledStartTime?: string | null;
        status?: string;
        startType?: StartType;
        courseType?: CourseType;
        windSpeed?: number | null;
        windDirection?: number | null;
        courseDistance?: number | null;
        raceFleets?: {
            fleetId: number;
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
        raceNumber?: number;
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

    return {
        createRace,
        updateRace,
        deleteRace,
        isLoading,
        error
    };
}
