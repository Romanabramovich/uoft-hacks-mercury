"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Course } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, PlayCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function CourseChaptersPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    // Mock progress state - normally fetched from backend
    // In this demo, we'll assume Chapter 1 is complete, Chapter 2 is active, others locked
    const mockCompletedChapterIds = ["chap_1"];

    useEffect(() => {
        if (courseId) {
            apiClient.getCourse(courseId).then((data) => {
                setCourse(data);
                setLoading(false);
            });
        }
    }, [courseId]);

    if (loading || !course) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">{course.title}</h2>
                <p className="text-zinc-400">Select a chapter to continue learning.</p>
            </div>

            <div className="grid gap-4">
                {course.chapters.map((chapter, index) => {
                    const isCompleted = mockCompletedChapterIds.includes(chapter.id);
                    // Chapter is unlocked if it's completed OR if it's the first one OR if the previous one is completed
                    const isPreviousCompleted = index === 0 || mockCompletedChapterIds.includes(course.chapters[index - 1].id);
                    // Active means it's the "newest incomplete lecture" - i.e. previous is done, but this one isn't
                    const isActive = isPreviousCompleted && !isCompleted;
                    const isLocked = !isPreviousCompleted;

                    return (
                        <Card
                            key={chapter.id}
                            className={cn(
                                "border-zinc-800 transition-all duration-200",
                                isLocked ? "bg-[#111827]/30 opacity-60" : "bg-[#1f2937]/50 hover:bg-[#1f2937]/80 hover:border-zinc-700 cursor-pointer",
                                isActive && "border-blue-500/50 bg-blue-500/5"
                            )}
                            onClick={() => {
                                if (!isLocked) {
                                    router.push(`/learn/${course.id}`); // In real app, might pass chapterId too
                                }
                            }}
                        >
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border",
                                        isCompleted ? "bg-green-500/10 border-green-500 text-green-500" :
                                            isActive ? "bg-blue-500/10 border-blue-500 text-blue-500" :
                                                "bg-zinc-800 border-zinc-700 text-zinc-500"
                                    )}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                                            isLocked ? <Lock className="w-4 h-4" /> :
                                                <span className="font-bold">{index + 1}</span>}
                                    </div>
                                    <div>
                                        <h3 className={cn("font-medium text-lg", isLocked ? "text-zinc-500" : "text-white")}>
                                            {chapter.title}
                                        </h3>
                                        <p className="text-sm text-zinc-400">
                                            {chapter.slides.length} Slides • {Math.ceil(chapter.slides.length * 1.5)} mins
                                        </p>
                                    </div>
                                </div>

                                {!isLocked && (
                                    <Button
                                        size="sm"
                                        className={cn(
                                            "min-w-[100px]",
                                            isCompleted ? "bg-transparent border border-zinc-700 hover:bg-zinc-800 text-zinc-300" : "bg-blue-600 hover:bg-blue-700"
                                        )}
                                    >
                                        {isCompleted ? "Review" : "Start"}
                                        {!isCompleted && <PlayCircle className="w-4 h-4 ml-2" />}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
