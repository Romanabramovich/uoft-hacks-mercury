"use client";

import { useEffect, useState, Suspense } from "react";
import { SlideFrame } from "@/components/slide-viewer/slide-frame";
import { apiClient } from "@/lib/api/client";
import { Course } from "@/lib/api/types";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import React from "react";

function LearnPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const courseId = params.courseId as string;
    const chapterId = searchParams.get("chapterId") || undefined;

    const [course, setCourse] = useState<Course | null>(null);
    const router = useRouter();

    // Enable dynamic generation - set to true to use backend LLM generation
    const enableDynamicGeneration = process.env.NEXT_PUBLIC_ENABLE_DYNAMIC_GENERATION === 'true';
    
    // Mock user ID - in production, get from auth context
    const userId = "student_123";

    useEffect(() => {
        // Only fetch course if NOT using dynamic generation
        // (dynamic generation fetches structure from backend directly)
        if (courseId && !enableDynamicGeneration) {
            apiClient.getCourse(courseId).then(setCourse);
        } else if (courseId && enableDynamicGeneration) {
            // For dynamic generation, just set a minimal course object
            // The actual structure will be fetched by useSlideGeneration hook
            setCourse({
                id: courseId,
                title: "Calculus I: Limits & Derivatives",
                instructorId: "prof_smith",
                chapters: [] // Will be populated by hook
            });
        }
    }, [courseId, enableDynamicGeneration]);

    const handleChapterComplete = (completedChapterId: string) => {
        // Mock persistence of progress
        // Get existing progress
        const storageKey = `course_progress_${courseId}`;
        const existingProgress = JSON.parse(localStorage.getItem(storageKey) || "[]");

        if (!existingProgress.includes(completedChapterId)) {
            const newProgress = [...existingProgress, completedChapterId];
            localStorage.setItem(storageKey, JSON.stringify(newProgress));
        }

        // Return to course page
        router.push(`/dashboard/courses/${courseId}`);
    };

    if (!course) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0b0f19] text-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-zinc-400">Loading personalized content...</span>
            </div>
        );
    }

    return (
        <SlideFrame
            chapters={course.chapters}
            courseTitle={course.title}
            courseId={courseId}
            userId={userId}
            initialChapterId={chapterId}
            onExit={() => router.push(`/dashboard/courses/${courseId}`)}
            onChapterComplete={handleChapterComplete}
            enableDynamicGeneration={enableDynamicGeneration}
        />
    );
}

export default function LearnPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#0b0f19] text-white">Loading...</div>}>
            <LearnPageContent />
        </Suspense>
    );
}
