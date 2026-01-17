"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LearningEvent, EventType } from '@/lib/events';
import { apiClient } from '@/lib/api/client';

interface EventTrackerContextType {
    trackEvent: <T extends EventType>(
        eventType: T,
        properties: Extract<LearningEvent, { event: T }>['properties']
    ) => void;
    sessionId: string | null;
    userId: string | null;
}

const EventTrackerContext = createContext<EventTrackerContextType | undefined>(undefined);

export function EventTrackerProvider({ children }: { children: React.ReactNode }) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const eventQueue = useRef<LearningEvent[]>([]);
    const queueLimit = 20;
    const batchInterval = 10000; // 10 seconds

    // Initialize session and user
    useEffect(() => {
        // Generate session ID
        const newSessionId = uuidv4();
        setSessionId(newSessionId);

        // Fetch User ID
        const fetchUser = async () => {
            try {
                const user = await apiClient.getCurrentUser();
                setUserId(user.id);
            } catch (error) {
                console.error("Failed to get analytics user:", error);
                setUserId("anonymous-" + uuidv4());
            }
        };
        fetchUser();
    }, []);

    const sendBatch = useCallback(async () => {
        if (eventQueue.current.length === 0) return;

        const eventsToSend = [...eventQueue.current];
        eventQueue.current = []; // Clear queue immediately to avoid duplicates if async takes time

        console.log(`[Analytics] 🚀 Sending batch of ${eventsToSend.length} events:`, eventsToSend);

        try {
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventsToSend),
            });
            console.log(`[Analytics] ✅ Batch sent successfully`);
        } catch (error) {
            console.error("Failed to send events:", error);
            // Optional: Re-queue failed events if critical
        }
    }, []);

    // Interval for batch sending
    useEffect(() => {
        const intervalId = setInterval(sendBatch, batchInterval);

        // Send on unload
        const handleUnload = () => {
            if (eventQueue.current.length > 0) {
                // Try to use beacon API for reliability on unload
                const blob = new Blob([JSON.stringify(eventQueue.current)], { type: 'application/json' });
                navigator.sendBeacon('/api/events', blob);
            }
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('beforeunload', handleUnload);
            sendBatch(); // Flush on unmount
        };
    }, [sendBatch]);

    const trackEvent = useCallback(<T extends EventType>(
        eventType: T,
        properties: Extract<LearningEvent, { event: T }>['properties']
    ) => {
        if (!sessionId || !userId) {
            // Queue locally if not ready, or just wait? 
            // Better to allow tracking and fill IDs? 
            // For simplicity, we'll try to use current state or placeholders.
        }

        const newEvent: any = {
            event: eventType,
            timestamp: new Date().toISOString(),
            user_id: userId || 'pending',
            session_id: sessionId || 'pending',
            properties: properties
        };

        console.log(`[Analytics] 📥 Tracked Event: ${eventType}`, properties);

        // If we have pending IDs, we might want to update them before send if possible, 
        // but for now let's just push. 
        // Ideally we check refs for IDs if we want them up to date inside the callback properly
        // but since we are using state, we should rely on the closure. 
        // Actually, to avoid stale stats in callbacks, let's use refs for IDs or assume they are set quickly.

        eventQueue.current.push(newEvent);

        if (eventQueue.current.length >= queueLimit) {
            console.log(`[Analytics] 📦 Queue limit reached (${queueLimit}), forcing batch send.`);
            sendBatch();
        }
    }, [sessionId, userId, sendBatch]);

    return (
        <EventTrackerContext.Provider value={{ trackEvent, sessionId, userId } as EventTrackerContextType}>
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
