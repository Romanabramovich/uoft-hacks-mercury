"use client";

import { useState, useRef } from 'react';
import { useEventTracker } from './useEventTracker';

type InteractionType = "clicked_example" | "hovered_definition" | "expanded_diagram" | "played_simulation";
type ContentElement = "interactive_graph" | "code_snippet" | "formula" | "concept_diagram";

export function useInteractionTracking(
    interactionType: InteractionType,
    contentElement: ContentElement
) {
    const { trackEvent } = useEventTracker();
    const [interactionCount, setInteractionCount] = useState(0);
    const startTimeRef = useRef<number | null>(null);

    const handleInteractionStart = () => {
        startTimeRef.current = Date.now();
        setInteractionCount(prev => prev + 1);
    };

    const handleInteractionEnd = (successful: boolean = true) => {
        if (!startTimeRef.current) return;

        const duration = (Date.now() - startTimeRef.current) / 1000;

        trackEvent("interaction_with_content", {
            interaction_type: interactionType,
            content_element: contentElement,
            interaction_duration: duration,
            repeated_interaction: interactionCount > 1,
            successful_interaction: successful
        });

        startTimeRef.current = null; // Reset for next interaction
    };

    return {
        handleInteractionStart,
        handleInteractionEnd
    };
}
