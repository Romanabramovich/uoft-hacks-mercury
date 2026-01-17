"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sessionAPI } from '@/services/api';
// Assuming we have a way to get the current user, possibly from a mock or auth context.
// For now we'll mock or generate a user ID if not available.
import { apiClient } from '@/lib/api/client'; // Reuse implementation if exists

interface SessionContextType {
    sessionId: string | null;
    userId: string;
    startSession: () => Promise<void>;
    endSession: () => Promise<void>;
    isSessionActive: boolean;
    lastSlide: { id: string; startTime: number } | null;
    setLastSlide: (slide: { id: string; startTime: number } | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('anonymous_user');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [lastSlide, setLastSlide] = useState<{ id: string; startTime: number } | null>(null);

    // Use a ref to access current values in cleanup/listeners without dependency loops
    const sessionRef = useRef<{ sessionId: string | null; userId: string }>({ sessionId: null, userId: 'anonymous_user' });

    // Fetch real user ID
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await apiClient.getCurrentUser();
                if (user && user.id) {
                    setUserId(user.id);
                    sessionRef.current.userId = user.id;
                }
            } catch (e) {
                // Fallback or anonymous already set
                console.log("Using anonymous user for session");
            }
        };
        fetchUser();
    }, []);

    const startSession = async () => {
        if (isSessionActive) return;

        const newSessionId = uuidv4();
        setSessionId(newSessionId);
        setIsSessionActive(true);

        sessionRef.current.sessionId = newSessionId;

        try {
            await sessionAPI.start(sessionRef.current.userId, newSessionId);
            console.log(`[Session] Started: ${newSessionId}`);
        } catch (error) {
            console.error("Failed to start session:", error);
            // Since we generated ID locally, we can still proceed with local tracking 
            // even if backend handshake failed, though subsequent calls might fail too.
        }
    };

    const endSession = async () => {
        const currentSessionId = sessionRef.current.sessionId;
        if (!currentSessionId) return;

        try {
            await sessionAPI.end(currentSessionId, sessionRef.current.userId);
            console.log(`[Session] Ended: ${currentSessionId}`);
        } catch (error) {
            console.error("Failed to end session:", error);
        } finally {
            setIsSessionActive(false);
            setSessionId(null);
            sessionRef.current.sessionId = null;
        }
    };

    // Auto-start session on mount
    useEffect(() => {
        startSession();

        // Auto-end on unmount
        return () => {
            // We cannot use async/await here directly in cleanup, but calling the function triggers the fetch
            // The fetch inside endSession uses keepalive: true
            const currentSessionId = sessionRef.current.sessionId;
            const currentUserId = sessionRef.current.userId;
            if (currentSessionId) {
                sessionAPI.end(currentSessionId, currentUserId).catch(console.error);
            }
        };
    }, []);

    // Browser close handling
    useEffect(() => {
        const handleBeforeUnload = () => {
            const currentSessionId = sessionRef.current.sessionId;
            const currentUserId = sessionRef.current.userId;
            if (currentSessionId) {
                // Sync call is preferred for beforeunload, but sendBeacon or keepalive fetch is standard replacement
                // sessionAPI.end uses keepalive: true
                sessionAPI.end(currentSessionId, currentUserId).catch(console.error);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (
        <SessionContext.Provider value={{
            sessionId,
            userId,
            startSession,
            endSession,
            isSessionActive,
            lastSlide,
            setLastSlide
        }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
