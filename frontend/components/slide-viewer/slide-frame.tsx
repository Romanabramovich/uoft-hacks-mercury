"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Chapter, Slide, SlideVariant, LearningStyle } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DynamicContent } from "@/components/slide-viewer/dynamic-content";
import { useFocusTracking } from "@/hooks/analytics/useFocusTracking";

interface SlideFrameProps {
    chapters: Chapter[];
    courseTitle: string;
    onExit: () => void;
}

export function SlideFrame({ chapters, courseTitle, onExit }: SlideFrameProps) {
    // Initialize analytics
    useFocusTracking();
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userPreference, setUserPreference] = useState<LearningStyle>("text");
    
    console.log("Chapters received in SlideFrame:", chapters);
    const [currentChapter, setCurrentChapter] = useState<Chapter>(chapters[0]);
    const [slides, setSlides] = useState<Slide[]>(chapters[0]?.slides || []);
    const [currentSlide, setCurrentSlide] = useState<Slide | null>(slides.length > 0 ? slides[0] : null);
    // const [activeVariant, setActiveVariant] = useState<SlideVariant | null>(slides.length > 0 ? (slides[0].variants.text || Object.values(slides[0].variants)[0]) : null);
    
    const [activeVariant, setActiveVariant] = useState<SlideVariant | null>(() => {
        if (slides.length > 0) {
            return slides[0].variants[userPreference] || slides[0].variants.text || Object.values(slides[0].variants)[0];
        }
        return null;
    });

    const [showConfetti, setShowConfetti] = useState(false);

    // Derived state
    // const currentChapter = chapters[currentChapterIndex];
    // const currentSlide = currentChapter?.slides[currentSlideIndex];

    // Safety check if no data
    // WE CANNOT RETURN NULL HERE because it breaks hook ordering
    // if (!currentChapter || !currentSlide) return null;

    // const [activeVariant, setActiveVariant] = useState<SlideVariant | null>(
    //     currentSlide ? (currentSlide.variants.text || Object.values(currentSlide.variants)[0]) : null
    // );


    // useEffect(() => {
    //     if (!currentSlide) {
    //         setActiveVariant(null);
    //         return;
    //     }
    //     // Reset variant when slide changes
    //     const vars = currentSlide.variants;
    //     setActiveVariant(vars.text || Object.values(vars)[0]);
    // }, [currentSlide]);

    useEffect(() => { // ayushi's implementation
        const chapter = chapters[currentChapterIndex];
        if (chapter) {
            setCurrentChapter(chapter);
            setSlides(chapter.slides);
            setCurrentIndex(0); // Reset to first slide when changing chapters
        }
    }, [currentChapterIndex, chapters]);

    useEffect(() => {
        if (slides.length > 0 && currentIndex < slides.length) {
            setCurrentSlide(slides[currentIndex]);
            
            const vars = slides[currentIndex].variants;
            
            const preferredVariant = vars[userPreference] || vars.text || Object.values(vars)[0];
            setActiveVariant(preferredVariant);
        } else {
            setCurrentSlide(null);
            setActiveVariant(null);
        }
    }, [currentIndex, slides, userPreference]);

    const handleChapterChange = (value: string) => {
        const index = chapters.findIndex(ch => ch.id === value);
        if (index !== -1) {
            setCurrentChapterIndex(index);
        }
    };

    const handleNext = () => {
        const isLastSlideInChapter = currentSlideIndex === currentChapter.slides.length - 1;
        const isLastChapter = currentChapterIndex === chapters.length - 1;

        if (!isLastSlideInChapter) {
            // Next slide in same chapter
            setCurrentSlideIndex(prev => prev + 1);
        } else if (!isLastChapter) {
            // Next chapter, first slide
            setCurrentChapterIndex(prev => prev + 1);
            setCurrentSlideIndex(0);
        } else {
            // End of course
            setShowConfetti(true);
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            // Previous slide in same chapter
            setCurrentSlideIndex(prev => prev - 1);
        } else if (currentChapterIndex > 0) {
            // Previous chapter, last slide
            const prevChapter = chapters[currentChapterIndex - 1];
            setCurrentChapterIndex(prev => prev - 1);
            setCurrentSlideIndex(prevChapter.slides.length - 1);
        }
    };

    // Simulation of adaptation trigger
    // const triggerAdaptation = (type: LearningStyle | "text" | "example") => {
    //     if (type === "visual" || type === "text") {
    //         setUserPreference(type);
    //     }
        
    //     if (currentSlide?.variants[type]) {
    //         setActiveVariant(currentSlide.variants[type]);
    //     }
    // };

    const totalSlides = chapters.reduce((acc, chap) => acc + chap.slides.length, 0);
    // Calculate global progress index logic is a bit complex with variable chapter lengths
    // Simplified progress: just mapping completed slides
    const completedSlides = chapters.slice(0, currentChapterIndex).reduce((acc, chap) => acc + chap.slides.length, 0) + currentSlideIndex + 1;
    const progress = (completedSlides / totalSlides) * 100;

    // if (!currentChapter || !currentSlide || !activeVariant) {
    //     return <div className="flex h-screen items-center justify-center bg-[#0b0f19] text-white">Loading...</div>;
    // }

    
    //const progress = slides.length > 0 ? ((currentIndex + 1) / slides.length) * 100 : 0;

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
                            {currentChapter.title} • Slide {currentSlideIndex + 1}/{currentChapter.slides.length}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={currentChapter.id} onValueChange={handleChapterChange}>
                        <SelectTrigger className="w-48 border-zinc-700 text-zinc-300">
                            <SelectValue placeholder="Select Chapter" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111827] border-zinc-700">
                            {chapters.map((chapter, index) => (
                                <SelectItem key={chapter.id} value={chapter.id} className="text-zinc-300">
                                    {chapter.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 relative flex items-center justify-center p-8 md:p-16">
                    <DynamicContent
                        variant={activeVariant}
                        title={currentSlide.title}
                        onInteraction={(type: string) => console.log("Interaction:", type)}
                    />
                </div>

                {/* Webcam Placeholder - Fixed absolute right (not aligned to screen as requested) */}
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
                    disabled={currentChapterIndex === 0 && currentSlideIndex === 0}
                    className="text-zinc-400 hover:text-white"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                    {(currentChapterIndex === chapters.length - 1 && currentSlideIndex === currentChapter.slides.length - 1)
                        ? "Finish Lesson"
                        : "Next Slide"}
                    {!(currentChapterIndex === chapters.length - 1 && currentSlideIndex === currentChapter.slides.length - 1) && <ChevronRight className="w-5 h-5 ml-2" />}
                </Button>
            </div>

            {showConfetti && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
                    <div className="text-center space-y-4 animate-in zoom-in duration-300">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Chapter Complete!</h1>
                        <p className="text-zinc-400">You've mastered this chapter.</p>
                        <Button onClick={() => setShowConfetti(false)} className="mt-4 bg-white text-black hover:bg-gray-200">Continue</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
