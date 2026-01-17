"use client";

import { useState, useEffect, useRef } from 'react';
import { useEventTracker } from './useEventTracker';

export function useContextSwitching() {
    const { trackEvent } = useEventTracker();
    const switchTimeRef = useRef<number | null>(null);
    const pasteDetectedRef = useRef(false);
    const [broughtBackInfo, setBroughtBackInfo] = useState(false); // Kept if needed for UI, but ignoring for logic

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User switched away
                switchTimeRef.current = Date.now();
                setBroughtBackInfo(false);
            } else if (switchTimeRef.current) {
                // User returned - Wait a moment to see if they paste
                const timeAwayMinutes = (Date.now() - switchTimeRef.current) / 60000;

                // Clear any previous paste flag from before the switch
                setBroughtBackInfo(false);

                setTimeout(() => {
                    trackEvent("context_switch", {
                        switched_from: "course_slides",
                        switch_trigger: "random",
                        time_away: timeAwayMinutes,
                        returned: true,
                        brought_back_information: pasteDetectedRef.current
                    });

                    // Reset
                    switchTimeRef.current = null;
                    pasteDetectedRef.current = false;
                }, 2000);
            }
        };

        const handlePaste = () => {
            pasteDetectedRef.current = true;
            setBroughtBackInfo(true);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('paste', handlePaste);
        };
    }, [trackEvent, broughtBackInfo]); // Dependencies
}
