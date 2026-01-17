"use client";

import { useEffect, useState } from "react";
import { Course } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";
import { CourseCard } from "@/components/dashboard/courses/course-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.getCourses().then((data) => {
            setCourses(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">My Courses</h2>
                <p className="text-zinc-400">Pick up where you left off.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[200px] rounded-xl bg-white/5 animate-pulse" />
                    ))
                ) : (
                    courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            progress={Math.floor(Math.random() * 100)} // Mock progress for now
                            lastAccessed="2 hours ago"
                        />
                    ))
                )}
            </div>
        </div>
    );
}
