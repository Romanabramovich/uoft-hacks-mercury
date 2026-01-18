import { v4 as uuidv4 } from 'uuid';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface APIError {
    message: string;
    status?: number;
}

async function fetchWithTimeout(resource: string, options: RequestInit = {}): Promise<Response> {
    const { timeout = 10000 } = options as any;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(id);
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    return response.json();
}

export const sessionAPI = {
    start: async (userId: string, sessionId: string) => {
        try {
            const response = await fetchWithTimeout(`${BASE_URL}/api/session/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, session_id: sessionId })
            });
            return await handleResponse<{ session_id: string; started_at: string }>(response);
        } catch (error) {
            console.error('[SessionAPI] Failed to start session:', error);
            throw error;
        }
    },

    trackFocus: async (sessionId: string, userId: string, isFocused: boolean, focusScore: number) => {
        try {
            const response = await fetchWithTimeout(`${BASE_URL}/api/session/${sessionId}/focus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    session_id: sessionId,
                    is_focused: isFocused,
                    focus_score: focusScore
                })
            });
            return await handleResponse<void>(response);
        } catch (error) {
            // Create a non-blocking error log
            console.error('[SessionAPI] Failed to track focus:', error);
        }
    },

    trackSlideChange: async (
        sessionId: string,
        userId: string,
        newSlideId: string,
        previousSlideId: string,
        timeOnPrevious: number
    ) => {
        try {
            const response = await fetchWithTimeout(`${BASE_URL}/api/session/${sessionId}/slide-change`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    new_slide_id: newSlideId,
                    previous_slide_id: previousSlideId,
                    time_on_previous: timeOnPrevious
                })
            });
            return await handleResponse<void>(response);
        } catch (error) {
            console.error('[SessionAPI] Failed to track slide change:', error);
        }
    },

    submitQuizResult: async (
        sessionId: string,
        userId: string,
        slideId: string,
        quizId: string,
        score: number,
        passed: boolean
    ) => {
        try {
            const response = await fetchWithTimeout(`${BASE_URL}/api/session/${sessionId}/quiz-result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    slide_id: slideId,
                    quiz_id: quizId,
                    score,
                    passed
                })
            });
            return await handleResponse<void>(response);
        } catch (error) {
            console.error('[SessionAPI] Failed to submit quiz result:', error);
        }
    },

    end: async (sessionId: string, userId: string) => {
        try {
            // Use keepalive for end session requests to ensure they complete even if page unloads
            const response = await fetch(`${BASE_URL}/api/session/${sessionId}/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, session_id: sessionId }),
                keepalive: true
            });

            if (!response.ok) {
                console.error(`[SessionAPI] Failed to end session: ${response.status}`);
            }
        } catch (error) {
            console.error('[SessionAPI] Failed to end session:', error);
        }
    }
};
