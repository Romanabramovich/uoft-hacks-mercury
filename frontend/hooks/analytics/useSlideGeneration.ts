"use client";

import { useState, useEffect } from "react";
import { slidesAPI } from "@/services/api";
import { Slide, Chapter, SlideVariant } from "@/lib/api/types";
import { MockService } from "@/lib/api/mock-service";

interface UseSlideGenerationOptions {
    courseId: string;
    userId: string;
    enableGeneration?: boolean;
}

interface GeneratedSlideCache {
    [slideId: string]: {
        content: string;
        contentType: string;
        timestamp: number;
    };
}

export function useSlideGeneration({ courseId, userId, enableGeneration = true }: UseSlideGenerationOptions) {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generatedCache, setGeneratedCache] = useState<GeneratedSlideCache>({});
    const [generatingSlideId, setGeneratingSlideId] = useState<string | null>(null);

    // Fetch course structure on mount
    useEffect(() => {
        async function fetchCourseStructure() {
            if (!enableGeneration) {
                setLoading(false);
                return; // Use mock data from parent component
            }

            try {
                setLoading(true);
                setError(null);

                const structure = await slidesAPI.getCourseStructure(courseId);


                // Load mock data for chapter_1
                const mockService = new MockService();
                const mockCourse = await mockService.getCourse(courseId);
                const mockChapter1 = mockCourse.chapters.find(ch => ch.id === "chapter_1");

                // Transform backend structure to frontend Chapter/Slide format
                const transformedChapters: Chapter[] = structure.chapters.map(chapter => {
                    // Use hardcoded HTML for chapter_1
                    if (chapter.id === "chapter_1" && mockChapter1) {
                        console.log(`✓ Using hardcoded HTML for ${chapter.id}`);
                        return mockChapter1; // Return the full mock chapter with hardcoded HTML
                    }

                    // For other chapters, initialize with placeholder content
                    console.log(`✓ Initializing ${chapter.id} with placeholder content for LLM generation`);
                    return {
                        id: chapter.id,
                        title: chapter.title,
                        slides: chapter.slides.map(slide => ({
                            id: slide.slide_id,
                            courseId: courseId,
                            chapterId: chapter.id,
                            title: slide.title,
                            variants: {
                                // Initially empty - will be populated on-demand
                                text: {
                                    type: "text" as const,
                                    content: `<div class="text-center text-zinc-400">Loading personalized content...</div>`,
                                    durationEstimate: 0
                                }
                            }
                        }))
                    };
                });

                setChapters(transformedChapters);
            } catch (err) {
                console.error('Failed to fetch course structure:', err);
                setError(err instanceof Error ? err.message : 'Failed to load course');
            } finally {
                setLoading(false);
            }
        }

        fetchCourseStructure();
    }, [courseId, enableGeneration]);

    /**
     * Generate personalized content for a specific slide
     */
    const generateSlideContent = async (
        chapterIndex: number,
        slideIndex: number,
        forceRegenerate = false
    ): Promise<void> => {
        if (!enableGeneration) return;

        const chapter = chapters[chapterIndex];
        if (!chapter) return;

        // CRITICAL: Never generate content for chapter_1 (baseline chapter)
        // Chapter 1 uses hardcoded HTML to establish baseline behavior
        if (chapter.id === "chapter_1" || chapter.id.includes("chapter_1")) {
            console.log(`⚠️ Skipping generation for ${chapter.id} - baseline chapter uses hardcoded content`);
            return;
        }

        const slide = chapter.slides[slideIndex];
        if (!slide) return;

        const cacheKey = `${chapter.id}_${slide.id}`;

        // Check cache first
        if (!forceRegenerate && generatedCache[cacheKey]) {
            const cached = generatedCache[cacheKey];
            // Use cache if less than 1 hour old
            if (Date.now() - cached.timestamp < 3600000) {
                console.log(`Using cached content for ${slide.title}`);
                return;
            }
        }

        try {
            setGeneratingSlideId(slide.id);
            console.log(`Generating personalized content for: ${slide.title}`);

            // First, check if pre-generated slides exist
            const preGenerated = await slidesAPI.getPreGeneratedSlides(
                userId,
                courseId,
                chapter.id
            );

            let result;
            const preGenSlide = preGenerated.slides.find(s => s.slide_id === slide.id);

            if (preGenSlide && !forceRegenerate) {
                console.log(`✓ Using pre-generated content for ${slide.title}`);
                result = {
                    content: preGenSlide.content,
                    content_type: preGenSlide.content_type as 'html' | 'manim',
                    video_url: preGenSlide.video_url,
                    thumbnail_url: preGenSlide.thumbnail_url
                };
            } else {
                // Generate on-demand
                console.log(`Generating content for ${slide.title} - on demand`);
                const structure = await slidesAPI.getCourseStructure(courseId);
                const chapterData = structure.chapters.find(c => c.id === chapter.id);
                const slideData = chapterData?.slides.find(s => s.slide_id === slide.id);

                if (!slideData) {
                    throw new Error('Slide data not found');
                }

                result = await slidesAPI.generateSlideContent(
                    userId,
                    slideData.title,
                    slideData.learning_objectives,
                    slideData.context
                );
            }

            // Update the slide with generated content immutably
            setChapters(prevChapters => prevChapters.map((chapter, cIdx) => {
                if (cIdx !== chapterIndex) return chapter;

                return {
                    ...chapter,
                    slides: chapter.slides.map((slide, sIdx) => {
                        if (sIdx !== slideIndex) return slide;

                        let newVariants = { ...slide.variants };

                        if (result.content_type === 'html') {
                            newVariants.text = {
                                type: "text",
                                content: result.content,
                                durationEstimate: 45
                            };
                        } else if (result.content_type === 'manim' && result.video_url) {
                            newVariants.visual = {
                                type: "visual",
                                content: `<div class="aspect-video"><video src="${result.video_url}" controls autoplay loop /></div>`,
                                mediaUrl: result.video_url,
                                durationEstimate: 60
                            };
                        }

                        return {
                            ...slide,
                            variants: newVariants
                        };
                    })
                };
            }));

            // Cache the result
            setGeneratedCache(prev => ({
                ...prev,
                [cacheKey]: {
                    content: result.content,
                    contentType: result.content_type,
                    timestamp: Date.now()
                }
            }));

            console.log(`✓ Generated content for ${slide.title} (${result.content_type})`);
        } catch (err) {
            console.error(`Failed to generate slide content:`, err);

            // Differentiate error types for better UX
            let errorMessage = 'Failed to generate personalized content';
            let errorDetail = '';

            if (err instanceof Error) {
                if (err.message.includes('timeout') || err.message.includes('aborted')) {
                    errorMessage = 'Content generation timed out';
                    errorDetail = 'The AI is taking longer than expected. Please try again.';
                } else if (err.message.includes('404') || err.message.includes('not found')) {
                    errorMessage = 'Model not available';
                    errorDetail = 'The AI model is temporarily unavailable. Please try again later.';
                } else if (err.message.includes('500')) {
                    errorMessage = 'Server error during generation';
                    errorDetail = err.message;
                } else {
                    errorDetail = err.message;
                }
            }

            // Set error state in the slide with retry button immutably
            setChapters(prevChapters => prevChapters.map((chapter, cIdx) => {
                if (cIdx !== chapterIndex) return chapter;

                return {
                    ...chapter,
                    slides: chapter.slides.map((slide, sIdx) => {
                        if (sIdx !== slideIndex) return slide;

                        return {
                            ...slide,
                            variants: {
                                ...slide.variants,
                                text: {
                                    type: "text",
                                    content: `<div class="text-center p-8 bg-red-900/20 border border-red-700/50 rounded-lg">
                                        <div class="text-red-400 mb-4">
                                            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                            </svg>
                                            <p class="font-semibold text-lg mb-2">${errorMessage}</p>
                                            <p class="text-sm text-zinc-400 mb-4">${errorDetail}</p>
                                        </div>
                                        <div class="space-y-3">
                                            <button 
                                                onclick="window.location.reload()" 
                                                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                            >
                                                Try Again
                                            </button>
                                            <p class="text-xs text-zinc-500">
                                                If this problem persists, please contact support or try a different slide.
                                            </p>
                                        </div>
                                    </div>`,
                                    durationEstimate: 0
                                }
                            }
                        };
                    })
                };
            }));
        } finally {
            setGeneratingSlideId(null);
        }
    };

    return {
        chapters,
        loading,
        error,
        generateSlideContent,
        isGenerating: generatingSlideId !== null,
        generatingSlideId
    };
}
