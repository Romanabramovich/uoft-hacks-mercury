"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Maximize2, X, Sparkles } from "lucide-react";
import { Chapter, Slide, SlideVariant, LearningStyle } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DynamicContent } from "@/components/slide-viewer/dynamic-content";
import { useFocusTracking } from "@/hooks/analytics/useFocusTracking";
import { useSlideGeneration } from "@/hooks/analytics/useSlideGeneration";
import { useSlideTracking, SlideContentType } from "@/hooks/analytics/useSlideTracking";
import { useSession } from "@/components/providers/session-provider";
import { slidesAPI } from "@/services/api";

interface SlideFrameProps {
    chapters: Chapter[];
    courseTitle: string;
    courseId: string;
    userId: string;
    initialChapterId?: string;
    onExit: () => void;
    onChapterComplete?: (chapterId: string) => void;
    enableDynamicGeneration?: boolean; // Enable backend LLM generation
}

export function SlideFrame({
    chapters: initialChapters,
    courseTitle,
    courseId,
    userId,
    initialChapterId,
    onExit,
    onChapterComplete,
    enableDynamicGeneration = false
}: SlideFrameProps) {
    // Initialize analytics
    useFocusTracking();
    const { setLastSlide } = useSession();

    // Reset slide tracking on unmount (to avoid counting dashboard time)
    useEffect(() => {
        return () => {
            setLastSlide(null);
        };
    }, [setLastSlide]);

    // Use slide generation hook
    const {
        chapters: generatedChapters,
        loading: loadingStructure,
        error: structureError,
        generateSlideContent,
        isGenerating,
        generatingSlideId
    } = useSlideGeneration({
        courseId,
        userId,
        enableGeneration: enableDynamicGeneration
    });

    // Use generated chapters if dynamic generation is enabled, otherwise use initial chapters
    const chapters = enableDynamicGeneration ? generatedChapters : initialChapters;

    // Core navigation state
    const [currentChapterIndex, setCurrentChapterIndex] = useState(() => {
        if (initialChapterId) {
            const idx = chapters.findIndex(c => c.id === initialChapterId);
            return idx !== -1 ? idx : 0;
        }
        return 0;
    });
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // User preference state
    const [userPreference, setUserPreference] = useState<LearningStyle>("text");
    const [activeVariant, setActiveVariant] = useState<SlideVariant | null>(null);
    const [previousVariant, setPreviousVariant] = useState<SlideVariant | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    console.log("Chapters received in SlideFrame:", chapters);

    // Derived state - simpler and guaranteed to be in sync
    const currentChapter = chapters[currentChapterIndex];
    const slides = currentChapter?.slides || [];
    const currentSlide: Slide | null = slides[currentSlideIndex] || null;

    // Determine content type for analytics
    const getContentType = (type: string | undefined): SlideContentType => {
        switch (type) {
            case "visual": return "diagram-heavy";
            case "example": return "interactive";
            case "text": return "text-heavy";
            default: return "text-heavy";
        }
    };

    useSlideTracking(
        currentSlide?.id || "",
        getContentType(activeVariant?.type)
    );

    // Generate content when navigating to a new slide (if dynamic generation enabled)
    useEffect(() => {
        if (enableDynamicGeneration && currentSlide && !isGenerating) {
            // Check if slide content needs to be generated
            const hasContent = currentSlide.variants.text?.content &&
                !currentSlide.variants.text.content.includes("Loading personalized content");

            if (!hasContent) {
                console.log(`Auto-generating content for slide: ${currentSlide.title}`);
                generateSlideContent(currentChapterIndex, currentSlideIndex);
            }
        }
    }, [currentChapterIndex, currentSlideIndex, enableDynamicGeneration, currentSlide]);

    // Effect to update activeVariant when slide changes or preference changes
    useEffect(() => {
        if (currentSlide) {
            const vars = currentSlide.variants;
            // Try to find variant matching preference, fallback to text, then visual, then any
            const preferredVariant = vars[userPreference] || vars.text || vars.visual || Object.values(vars)[0];
            setActiveVariant(preferredVariant);
        } else {
            setActiveVariant(null);
        }
    }, [currentSlide, userPreference]);

    const handleChapterChange = (value: string) => {
        const index = chapters.findIndex(ch => ch.id === value);
        if (index !== -1) {
            setCurrentChapterIndex(index);
            setCurrentSlideIndex(0); // Reset to first slide of new chapter
        }
    };

    const handleNext = () => {
        if (!currentChapter) return;

        const isLastSlideInChapter = currentSlideIndex === slides.length - 1;

        if (!isLastSlideInChapter) {
            // Next slide in same chapter
            setCurrentSlideIndex(prev => prev + 1);
        } else {
            // End of chapter
            setShowConfetti(true);
        }
    };

    const handleFinish = async () => {
        if (!currentChapter) return;

        // Call backend to mark chapter complete and pre-generate next chapter
        // Run this in the background - don't wait for it
        if (enableDynamicGeneration) {
            // Fire and forget - don't await
            slidesAPI.completeChapter(
                currentChapter.id,
                courseId,
                userId,
                'session_' + Date.now()
            ).then(result => {
                console.log(`✓ Chapter complete!`);
                console.log(`  - Profile generated: ${result.profile_generated}`);
                console.log(`  - Next chapter: ${result.next_chapter_id}`);
                console.log(`  - Pre-generated ${result.slides_generated}/${result.slides_total} slides`);

                if (result.slides_generated > 0) {
                    console.log(`🎉 Next chapter personalized with ${result.slides_generated} slides!`);
                }
            }).catch(error => {
                console.error('Background chapter completion failed:', error);
                // Fail silently - don't block user experience
            });
        }

        // Immediately return to course page - don't wait for generation
        if (onChapterComplete && currentChapter) {
            onChapterComplete(currentChapter.id);
        } else {
            onExit();
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            // Previous slide in same chapter
            setCurrentSlideIndex(prev => prev - 1);
        }
        // Removed chapter backtracking logic to keep it scoped to single chapter
    };

    // Simulation of adaptation trigger
    const triggerAdaptation = (type: LearningStyle | "text" | "example") => {
        if (type === "visual" || type === "text") {
            setUserPreference(type as LearningStyle);
        }

        if (currentSlide?.variants[type]) {
            if (type === "example") {
                setPreviousVariant(activeVariant);
            }
            setActiveVariant(currentSlide.variants[type]);
        }
    };

    const handleBackToPrevious = () => {
        if (previousVariant) {
            setActiveVariant(previousVariant);
            setPreviousVariant(null);
        }
    };

    // Manual regeneration button
    const handleRegenerate = async () => {
        if (enableDynamicGeneration && !isGenerating) {
            await generateSlideContent(currentChapterIndex, currentSlideIndex, true);
        }
    };

    const totalSlides = chapters.reduce((acc, chap) => acc + chap.slides.length, 0);
    // Calculate global progress
    const previousChaptersSlides = chapters.slice(0, currentChapterIndex).reduce((acc, chap) => acc + chap.slides.length, 0);
    const completedSlides = previousChaptersSlides + currentSlideIndex + 1;
    const progress = totalSlides > 0 ? (completedSlides / totalSlides) * 100 : 0;

    // Loading state
    if (loadingStructure) {
        return (
            <div className="flex flex-col h-screen bg-[#0b0f19] text-white items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
                <p className="text-zinc-400">Loading course structure...</p>
            </div>
        );
    }

    // Error state
    if (structureError) {
        return (
            <div className="flex flex-col h-screen bg-[#0b0f19] text-white items-center justify-center">
                <p className="text-red-400 mb-2">Failed to load course</p>
                <p className="text-zinc-500 text-sm mb-4">{structureError}</p>
                <Button onClick={onExit}>Exit</Button>
            </div>
        );
    }

    if (!currentSlide || !activeVariant) {
        return (
            <div className="flex flex-col h-screen bg-[#0b0f19] text-white items-center justify-center">
                <p className="text-zinc-400">No slides available for this chapter.</p>
                <Button onClick={onExit} className="mt-4">Exit</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#0b0f19] text-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#111827]">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" onClick={onExit} className="text-zinc-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="font-semibold">{courseTitle}</h2>
                        <p className="text-xs text-zinc-400">
                            {currentChapter.title} • Slide {currentSlideIndex + 1}/{slides.length}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={currentChapter.id} onValueChange={handleChapterChange}>
                        <SelectTrigger className="w-48 border-zinc-700 text-zinc-300">
                            <SelectValue placeholder="Select Chapter" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111827] border-zinc-700">
                            {chapters.map((chapter) => (
                                <SelectItem key={chapter.id} value={chapter.id} className="text-zinc-300">
                                    {chapter.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="hidden md:flex gap-2">
                        {enableDynamicGeneration && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRegenerate}
                                disabled={isGenerating}
                                className="text-xs border-zinc-700"
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                {isGenerating ? "Generating..." : "Regenerate"}
                            </Button>
                        )}
                        {activeVariant?.type === "example" && previousVariant && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBackToPrevious}
                                className="text-xs border-zinc-700"
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            variant={activeVariant.type === "example" ? "default" : "outline"}
                            size="sm"
                            onClick={() => triggerAdaptation("example")}
                            className="text-xs border-zinc-700"
                        >
                            Example
                        </Button>
                    </div>
                    <Progress value={progress} className="w-32 h-2 bg-zinc-800" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 relative flex items-center justify-center p-8 md:p-16">
                    {isGenerating && generatingSlideId === currentSlide.id ? (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto" />
                            <p className="text-zinc-400">Generating personalized content...</p>
                            <p className="text-zinc-600 text-sm mt-2">This may take a few moments</p>
                        </div>
                    ) : (
                        <DynamicContent
                            variant={activeVariant}
                            title={currentSlide.title}
                            onInteraction={(type: string) => console.log("Interaction:", type)}
                        />
                    )}
                </div>

                {/* Webcam Placeholder - Fixed absolute right */}
                <div className="absolute right-8 top-8 w-64 aspect-video bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden shadow-2xl z-20 flex flex-col items-center justify-center group cursor-move">
                    <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <div className="text-zinc-500 text-xs font-medium group-hover:text-white transition-colors">
                        Webcam Feed
                    </div>
                    {/* Simulated user face placeholder */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 mt-2 border-2 border-white/10" />
                </div>
            </div>

            {/* Footer / Navigation */}
            <div className="flex items-center justify-between px-8 py-6 border-t border-white/10 bg-[#111827]">
                <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentSlideIndex === 0}
                    className="text-zinc-400 hover:text-white"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                    {currentSlideIndex === slides.length - 1
                        ? "Finish Lesson"
                        : "Next Slide"}
                    {currentSlideIndex !== slides.length - 1 && <ChevronRight className="w-5 h-5 ml-2" />}
                </Button>
            </div>

            {showConfetti && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
                    <div className="text-center space-y-4 animate-in zoom-in duration-300">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Chapter Complete!</h1>
                        <p className="text-zinc-400">You've mastered this chapter.</p>
                        <Button onClick={handleFinish} className="mt-4 bg-white text-black hover:bg-gray-200">Return to Course</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
