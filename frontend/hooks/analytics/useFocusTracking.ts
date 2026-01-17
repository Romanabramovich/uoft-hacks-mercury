"use client";

import { useEffect, useRef } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { sessionAPI } from '@/services/api';

export function useFocusTracking() {
    const { sessionId, userId, isSessionActive } = useSession();

    // In a real implementation, this would connect to a local CV model or MediaPipe
    // For now, we simulate focus metrics for the backend heartbeat
    useEffect(() => {
        if (!sessionId || !isSessionActive) return;

        const intervalId = setInterval(() => {
            // Mock high focus
            const isFocused = Math.random() > 0.1; // 90% chance focused
            const focusScore = isFocused ? 0.8 + Math.random() * 0.2 : Math.random() * 0.5;

            sessionAPI.trackFocus(
                sessionId,
                userId,
                isFocused,
                Number(focusScore.toFixed(2))
            ).catch(console.error);
        }, 10000); // Every 10 seconds

        return () => clearInterval(intervalId);
    }, [sessionId, userId, isSessionActive]);

    return {};
}
