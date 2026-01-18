from typing import Dict, List, Any
from datetime import datetime


def calculate_understanding_score(
    time_spent: int,
    expected_time: int,
    avg_focus_score: float,
    chapter_position: int
) -> Dict[str, Any]:
    
    if expected_time <= 0:
        expected_time = 60
    
    time_ratio = time_spent / expected_time
    
    time_penalty = 0.0
    if time_ratio > 1.5:
        time_penalty = min((time_ratio - 1.0) * 0.3, 0.6)
    elif time_ratio < 0.3:
        time_penalty = min((0.3 - time_ratio) * 0.4, 0.5)
    
    focus_penalty = (1.0 - avg_focus_score) * 0.5
    
    understanding = max(0.0, min(1.0, 1.0 - (time_penalty + focus_penalty)))
    
    confusion_level = "none"
    if understanding < 0.3:
        confusion_level = "high"
    elif understanding < 0.5:
        confusion_level = "medium"
    elif understanding < 0.7:
        confusion_level = "low"
    
    return {
        "understanding_score": round(understanding, 3),
        "time_ratio": round(time_ratio, 2),
        "time_penalty": round(time_penalty, 3),
        "focus_penalty": round(focus_penalty, 3),
        "confusion_level": confusion_level,
        "requires_intervention": understanding < 0.5
    }


def calculate_expected_time(
    base_time: int,
    chapter_position: int,
    total_slides_in_chapter: int,
   
) -> int:
    
    
    increase_per_slide = base_time * 0.15
    expected = base_time + (chapter_position - 1) * increase_per_slide
    
    return max(30, min(int(expected), 600))


def aggregate_focus_scores(focus_history: List[float]) -> Dict[str, float]:
    
    if not focus_history:
        return {
            "avg_focus": 1.0,
            "min_focus": 1.0,
            "max_focus": 1.0,
            "focus_variance": 0.0
        }
    
    avg = sum(focus_history) / len(focus_history)
    min_focus = min(focus_history)
    max_focus = max(focus_history)
    
    variance = sum((x - avg) ** 2 for x in focus_history) / len(focus_history)
    
    return {
        "avg_focus": round(avg, 3),
        "min_focus": round(min_focus, 3),
        "max_focus": round(max_focus, 3),
        "focus_variance": round(variance, 3)
    }


def should_adjust_identity(
    understanding_score: float,
    recent_understanding_scores: List[float],
    threshold: float = 0.5
) -> bool:
    
    if understanding_score < threshold:
        return True
    
    if len(recent_understanding_scores) >= 3:
        recent_avg = sum(recent_understanding_scores[-3:]) / 3
        if recent_avg < threshold:
            return True
    
    return False
