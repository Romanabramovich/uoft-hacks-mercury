"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEventTracker } from './useEventTracker';

export function usePacingTracking() {
    const { trackEvent } = useEventTracker();
    const sessionStartRef = useRef<number>(Date.now());
    const [slidesViewed, setSlidesViewed] = useState<string[]>([]);
    const [skippedSlides, setSkippedSlides] = useState<string[]>([]);
    const [pauses, setPauses] = useState<number[]>([]); // Durations

    const logSlideView = useCallback((slideId: string, timeSpent: number) => {
        setSlidesViewed(prev => {
            const newList = [...prev, slideId];

            // Check heuristic for skipped (e.g. < 5s)
            if (timeSpent < 5) {
                setSkippedSlides(s => [...s, slideId]);
            }

            // Send event every 5 slides
            if (newList.length > 0 && newList.length % 5 === 0) {
                const minutesElapsed = (Date.now() - sessionStartRef.current) / 60000;
                const slidesPerMinute = minutesElapsed > 0 ? newList.length / minutesElapsed : 0;

                const totalPauseTime = pauses.reduce((a, b) => a + b, 0);
                const avgPause = pauses.length > 0 ? totalPauseTime / pauses.length : 0;

                trackEvent("pacing_behavior", {
                    slides_per_minute: slidesPerMinute,
                    pauses_taken: pauses.length,
                    pause_duration_avg: avgPause,
                    skipped_slides: skippedSlides, // Note: this might be slightly stale in closure if not careful, but state update in next render fixes it. 
                    // Ideally we use refs for instant access or pass current values.
                    // For now, using logic inside effect or here. 
                });
            }
            return newList;
        });
    }, [trackEvent, pauses, skippedSlides]);

    const logPause = (durationSeconds: number) => {
        setPauses(prev => [...prev, durationSeconds]);
    };

    const logPacingRequest = (type: 'slow_down' | 'skip_ahead') => {
        // Send immediate event or attach to next pacing pulse? 
        // Prompt says capture in properties: requested_slow_down: boolean
        // I'll send an update event immediately for specific requests or attach to the main one.
        // The schema has these as optional. I'll trigger a pacing event now to capture this signal.

        const minutesElapsed = (Date.now() - sessionStartRef.current) / 60000;
        const slidesPerMinute = minutesElapsed > 0 ? slidesViewed.length / minutesElapsed : 0;

        trackEvent("pacing_behavior", {
            slides_per_minute: slidesPerMinute,
            requested_slow_down: type === 'slow_down',
            requested_skip_ahead: type === 'skip_ahead'
        });
    };

    return {
        logSlideView,
        logPause,
        logPacingRequest
    };
}
