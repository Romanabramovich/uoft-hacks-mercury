"use client";

import { useEffect, useState } from "react";
import { SlideFrame } from "@/components/slide-viewer/slide-frame";
import { apiClient } from "@/lib/api/client";
import { Course } from "@/lib/api/types";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import React from "react";

export default function LearnPage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const [course, setCourse] = useState<Course | null>(null);
    const router = useRouter();

    useEffect(() => {
        // In a real server component we'd await params and fetch data
        // Here we fetch client side for the interaction demo
        if (courseId) {
            apiClient.getCourse(courseId).then(setCourse);
        }
    }, [courseId]);

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
            onExit={() => router.push("/dashboard")}
        />
    );
}
