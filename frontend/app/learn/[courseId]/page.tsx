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

    useEffect(() => {
        // In a real server component we'd await params and fetch data
        // Here we fetch client side for the interaction demo
        if (courseId) {
            apiClient.getCourse(courseId).then(setCourse);
        }
    }, [courseId]);

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
            initialChapterId={chapterId}
            onExit={() => router.push(`/dashboard/courses/${courseId}`)}
            onChapterComplete={handleChapterComplete}
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
