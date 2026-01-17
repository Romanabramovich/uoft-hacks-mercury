export type LearningStyle =
  | "visual"
  | "text"
  | "kinesthetic"
  | "audio";

export interface LearningProfile {
  optimalFormat: LearningStyle;
  pace: "fast" | "moderate" | "slow";
  attentionSpanMinutes: number;
  bestTimeOfDay: string;
  processingStyle: "bottom_up" | "top_down";
  confidenceScore: number;
}

export interface User {
  id: string;
  name: string;
  role: "student" | "professor";
  profile?: LearningProfile;
}

export interface SlideVariant {
  type: "text" | "visual" | "example" | "quiz"; // Added quiz
  content: string; // HTML content or Question JSON
  mediaUrl?: string; // For images/videos
  durationEstimate?: number; // seconds
  // For quiz type
  quizData?: {
    questionId: string;
    question: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
  };
}

export interface Slide {
  id: string;
  title: string;
  variants: Record<string, SlideVariant>; // key is the variant type or specific ID
}

export interface Chapter {
  id: string;
  title: string;
  slides: Slide[];
}

export interface Course {
  id: string;
  title: string;
  instructorId: string;
  chapters: Chapter[];
}

export interface LearningEvent {
  userId: string;
  slideId: string;
  eventType: "view" | "click" | "scroll" | "quiz" | "adaptation";
  timestamp: string;
  metadata?: Record<string, any>;
}
