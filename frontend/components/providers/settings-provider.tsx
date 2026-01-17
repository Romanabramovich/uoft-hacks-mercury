"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { UserPreferences } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";
import { useTheme } from "next-themes";

interface SettingsContextType {
    preferences: UserPreferences;
    isLoading: boolean;
    updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
    resetPreferences: () => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    lightMode: true,
    dyslexicFont: false,
    textSize: "medium",
    autoAdapt: true,
    showConfidence: true,
    pace: "moderate",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [isLoading, setIsLoading] = useState(true);
    const { setTheme } = useTheme();

    // Load initial preferences
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const user = await apiClient.getCurrentUser();
                if (user.preferences) {
                    setPreferences(user.preferences);
                }
            } catch (error) {
                console.error("Failed to load preferences:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadPreferences();
    }, []);

    // Apply side effects (CSS classes)
    useEffect(() => {
        const root = document.documentElement;

        // Light Mode Handler
        if (preferences.lightMode) {
            setTheme("light");
        } else {
            setTheme("dark");
        }

        // Dyslexic Font
        if (preferences.dyslexicFont) {
            root.classList.add("dyslexic-font");
        } else {
            root.classList.remove("dyslexic-font");
        }

        // Text Size
        root.setAttribute("data-text-size", preferences.textSize);

    }, [preferences, setTheme]);

    const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
        // Optimistic update
        setPreferences(prev => ({ ...prev, ...newPrefs }));

        try {
            // Background sync
            const user = await apiClient.getCurrentUser();
            // Cast to any because apiClient.updatePreferences isn't fully typed on the interface yet if using an interface abstraction
            // But we know MockService has it. In a real app we'd update the interface.
            if ('updatePreferences' in apiClient) {
                await (apiClient as any).updatePreferences(user.id, newPrefs);
            }
        } catch (error) {
            console.error("Failed to sync preferences:", error);
            // Revert on failure? For now silent fail or toast
        }
    };

    const resetPreferences = async () => {
        await updatePreferences(DEFAULT_PREFERENCES);
    };

    return (
        <SettingsContext.Provider value={{ preferences, isLoading, updatePreferences, resetPreferences }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
