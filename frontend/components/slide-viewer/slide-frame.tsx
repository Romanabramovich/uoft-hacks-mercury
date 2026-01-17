"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Slide, SlideVariant } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DynamicContent } from "@/components/slide-viewer/dynamic-content";

interface SlideFrameProps {
    slides: Slide[];
    courseTitle: string;
    onExit: () => void;
}

export function SlideFrame({ slides, courseTitle, onExit }: SlideFrameProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSlide, setCurrentSlide] = useState<Slide>(slides[0]);
    const [activeVariant, setActiveVariant] = useState<SlideVariant>(slides[0].variants.text || Object.values(slides[0].variants)[0]);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        setCurrentSlide(slides[currentIndex]);
        // Reset variant logic would go here (or keep persistence)
        // For demo, we default to text or visual randomly to simulate adaptation
        const vars = slides[currentIndex].variants;
        // Defaulting to first available
        setActiveVariant(vars.text || Object.values(vars)[0]);
    }, [currentIndex, slides]);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowConfetti(true);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Simulation of adaptation trigger
    const triggerAdaptation = (type: "visual" | "text" | "example") => {
        // In real app, this comes from backend push or websocket
        if (currentSlide.variants[type]) {
            setActiveVariant(currentSlide.variants[type]);
        }
    };

    const progress = ((currentIndex + 1) / slides.length) * 100;

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
                        <p className="text-xs text-zinc-400">Slide {currentIndex + 1} of {slides.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => triggerAdaptation("visual")} className="text-xs border-zinc-700 text-zinc-300">
                            Simulate: Visual Adapt
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => triggerAdaptation("text")} className="text-xs border-zinc-700 text-zinc-300">
                            Simulate: Text Adapt
                        </Button>
                    </div>
                    <Progress value={progress} className="w-32 h-2 bg-zinc-800" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative flex items-center justify-center p-8 md:p-16">
                    <DynamicContent
                        variant={activeVariant}
                        title={currentSlide.title}
                        onInteraction={(type: string) => console.log("Interaction:", type)}
                    />
                </div>
            </div>

            {/* Footer / Navigation */}
            <div className="flex items-center justify-between px-8 py-6 border-t border-white/10 bg-[#111827]">
                <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="text-zinc-400 hover:text-white"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                    {currentIndex === slides.length - 1 ? "Finish Lesson" : "Next Slide"}
                    {currentIndex < slides.length - 1 && <ChevronRight className="w-5 h-5 ml-2" />}
                </Button>
            </div>

            {showConfetti && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm">
                    <div className="text-center space-y-4 animate-in zoom-in duration-300">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Lesson Complete!</h1>
                        <p className="text-zinc-400">You've mastered this concept.</p>
                        <Link href="/dashboard">
                            <Button size="lg" className="mt-4 bg-white text-black hover:bg-gray-200">Return to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
