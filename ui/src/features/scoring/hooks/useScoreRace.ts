import { useState, useEffect, useCallback, useMemo } from 'react';
import { RaceResponse, RegattaResponse } from '@/hooks/useRegattas';
import { useRaces, RecordFinishDto, FinishResultDto } from '@/hooks/useRaces';

interface UseScoreRaceProps {
    race: RaceResponse | null;
    regatta: RegattaResponse;
    onSuccess?: () => void;
    isOpen: boolean;
}

export function useScoreRace({ race, regatta, onSuccess, isOpen }: UseScoreRaceProps) {
    const { saveFinishes, scoreRace, getRaceResults, isLoading, error } = useRaces();

    // Initial map setup
    const initialFinishesMap = useMemo<Record<number, RecordFinishDto & { dayOffset: number }>>(() => {
        if (!race || !regatta.entries) return {};
        const initialMap: Record<number, RecordFinishDto & { dayOffset: number }> = {};
        const relevantEntries = regatta.entries || [];
        relevantEntries.forEach(entry => {
            initialMap[entry.id] = {
                entryId: entry.id,
                finishTime: '',
                dayOffset: 0,
                timePenalty: '',
                pointPenalty: 0,
                code: '',
                notes: ''
            };
        });
        return initialMap;
    }, [race, regatta.entries]);

    const getBaseDate = useCallback(() => {
        let source = race?.scheduledStartTime || regatta.startDate || new Date().toISOString();
        if (typeof source === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(source.trim())) {
            source = source.trim() + 'T00:00:00';
        }
        const d = new Date(source);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [race, regatta]);

    const calculateDayOffset = useCallback((date: Date) => {
        const base = getBaseDate();
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - base.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }, [getBaseDate]);

    const formatTimeToClock = (date: Date) => {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    };

    const [finishesMap, setFinishesMap] = useState<Record<number, RecordFinishDto & { dayOffset: number }>>(initialFinishesMap);
    const [windSpeed, setWindSpeed] = useState<number>(race?.windSpeed || 0);
    const [windDirection, setWindDirection] = useState<number>(race?.windDirection || 0);
    const [actualStartTime, setActualStartTime] = useState<string>('');
    const [startDayOffset, setStartDayOffset] = useState<number>(0);
    const [results, setResults] = useState<FinishResultDto[]>([]);
    const [now, setNow] = useState(new Date());
    const [hasInitialized, setHasInitialized] = useState(false);

    // Effect to initialize data from API - only once per race open
    useEffect(() => {
        if (race && isOpen && !hasInitialized) {
            const fetchResults = async () => {
                try {
                    const data = await getRaceResults(race.id);
                    setResults(data);

                    // Populate map with existing results
                    const newMap = { ...initialFinishesMap };
                    if (data && data.length > 0) {
                        data.forEach(result => {
                            let localTimeStr = '';
                            let offset = 0;
                            if (result.finishTime) {
                                const d = new Date(result.finishTime);
                                localTimeStr = formatTimeToClock(d);
                                offset = calculateDayOffset(d);
                            }
                            newMap[result.entryId] = {
                                entryId: result.entryId,
                                finishTime: localTimeStr,
                                dayOffset: offset,
                                code: result.code || '',
                                timePenalty: result.timePenalty || '',
                                pointPenalty: 0,
                                notes: result.notes || ''
                            };
                        });
                    }
                    setFinishesMap(newMap);

                    // Also initialize race-level conditions
                    setWindSpeed(race.windSpeed || 0);
                    setWindDirection(race.windDirection || 0);
                    if (race.actualStartTime) {
                        const d = new Date(race.actualStartTime);
                        setActualStartTime(formatTimeToClock(d));
                        setStartDayOffset(calculateDayOffset(d));
                    }

                    setHasInitialized(true);
                } catch (err) {
                    console.error("Failed to fetch race results:", err);
                    setHasInitialized(true); // Don't keep trying if it failed
                }
            };
            fetchResults();
        }
    }, [race, isOpen, hasInitialized, initialFinishesMap, getRaceResults, calculateDayOffset]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRecordFinish = (entryId: number, time?: string) => {
        const nowTime = new Date();
        const timestamp = time || formatTimeToClock(nowTime);
        const offset = time ? (finishesMap[entryId]?.dayOffset || 0) : calculateDayOffset(nowTime);

        setFinishesMap(prev => ({
            ...prev,
            [entryId]: {
                ...prev[entryId],
                finishTime: timestamp,
                dayOffset: offset,
                code: ''
            }
        }));
    };

    const handleSetActualStart = () => {
        const nowTime = new Date();
        setActualStartTime(formatTimeToClock(nowTime));
        setStartDayOffset(calculateDayOffset(nowTime));
    };

    const handleScoreRace = useCallback(async () => {
        if (!race) return;
        try {
            const computedResults = await scoreRace(race.id);
            setResults(computedResults);
            onSuccess?.();
            return computedResults;
        } catch (err) {
            console.error(err);
        }
    }, [race, scoreRace, onSuccess]);

    const handleSaveFinishes = async () => {
        if (!race) return false;

        try {
            const baseDate = getBaseDate();
            const constructDateStr = (offset: number, timeStr: string) => {
                const targetDate = new Date(baseDate);
                targetDate.setDate(targetDate.getDate() + offset);
                const y = targetDate.getFullYear();
                const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                const d = String(targetDate.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`;
            };

            const finishesArr: RecordFinishDto[] = Object.values(finishesMap).map(f => {
                const rawTime = f.finishTime?.trim();
                let finalFinishTime: string | null = null;

                if (rawTime) {
                    if (rawTime.includes('T')) {
                        finalFinishTime = rawTime;
                    } else {
                        const localDateTimeStr = constructDateStr(f.dayOffset, rawTime);
                        const localDateTime = new Date(localDateTimeStr);
                        if (!isNaN(localDateTime.getTime())) {
                            finalFinishTime = localDateTimeStr;
                        }
                    }
                }

                return {
                    entryId: f.entryId,
                    finishTime: finalFinishTime,
                    code: f.code || '',
                    timePenalty: (f.timePenalty && f.timePenalty.trim() !== '') ? f.timePenalty : undefined,
                    pointPenalty: f.pointPenalty || null,
                    notes: f.notes || ''
                };
            });

            let startTimeISO: string | null = null;
            if (actualStartTime && actualStartTime.trim()) {
                const rawStart = actualStartTime.trim();
                if (rawStart.includes('T')) {
                    startTimeISO = rawStart;
                } else {
                    const localDateTimeStr = constructDateStr(startDayOffset, rawStart);
                    const localDateTime = new Date(localDateTimeStr);
                    if (!isNaN(localDateTime.getTime())) {
                        startTimeISO = localDateTimeStr;
                    }
                }
            }

            const successResult = await saveFinishes(race.id, {
                windSpeed,
                windDirection,
                actualStartTime: startTimeISO,
                finishes: finishesArr
            });

            if (successResult) {
                await handleScoreRace();
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to save finishes:", err);
            return false;
        }
    };

    return {
        states: {
            finishesMap,
            windSpeed,
            windDirection,
            actualStartTime,
            startDayOffset,
            results,
            now,
            isLoading,
            error
        },
        actions: {
            setFinishesMap,
            setWindSpeed,
            setWindDirection,
            setActualStartTime,
            setStartDayOffset,
            handleRecordFinish,
            handleSetActualStart,
            handleScoreRace,
            handleSaveFinishes
        },
        helpers: {
            getBaseDate,
            formatTimeToClock
        }
    };
}
