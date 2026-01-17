"use client";

import { useState, useRef, useEffect } from 'react';
import { useEventTracker } from './useEventTracker';

export function useQuizTracking(questionId: string, previousSlideFormat: string) {
    const { trackEvent } = useEventTracker();
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

    const submitQuizResult = (
        userAnswer: string,
        isCorrect: boolean,
        confidence: "guessed" | "somewhat_sure" | "confident" = "somewhat_sure"
    ) => {
        const timeToAnswer = (Date.now() - startTimeRef.current) / 1000;

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
    };

    return {
        logAttempt,
        logNotesOpen,
        logBackNavigation,
        submitQuizResult
    };
}
