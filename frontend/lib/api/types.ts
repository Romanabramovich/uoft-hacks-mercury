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
  type: LearningStyle | "interactive" | "example";
  content: string; // HTML or Markdown content
  mediaUrl?: string; // For images/videos
  durationEstimate?: number; // seconds
}

export interface Slide {
  id: string;
  title: string;
  variants: Record<string, SlideVariant>; // key is the variant type or specific ID
}

export interface Course {
  id: string;
  title: string;
  instructorId: string;
  slides: Slide[];
}

export interface LearningEvent {
  userId: string;
  slideId: string;
  eventType: "view" | "click" | "scroll" | "quiz" | "adaptation";
  timestamp: string;
  metadata?: Record<string, any>;
}
