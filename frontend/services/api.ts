import { v4 as uuidv4 } from 'uuid';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // 3001


interface APIError {
    message: string;
    status?: number;
}

interface FetchOptions extends RequestInit {
    timeout?: number;
}

async function fetchWithTimeout(resource: string, options: FetchOptions = {}): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...fetchOptions,
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
                }),
                timeout: 3000 // Short 3s timeout - analytics should be fast
            });
            return await handleResponse<void>(response);
        } catch (error) {
            // Silently fail - focus tracking is non-critical
            // Don't block the user experience with analytics failures
            return;
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

export const slidesAPI = {
    /**
     * Fetch the complete course structure (chapters and slide topics) from backend
     */
    getCourseStructure: async (courseId: string) => {
        try {
            const response = await fetchWithTimeout(`${BASE_URL}/api/courses/${courseId}/structure`);
            return await handleResponse<{
                course_id: string;
                total_chapters: number;
                total_slides: number;
                chapters: Array<{
                    id: string;
                    title: string;
                    order: number;
                    slides: Array<{
                        slide_id: string;
                        title: string;
                        learning_objectives: string;
                        context: string;
                        order: number;
                    }>;
                }>;
            }>(response);
        } catch (error) {
            console.error('[SlidesAPI] Failed to fetch course structure:', error);
            throw error;
        }
    },

    /**
     * Generate personalized slide content for a specific user
     * This calls the backend LLM to create custom content based on learning identity
     */
    generateSlideContent: async (
        userId: string,
        topic: string,
        learningObjectives: string,
        context?: string,
        previousContent?: string,
        forceFormat?: 'html' | 'manim'
    ) => {
        try {
            const response = await fetchWithTimeout(`${BASE_URL}/api/slides/generate-for-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    topic,
                    learning_objectives: learningObjectives,
                    context,
                    previous_content: previousContent,
                    force_format: forceFormat
                }),
                timeout: 120000 // 2 minute timeout for LLM generation (was 60s, increasing to 120s)
            });
            return await handleResponse<{
                content: string;
                content_type: 'html' | 'manim';
                visual_text_score: number;
                topic: string;
                video_url?: string;
                thumbnail_url?: string;
                metadata: Record<string, any>;
            }>(response);
        } catch (error) {
            console.error('[SlidesAPI] Failed to generate slide content:', error);
            // Re-throw with more helpful message
            if (error instanceof Error && error.message.includes('aborted')) {
                throw new Error('Content generation timed out. Please try again or check if backend is running.');
            }
            throw error;
        }
    },

    /**
     * Mark a chapter as complete and trigger pre-generation of next chapter
     */
    completeChapter: async (
        chapterId: string,
        courseId: string,
        userId: string,
        sessionId: string
    ) => {
        try {
            const response = await fetchWithTimeout(`${BASE_URL}/api/chapters/${chapterId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: courseId,
                    user_id: userId,
                    session_id: sessionId
                }),
                timeout: 300000 // 5 minute timeout for generation
            });
            return await handleResponse<{
                message: string;
                chapter_id: string;
                next_chapter_id: string | null;
                is_baseline: boolean;
                profile_generated: boolean;
                slides_generated: number;
                slides_total: number;
                timestamp: string;
            }>(response);
        } catch (error) {
            console.error('[SlidesAPI] Failed to complete chapter:', error);
            throw error;
        }
    },

    /**
     * Fetch pre-generated slides for a user and chapter
     */
    getPreGeneratedSlides: async (userId: string, courseId: string, chapterId: string) => {
        try {
            const response = await fetchWithTimeout(
                `${BASE_URL}/api/slides/pre-generated?user_id=${userId}&course_id=${courseId}&chapter_id=${chapterId}`,
                { timeout: 5000 } // Short 5 second timeout - if slides exist, they'll be fast
            );
            return await handleResponse<{
                slides: Array<{
                    slide_id: string;
                    title: string;
                    content: string;
                    content_type: string;
                    video_url?: string;
                    thumbnail_url?: string;
                }>;
            }>(response);
        } catch (error) {
            // Silently fail and return empty - will generate on-demand instead
            console.log('[SlidesAPI] No pre-generated slides found, will generate on-demand');
            return { slides: [] };
        }
    }
};
