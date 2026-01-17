import { User, Course, Chapters, Slide, LearningEvent } from "./types";

const MOCK_USER: User = {
    id: "student_123",
    name: "Amy Learner",
    role: "student",
    profile: {
        optimalFormat: "text",
        pace: "moderate",
        attentionSpanMinutes: 15,
        bestTimeOfDay: "evening",
        processingStyle: "bottom_up",
        confidenceScore: 0.87,
    },
};

const MOCK_SLIDES: Slide[] = [
    {
        id: "course_calc_101",
        slideid: "slide_1",
        chapterId: "chapter_1",
        title: "Introduction to Derivatives",
        variants: {
            visual: {
                type: "visual",
                content: "<div class='p-4 bg-muted rounded-lg'><h3 class='text-lg font-bold mb-2'>Visual Concept</h3><div class='aspect-video bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-500'>Animated Graph Placeholder</div></div>",
                durationEstimate: 45,
            },
            text: {
                type: "text",
                content: "<div class='prose dark:prose-invert'><h3>Key Definitions</h3><ul><li>A derivative represents the rate of change.</li><li>It is the slope of the tangent line.</li></ul></div>",
                durationEstimate: 30,
            },
            example: {
                type: "example",
                content: "<div class='p-4 border rounded-lg'><h4>Worked Example</h4><p>Find the derivative of f(x) = x²</p><p class='mt-2 font-mono'>f'(x) = 2x</p></div>",
                durationEstimate: 60,
            }
        }
    },
    {
        id: "course_calc_101",
        slideid: "slide_2",
        chapterId: "chapter_1", // Another slide for chapter_1
        title: "Introduction to Derivatives",
        variants: {
            text: {
                type: "text",
                content: "<div class='prose dark:prose-invert'><h3>Additional Concepts</h3><p>Derivatives can be used to find rates of change in various contexts.</p></div>",
                durationEstimate: 40,
            }
        }
    },
    {
        id: "course_calc_101",
        slideid: "slide_1",
        chapterId: "chapter_2", // Slide for chapter_2
        title: "The Power Rule",
        variants: {
            text: {
                type: "text",
                content: "<div class='prose dark:prose-invert'><h3>The Power Rule</h3><p>For any real number n, if f(x) = x^n, then f'(x) = nx^(n-1).</p></div>"
            },
            visual: {
                type: "visual",
                content: "<div class='p-4 bg-muted rounded-lg text-center'>Visual representation of power rule moving exponent to front</div>"
            }
        }
    }
];

const MOCK_CHAPTERS: Chapters[] = [
    {
        id: "chapter_1",
        title: "Derivatives Basics",
        slides: MOCK_SLIDES.filter(slide => slide.chapterId === "chapter_1"), // Populate slides for this chapter
    },
    {
        id: "chapter_2",
        title: "Techniques of Differentiation",
        slides: MOCK_SLIDES.filter(slide => slide.chapterId === "chapter_2"), // Populate slides for this chapter
    }
];

const MOCK_COURSE: Course = {
    id: "course_calc_101",
    title: "Calculus I: Limits & Derivatives",
    instructorId: "prof_smith",
    chapters: MOCK_CHAPTERS, // Use chapters instead of slides
};

const MOCK_COURSES: Course[] = [
    MOCK_COURSE,
    {
        id: "course_phys_101",
        title: "Physics 101: Mechanics",
        instructorId: "prof_doe",
        chapters: [], // Empty chapters for now
    },
    {
        id: "course_hist_200",
        title: "World History: 20th Century",
        instructorId: "prof_jones",
        chapters: [], // Empty chapters for now
    }
];

export class MockService {
    async getCurrentUser(): Promise<User> {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate latency
        return MOCK_USER;
    }

    async getCourses(): Promise<Course[]> {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return MOCK_COURSES;
    }

    async getCourse(courseId: string): Promise<Course> {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return MOCK_COURSE;
    }

    async logEvent(event: LearningEvent): Promise<void> {
        console.log("[MockService] Event Logged:", event);
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
}
