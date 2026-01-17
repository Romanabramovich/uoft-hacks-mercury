"use client";

import { useState, useRef, useEffect } from 'react';
import { useEventTracker } from './useEventTracker';

import { useSession } from '@/components/providers/session-provider';
import { sessionAPI } from '@/services/api';

export function useQuizTracking(questionId: string, previousSlideFormat: string) {
    const { trackEvent } = useEventTracker();
    const { sessionId, userId } = useSession();
    const startTimeRef = useRef<number>(Date.now());
    const [attempts, setAttempts] = useState(0);
    const [notesOpened, setNotesOpened] = useState(false);
    const [wentBack, setWentBack] = useState(false);

    useEffect(() => {
        startTimeRef.current = Date.now();
        // Reset state when question changes
        setAttempts(0);
        setNotesOpened(false);
        setWentBack(false);
    }, [questionId]);

    const logAttempt = () => setAttempts(prev => prev + 1);
    const logNotesOpen = () => setNotesOpened(true);
    const logBackNavigation = () => setWentBack(true);

    const submitQuizResult = async (
        userAnswer: string,
        isCorrect: boolean,
        confidence: "guessed" | "somewhat_sure" | "confident" = "somewhat_sure"
    ) => {
        const timeToAnswer = (Date.now() - startTimeRef.current) / 1000;

        // Local Track
        trackEvent("knowledge_check_completed", {
            question_id: questionId,
            slide_format_just_seen: previousSlideFormat,
            correct: isCorrect,
            user_answer: userAnswer,
            time_to_answer_seconds: timeToAnswer,
            confidence_level: confidence,
            attempts_before_correct: attempts,
            consulted_notes: notesOpened,
            went_back_to_previous_slide: wentBack
        });

        // Backend Track
        if (sessionId) {
            // "slide_id" is not passed to this hook, but "questionId" acts as identifier?
            // The prompt signature: submitQuizResult(..., slideId, quizId, score, passed)
            // Hook arguments: (questionId, previousSlideFormat)
            // We might assume questionId is the quizId. The slideId is missing.
            // We can pass questionId as slideId if they are 1:1, or pass null/empty if unknown.
            // Or use previousSlideFormat? No.
            // We'll map questionId -> quizId. slideId -> questionId (if it's a slide-quiz).

            await sessionAPI.submitQuizResult(
                sessionId,
                userId,
                questionId, // Using questionId for slideId as best guess
                questionId, // Using questionId for quizId
                isCorrect ? 1.0 : 0.0, // Score
                isCorrect
            );
        }
    };

    return {
        logAttempt,
        logNotesOpen,
        logBackNavigation,
        submitQuizResult
    };
}
