from typing import Dict, List, Any
from datetime import datetime, timedelta
from collections import defaultdict

class LearningIdentity:
    """
    Represents a user's learning identity on a continuous spectrum
    """
    def __init__(self):
        self.visual_text_score = 0.5  # 0.0 = pure text, 1.0 = pure visual
        self.pace = "moderate"  # "fast", "moderate", "slow"
        self.attention_span_minutes = 15
        self.processing_style = "bottom_up"  # "bottom_up" or "top_down"
        self.confidence_score = 0.0
        self.last_updated = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "visual_text_score": self.visual_text_score,
            "pace": self.pace,
            "attention_span_minutes": self.attention_span_minutes,
            "processing_style": self.processing_style,
            "confidence_score": self.confidence_score,
            "last_updated": self.last_updated.isoformat()
        }


class LearningIdentityExtractor:
    """
    Extracts learning identity from user behavioral events
    """
    
    @staticmethod
    def extract_from_events(events: List[Dict[str, Any]], current_identity: Dict[str, Any] = None) -> LearningIdentity:
        """
        Analyze user events and extract/update learning identity
        
        Args:
            events: List of user events from database
            current_identity: Existing identity to update (if any)
        
        Returns:
            LearningIdentity object with updated scores
        """
        identity = LearningIdentity()
        
        # Load current identity if exists
        if current_identity:
            identity.visual_text_score = current_identity.get("visual_text_score", 0.5)
            identity.pace = current_identity.get("pace", "moderate")
            identity.attention_span_minutes = current_identity.get("attention_span_minutes", 15)
            identity.processing_style = current_identity.get("processing_style", "bottom_up")
        
        if not events or len(events) == 0:
            identity.confidence_score = 0.0
            return identity
        
        # Analyze events
        visual_score = LearningIdentityExtractor._analyze_content_preference(events)
        pace_score = LearningIdentityExtractor._analyze_pace(events)
        attention = LearningIdentityExtractor._analyze_attention_span(events)
        processing = LearningIdentityExtractor._analyze_processing_style(events)
        
        # Update identity with weighted average (give more weight to recent behavior)
        alpha = 0.3  # Learning rate - how much to adjust based on new data
        identity.visual_text_score = (1 - alpha) * identity.visual_text_score + alpha * visual_score
        identity.pace = pace_score
        identity.attention_span_minutes = attention
        identity.processing_style = processing
        
        # Calculate confidence based on number of events
        identity.confidence_score = min(len(events) / 100.0, 1.0)  # Max confidence at 100+ events
        identity.last_updated = datetime.now()
        
        return identity
    
    @staticmethod
    def _analyze_content_preference(events: List[Dict[str, Any]]) -> float:
        """
        Analyze which content types user engages with most
        Returns: 0.0 (text-preferring) to 1.0 (visual-preferring)
        """
        content_engagement = defaultdict(lambda: {"time": 0, "success": 0, "count": 0})
        
        for event in events:
            event_type = event.get("event_type", "")
            event_data = event.get("event_data", {})
            
            # Track time on different content types
            if event_type == "slide_viewed":
                content_type = event_data.get("content_type", "text-heavy")
                time_spent = event_data.get("time_spent_seconds", 0)
                
                if "diagram" in content_type or "visual" in content_type:
                    content_engagement["visual"]["time"] += time_spent
                    content_engagement["visual"]["count"] += 1
                elif "text" in content_type:
                    content_engagement["text"]["time"] += time_spent
                    content_engagement["text"]["count"] += 1
                
                # Track interactions that indicate preference
                if event_data.get("zoomed_into_diagram"):
                    content_engagement["visual"]["success"] += 2
                if event_data.get("replayed_animation"):
                    content_engagement["visual"]["success"] += 2
                if event_data.get("scrolled_back") and "text" in content_type:
                    content_engagement["text"]["success"] += 1
            
            # Quiz success after different content types
            elif event_type == "knowledge_check_completed":
                slide_format = event_data.get("slide_format_just_seen", "")
                correct = event_data.get("correct", False)
                
                if correct:
                    if "visual" in slide_format or "diagram" in slide_format:
                        content_engagement["visual"]["success"] += 3
                    elif "text" in slide_format:
                        content_engagement["text"]["success"] += 3
        
        # Calculate score
        visual_total = (content_engagement["visual"]["time"] / 60.0 + 
                       content_engagement["visual"]["success"] * 5 +
                       content_engagement["visual"]["count"] * 2)
        
        text_total = (content_engagement["text"]["time"] / 60.0 + 
                     content_engagement["text"]["success"] * 5 +
                     content_engagement["text"]["count"] * 2)
        
        if visual_total + text_total == 0:
            return 0.5  # Default to middle
        
        visual_preference = visual_total / (visual_total + text_total)
        
        # Clamp between 0.2 and 0.8 to avoid extremes
        return max(0.2, min(0.8, visual_preference))
    
    @staticmethod
    def _analyze_pace(events: List[Dict[str, Any]]) -> str:
        """
        Determine learning pace based on slide navigation speed
        """
        slide_times = []
        
        for event in events:
            if event.get("event_type") == "slide_viewed":
                time_spent = event.get("event_data", {}).get("time_spent_seconds", 0)
                if time_spent > 0:
                    slide_times.append(time_spent)
        
        if not slide_times:
            return "moderate"
        
        avg_time = sum(slide_times) / len(slide_times)
        
        if avg_time < 30:
            return "fast"
        elif avg_time > 90:
            return "slow"
        else:
            return "moderate"
    
    @staticmethod
    def _analyze_attention_span(events: List[Dict[str, Any]]) -> int:
        """
        Estimate attention span in minutes based on focus data
        """
        focus_durations = []
        
        for event in events:
            event_type = event.get("event_type", "")
            event_data = event.get("event_data", {})
            
            if event_type == "focus_change":
                if event_data.get("focus_score", 1.0) < 0.6:
                    # User lost focus - record duration
                    focus_durations.append(event_data.get("time_since_start", 15 * 60) / 60.0)
        
        # Also check for confusion signals (indicate attention loss)
        for event in events:
            if event.get("event_type") == "confusion_detected":
                time_confused = event.get("event_data", {}).get("time_spent_confused", 0) / 60.0
                if time_confused > 0:
                    focus_durations.append(time_confused)
        
        if not focus_durations:
            return 15  # Default 15 minutes
        
        avg_attention = int(sum(focus_durations) / len(focus_durations))
        return max(5, min(30, avg_attention))  # Clamp between 5-30 minutes
    
    @staticmethod
    def _analyze_processing_style(events: List[Dict[str, Any]]) -> str:
        """
        Determine if user prefers top-down (examples first) or bottom-up (theory first)
        """
        navigation_patterns = {"examples_first": 0, "theory_first": 0}
        
        for event in events:
            event_data = event.get("event_data", {})
            
            if event.get("event_type") == "interaction_with_content":
                interaction = event_data.get("interaction_type", "")
                
                if "example" in interaction:
                    navigation_patterns["examples_first"] += 1
                elif "definition" in interaction:
                    navigation_patterns["theory_first"] += 1
            
            # Check slide navigation order
            if event.get("event_type") == "slide_viewed":
                if event_data.get("skipped_forward"):
                    navigation_patterns["examples_first"] += 1
                elif event_data.get("scrolled_back"):
                    navigation_patterns["theory_first"] += 1
        
        if navigation_patterns["examples_first"] > navigation_patterns["theory_first"]:
            return "top_down"
        else:
            return "bottom_up"
    
    @staticmethod
    def adjust_identity_for_confusion(
        identity: Dict[str, Any], 
        confusion_signals: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Adjust learning identity based on confusion signals
        Push towards opposite end of visual-text spectrum if confused
        
        Args:
            identity: Current learning identity
            confusion_signals: Recent confusion signals
        
        Returns:
            Updated identity dict
        """
        if not confusion_signals:
            return identity
        
        current_score = identity.get("visual_text_score", 0.5)
        
        # Count confusion by type
        severe_confusion_count = sum(1 for s in confusion_signals if s.get("severity") == "high")
        medium_confusion_count = sum(1 for s in confusion_signals if s.get("severity") == "medium")
        
        # Calculate adjustment
        # More confusion = larger adjustment
        adjustment = (severe_confusion_count * 0.15 + medium_confusion_count * 0.08)
        
        # Determine direction: if currently visual-leaning, push towards text, and vice versa
        if current_score > 0.5:
            # User is visual-leaning but confused, push towards text
            new_score = current_score - adjustment
        else:
            # User is text-leaning but confused, push towards visual
            new_score = current_score + adjustment
        
        # Clamp between 0.0 and 1.0
        identity["visual_text_score"] = max(0.0, min(1.0, new_score))
        
        return identity
