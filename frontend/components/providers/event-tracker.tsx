"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { LearningEvent, EventType } from "@/lib/events";
import { v4 as uuidv4 } from "uuid";

interface EventTrackerContextType {
    trackEvent: (type: EventType, properties: any) => void;
    sessionId: string;
    userId: string;
}

const EventTrackerContext = createContext<EventTrackerContextType | undefined>(undefined);

export function EventTrackerProvider({ children }: { children: React.ReactNode }) {
    const [sessionId] = useState(() => uuidv4());
    const [userId] = useState(() => "user_" + Math.floor(Math.random() * 10000)); // Mock user ID for now
    const eventQueue = useRef<LearningEvent[]>([]);

    const flushEvents = useCallback(async () => {
        if (eventQueue.current.length === 0) return;

        const batch = [...eventQueue.current];
        eventQueue.current = []; // Clear queue immediately

        try {
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batch),
            });
        } catch (error) {
            console.error("Failed to flush events:", error);
            // Optional: Re-queue failed events if critical
        }
    }, []);

    const trackEvent = useCallback((type: EventType, properties: any) => {
        const event: LearningEvent = {
            event: type,
            timestamp: new Date().toISOString(),
            user_id: userId,
            session_id: sessionId,
            properties: properties,
        } as LearningEvent;

        eventQueue.current.push(event);
        console.log(`[Tracker] Queued: ${type}`, properties);

        // Auto-flush if threshold reached
        if (eventQueue.current.length >= 20) {
            flushEvents();
        }
    }, [sessionId, userId, flushEvents]);

    // Flush on interval
    useEffect(() => {
        const interval = setInterval(flushEvents, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, [flushEvents]);

    // Flush on unmount/pagehide
    useEffect(() => {
        const handleUnload = () => flushEvents();
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [flushEvents]);

    return (
        <EventTrackerContext.Provider value={{ trackEvent, sessionId, userId }}>
            {children}
        </EventTrackerContext.Provider>
    );
}

export function useEventTracker() {
    const context = useContext(EventTrackerContext);
    if (context === undefined) {
        throw new Error("useEventTracker must be used within an EventTrackerProvider");
    }
    return context;
}
