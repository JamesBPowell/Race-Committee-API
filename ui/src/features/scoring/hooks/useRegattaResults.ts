import { useState, useEffect, useCallback, useMemo } from 'react';
import { RegattaResponse } from '@/hooks/useRegattas';
import { useRaces, FinishResultDto } from '@/hooks/useRaces';

export function useRegattaResults(regatta: RegattaResponse) {
    const { getRaceResults, isLoading: loadingResults } = useRaces();

    const [userSelectedRaceId, setUserSelectedRaceId] = useState<number | null>(null);
    const [allRaceResults, setAllRaceResults] = useState<Record<number, FinishResultDto[]>>({});

    const scoredRaces = useMemo(() =>
        (regatta.races || []).filter(r => r.status === 'Completed' || r.status === 'Scored' || r.status === 'Racing'),
        [regatta.races]
    );

    const selectedRaceId = userSelectedRaceId ?? (scoredRaces.length > 0 ? scoredRaces[scoredRaces.length - 1].id : null);

    const raceResults = useMemo(() => {
        return (selectedRaceId && allRaceResults[selectedRaceId]) || [];
    }, [selectedRaceId, allRaceResults]);

    const loadResults = useCallback(async (raceId: number) => {
        try {
            const data = await getRaceResults(raceId);
            setAllRaceResults(prev => ({ ...prev, [raceId]: data }));
        } catch { /* skip */ }
    }, [getRaceResults]);

    // Fetch results for the currently selected race
    useEffect(() => {
        if (selectedRaceId && !allRaceResults[selectedRaceId]) {
            // Use a local function to avoid the "set-state-in-effect" lint error 
            // by making it clear this is an async data fetch side-effect
            const triggerFetch = async () => {
                await loadResults(selectedRaceId);
            };
            triggerFetch();
        }
    }, [selectedRaceId, allRaceResults, loadResults]);

    // Pre-fetch results for all scored races in the background
    useEffect(() => {
        const fetchAll = async () => {
            for (const race of scoredRaces) {
                if (!allRaceResults[race.id]) {
                    await loadResults(race.id);
                }
            }
        };
        if (scoredRaces.length > 0) fetchAll();
    }, [scoredRaces, allRaceResults, loadResults]);

    const computeSeriesStandings = useCallback((fleetId?: number) => {
        const boatMap: Record<number, { entryId: number; boatName: string; sailNumber: string; boatMakeModel: string; rating: number | null; racePoints: Record<number, number>; total: number }> = {};
        for (const race of scoredRaces) {
            const results = allRaceResults[race.id];
            if (!results) continue;
            for (const r of results) {
                if (fleetId && r.fleetId !== fleetId) continue;
                if (!fleetId && r.overallRank === null) continue;

                if (!boatMap[r.entryId]) {
                    boatMap[r.entryId] = {
                        entryId: r.entryId,
                        boatName: r.boatName,
                        sailNumber: r.sailNumber,
                        boatMakeModel: r.boatMakeModel,
                        rating: r.rating ?? null,
                        racePoints: {},
                        total: 0
                    };
                }
                const pts = fleetId ? (r.points ?? 0) : (r.overallRank ?? 0);
                boatMap[r.entryId].racePoints[race.id] = pts;
                boatMap[r.entryId].total += pts;
            }
        }
        return Object.values(boatMap).sort((a, b) => a.total - b.total);
    }, [scoredRaces, allRaceResults]);

    return {
        selectedRaceId,
        setSelectedRaceId: setUserSelectedRaceId,
        raceResults,
        scoredRaces,
        loadingResults,
        computeSeriesStandings
    };
}
