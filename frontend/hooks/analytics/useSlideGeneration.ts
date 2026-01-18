"use client";

import { useState, useEffect } from "react";
import { slidesAPI } from "@/services/api";
import { Slide, Chapter, SlideVariant } from "@/lib/api/types";

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

                // Transform backend structure to frontend Chapter/Slide format
                const transformedChapters: Chapter[] = structure.chapters.map(chapter => ({
                    id: chapter.id,
                    title: chapter.title,
                    slides: chapter.slides.map(slide => ({
                        id: courseId,
                        slideid: slide.slide_id,
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
                }));

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

            // Update the slide with generated content
            const updatedChapters = [...chapters];
            const targetSlide = updatedChapters[chapterIndex].slides[slideIndex];

            if (result.content_type === 'html') {
                targetSlide.variants = {
                    text: {
                        type: "text",
                        content: result.content,
                        durationEstimate: 45
                    }
                };
            } else if (result.content_type === 'manim' && result.video_url) {
                targetSlide.variants = {
                    visual: {
                        type: "visual",
                        content: `<div class="aspect-video"><video src="${result.video_url}" controls autoplay loop /></div>`,
                        mediaUrl: result.video_url,
                        durationEstimate: 60
                    }
                };
            }

            setChapters(updatedChapters);

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

            // Set error state in the slide
            const updatedChapters = [...chapters];
            updatedChapters[chapterIndex].slides[slideIndex].variants = {
                text: {
                    type: "text",
                    content: `<div class="text-center text-red-400 p-8">
                        <p class="font-semibold mb-2">Failed to generate personalized content</p>
                        <p class="text-sm text-zinc-500">${err instanceof Error ? err.message : 'Unknown error'}</p>
                        <p class="text-xs text-zinc-600 mt-2">Using fallback content</p>
                    </div>`,
                    durationEstimate: 0
                }
            };
            setChapters(updatedChapters);
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
