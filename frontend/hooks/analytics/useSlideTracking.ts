"use client";

import { useEffect, useRef, useState } from 'react';
import { useEventTracker } from './useEventTracker';

type SlideContentType = "diagram-heavy" | "text-heavy" | "video" | "interactive" | "quiz";

import { useSession } from '@/components/providers/session-provider';
import { sessionAPI } from '@/services/api';

export function useSlideTracking(slideId: string, contentType: SlideContentType) {
    const { trackEvent } = useEventTracker();
    const { sessionId, userId, lastSlide, setLastSlide } = useSession();

    // ... metricsRefs ...
    const startTimeRef = useRef<number>(Date.now());
    const metricsRef = useRef({
        scrolled_back: false,
        skipped_forward: false,
        paused_video: false,
        replayed_animation: false,
        zoomed_into_diagram: false,
    });

    // ... helper functions ...
    const logVideoPause = () => { metricsRef.current.paused_video = true; };
    const logAnimationReplay = () => { metricsRef.current.replayed_animation = true; };
    const logDiagramZoom = () => { metricsRef.current.zoomed_into_diagram = true; };
    const logNavigation = (direction: 'back' | 'forward') => {
        if (direction === 'back') metricsRef.current.scrolled_back = true;
    };

    useEffect(() => {
        // Backend API Tracking (Transition Logic)
        if (sessionId && lastSlide && lastSlide.id !== slideId) {
            const timeOnPrev = (Date.now() - lastSlide.startTime) / 1000;
            sessionAPI.trackSlideChange(
                sessionId,
                userId,
                slideId,
                lastSlide.id,
                timeOnPrev
            ).catch(console.error);
        }

        // Update global last slide state
        setLastSlide({ id: slideId, startTime: Date.now() });

        // Local Tracking Reset
        startTimeRef.current = Date.now();
        metricsRef.current = {
            scrolled_back: false,
            skipped_forward: false,
            paused_video: false,
            replayed_animation: false,
            zoomed_into_diagram: false,
        };

        return () => {
            // Local tracking event on unmount (keep existing functionality)
            const endTime = Date.now();
            const timeSpentSeconds = (endTime - startTimeRef.current) / 1000;
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
    }, [slideId, contentType, trackEvent, sessionId, userId, setLastSlide]);
    // removed lastSlide from dep array to avoid loops, or handle carefully? 
    // actually lastSlide *value* changes on every slide change. 
    // We only want this effect to run when `slideId` changes. 
    // If lastSlide changes (which we do inside), does it re-trigger?
    // setting lastSlide triggers re-render.
    // Effect runs again?
    // If we include `lastSlide` in deps:
    // 1. Mount A. lastSlide=null. Effect runs. Calls setLastSlide(A).
    // 2. setLastSlide triggers render. lastSlide=A.
    // 3. Effect runs (slideId=A). lastSlide=A. lastSlide.id === slideId. No API call. setLastSlide(A).
    // Loop? setLastSlide sets new object {id:A, time:new}.
    // Yes Loop.
    // Fix: Don't put lastSlide in deps, or use Ref for lastSlide logic if possible, OR check logical condition.
    // actually `setLastSlide` is stable.
    // We need `lastSlide` value.
    // If we omit `lastSlide` from deps, linter complains.
    // Better way: use a Ref to store "hasTrackedForThisSlide".


    return {
        logVideoPause,
        logAnimationReplay,
        logDiagramZoom,
        logNavigation
    };
}
