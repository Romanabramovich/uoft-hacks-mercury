export type EventType =
    | "slide_viewed"
    | "interaction_with_content"
    | "knowledge_check_completed"
    | "pacing_behavior"
    | "confusion_detected"
    | "context_switch";

export interface BaseEvent {
    event: EventType;
    timestamp: string; // ISO format
    user_id: string;
    session_id: string;
}

export interface SlideViewedEvent extends BaseEvent {
    event: "slide_viewed";
    properties: {
        slide_id: string;
        content_type: "diagram-heavy" | "text-heavy" | "video" | "interactive" | "quiz";
        time_spent_seconds: number;
        scrolled_back?: boolean;
        skipped_forward?: boolean;
        paused_video?: boolean;
        replayed_animation?: boolean;
        zoomed_into_diagram?: boolean;
    };
}

export interface InteractionEvent extends BaseEvent {
    event: "interaction_with_content";
    properties: {
        interaction_type: "clicked_example" | "hovered_definition" | "expanded_diagram" | "played_simulation";
        content_element: "interactive_graph" | "code_snippet" | "formula" | "concept_diagram";
        interaction_duration?: number;
        repeated_interaction?: boolean;
        successful_interaction?: boolean;
    };
}

export interface KnowledgeCheckEvent extends BaseEvent {
    event: "knowledge_check_completed";
    properties: {
        question_id: string;
        slide_format_just_seen: string;
        correct: boolean;
        user_answer: string;
        time_to_answer_seconds: number;
        confidence_level?: "guessed" | "somewhat_sure" | "confident";
        attempts_before_correct?: number;
        consulted_notes?: boolean;
        went_back_to_previous_slide?: boolean;
    };
}

export interface PacingEvent extends BaseEvent {
    event: "pacing_behavior";
    properties: {
        slides_per_minute: number;
        pauses_taken?: number;
        pause_duration_avg?: number;
        skipped_slides?: string[];
        requested_slow_down?: boolean;
        requested_skip_ahead?: boolean;
    };
}

export interface ConfusionEvent extends BaseEvent {
    event: "confusion_detected";
    properties: {
        confusion_indicator: "rapid_slide_switching" | "abandoned_quiz" | "searched_external_help" | "asked_question";
        slide_when_confused: string;
        time_spent_confused?: number;
        self_reported_confusion?: boolean;
    };
}

export interface ContextSwitchEvent extends BaseEvent {
    event: "context_switch";
    properties: {
        switched_from: "course_slides";
        switch_trigger?: "after_difficult_slide" | "during_video" | "random";
        time_away: number; // Minutes
        returned: boolean;
        brought_back_information?: boolean;
    };
}

export type LearningEvent =
    | SlideViewedEvent
    | InteractionEvent
    | KnowledgeCheckEvent
    | PacingEvent
    | ConfusionEvent
    | ContextSwitchEvent;
