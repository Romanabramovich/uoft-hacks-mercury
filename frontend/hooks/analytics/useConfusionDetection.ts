"use client";

import { useState, useRef } from 'react';
import { useEventTracker } from './useEventTracker';

export function useConfusionDetection() {
    const { trackEvent } = useEventTracker();
    const [navigationTimestamps, setNavigationTimestamps] = useState<number[]>([]);
    const confusionReportedRef = useRef(false);

    const logNavigation = (currentSlideId: string) => {
        const now = Date.now();

        setNavigationTimestamps(prev => {
            // Keep only last 30 seconds
            const recent = [...prev, now].filter(t => now - t < 30000);

            // Rapid switching detection: > 5 moves in 30s
            if (recent.length > 5 && !confusionReportedRef.current) {
                confusionReportedRef.current = true;

                trackEvent("confusion_detected", {
                    confusion_indicator: "rapid_slide_switching",
                    slide_when_confused: currentSlideId,
                    time_spent_confused: 0, // difficult to estimate without more state
                    self_reported_confusion: false
                });

                // Reset logic to avoid spamming
                setTimeout(() => { confusionReportedRef.current = false; }, 60000);
            }
            return recent;
        });
    };

    const logConfusionSignal = (
        indicator: "abandoned_quiz" | "searched_external_help" | "asked_question",
        slideId: string
    ) => {
        trackEvent("confusion_detected", {
            confusion_indicator: indicator,
            slide_when_confused: slideId,
            self_reported_confusion: false
        });
    };

    const reportConfusion = (slideId: string) => {
        trackEvent("confusion_detected", {
            confusion_indicator: "asked_question", // mapping generic help to one of the enum values or adding a new one? generic 'self_report' not in basic enum but bool is there
            slide_when_confused: slideId,
            self_reported_confusion: true
        });
    };

    return {
        logNavigation,
        logConfusionSignal,
        reportConfusion
    };
}
