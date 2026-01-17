"use client";

import { useEffect, useRef, useState } from 'react';
import { useEventTracker } from './useEventTracker';

type SlideContentType = "diagram-heavy" | "text-heavy" | "video" | "interactive" | "quiz";

export function useSlideTracking(slideId: string, contentType: SlideContentType) {
    const { trackEvent } = useEventTracker();
    const startTimeRef = useRef<number>(Date.now());
    const metricsRef = useRef({
        scrolled_back: false,
        skipped_forward: false,
        paused_video: false,
        replayed_animation: false,
        zoomed_into_diagram: false,
    });

    // We can expose functions to update these metrics
    const logVideoPause = () => { metricsRef.current.paused_video = true; };
    const logAnimationReplay = () => { metricsRef.current.replayed_animation = true; };
    const logDiagramZoom = () => { metricsRef.current.zoomed_into_diagram = true; };
    const logNavigation = (direction: 'back' | 'forward') => {
        if (direction === 'back') metricsRef.current.scrolled_back = true;
        // skipped_forward is calculated on time
    };

    useEffect(() => {
        // Reset metrics on slide change (unmount/remount)
        startTimeRef.current = Date.now();
        metricsRef.current = {
            scrolled_back: false,
            skipped_forward: false,
            paused_video: false,
            replayed_animation: false,
            zoomed_into_diagram: false,
        };

        return () => {
            const endTime = Date.now();
            const timeSpentSeconds = (endTime - startTimeRef.current) / 1000;

            // Heuristic for skipped_forward: Very short duration
            const skipped = timeSpentSeconds < 5;

            trackEvent("slide_viewed", {
                slide_id: slideId,
                content_type: contentType,
                time_spent_seconds: timeSpentSeconds,
                scrolled_back: metricsRef.current.scrolled_back,
                skipped_forward: skipped,
                paused_video: metricsRef.current.paused_video,
                replayed_animation: metricsRef.current.replayed_animation,
                zoomed_into_diagram: metricsRef.current.zoomed_into_diagram
            });
        };
    }, [slideId, contentType, trackEvent]);

    return {
        logVideoPause,
        logAnimationReplay,
        logDiagramZoom,
        logNavigation
    };
}
