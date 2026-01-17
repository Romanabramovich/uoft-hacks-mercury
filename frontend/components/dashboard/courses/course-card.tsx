"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Course } from "@/lib/api/types";
import { PlayCircle, BookOpen } from "lucide-react";
import Link from "next/link";

interface CourseCardProps {
    course: Course;
    progress: number; // 0-100
    lastAccessed?: string;
}

export function CourseCard({ course, progress, lastAccessed }: CourseCardProps) {
    return (
        <Card className="bg-[#1f2937]/50 border-white/10 text-white hover:bg-[#1f2937]/80 transition-colors">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-semibold line-clamp-1">{course.title}</CardTitle>
                    <BookOpen className="w-5 h-5 text-zinc-500" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Progress</span>
                        <span className="text-zinc-300 font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-zinc-800" />
                </div>
                {lastAccessed && (
                    <p className="text-xs text-zinc-500">Last accessed: {lastAccessed}</p>
                )}
            </CardContent>
            <CardFooter>
                <Link href={`/learn/${course.id}`} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group">
                        <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Continue Learning
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
