from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from .database import get_database
from .learning_identity import LearningIdentityExtractor
from .gemini_generator import get_slide_generator
from .understanding_calculator import (
    calculate_understanding_score,
    calculate_expected_time,
    aggregate_focus_scores,
    should_adjust_identity
)
import threading
from .screen_tracker import ScreenTimeTracker

# Webcam Tracker Global State
tracker_instance = None
tracker_thread = None

app = FastAPI(title="Mercury API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database instance
db = get_database()

# Mount static files for animations (videos)
import os
MANIM_OUTPUT_DIR = os.getenv("MANIM_OUTPUT_DIR", "./generated_animations")
try:
    app.mount("/animations", StaticFiles(directory=MANIM_OUTPUT_DIR), name="animations")
except RuntimeError:
    # Directory doesn't exist yet, will be created when first animation is generated
    pass

# Pydantic models for request/response validation
class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    preferences: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

class SlideResponse(BaseModel):
    slide_id: str
    user_id: str
    content: Dict[str, Any]
    adaptations: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class Event(BaseModel):
    user_id: str
    event_type: str = Field(..., description="Type of event (e.g., 'page_view', 'click', 'quiz_attempt')")
    event_data: Dict[str, Any] = Field(..., description="Event-specific data")
    timestamp: Optional[datetime] = None
    session_id: Optional[str] = None

class EventResponse(BaseModel):
    event_id: str
    message: str
    timestamp: datetime

class Adaptation(BaseModel):
    adaptation_id: str
    user_id: str
    adaptation_type: str
    content: Dict[str, Any]
    created_at: datetime
    effectiveness_score: Optional[float] = None

class SessionState(BaseModel):
    session_id: str
    user_id: str
    current_slide_id: Optional[str] = None
    time_on_current_slide: float = 0.0
    is_focused: bool = True
    focus_percentage: float = 1.0
    confusion_signals: List[str] = []
    last_updated: datetime
    focus_history: List[float] = []
    slide_metrics: Dict[str, Any] = {}

class FocusUpdate(BaseModel):
    user_id: str
    session_id: str
    is_focused: bool
    focus_score: Optional[float] = None  # 0.0 to 1.0 from CV
    timestamp: Optional[datetime] = None

class ConfusionSignal(BaseModel):
    signal_type: str  # "stuck_on_slide", "quiz_failed", "rapid_navigation", etc.
    severity: str  # "low", "medium", "high"
    metadata: Optional[Dict[str, Any]] = None

class LearningIdentityResponse(BaseModel):
    user_id: str
    visual_text_score: float  # 0.0 (text) to 1.0 (visual)
    pace: str
    attention_span_minutes: int
    processing_style: str
    confidence_score: float
    last_updated: str

class SessionStartRequest(BaseModel):
    user_id: str
    session_id: str

class SessionEndRequest(BaseModel):
    user_id: str
    session_id: str

class SlideChangeRequest(BaseModel):
    user_id: str
    new_slide_id: str
    previous_slide_id: Optional[str] = None
    time_on_previous: Optional[float] = None

class QuizResultRequest(BaseModel):
    user_id: str
    slide_id: str
    quiz_id: str
    score: float  # 0.0 to 1.0
    passed: bool

class SlideGenerationRequest(BaseModel):
    topic: str
    learning_objectives: str
    user_id: str
    context: Optional[str] = None
    previous_content: Optional[str] = None
    force_format: Optional[str] = None  # "html" or "manim"

class SlideGenerationResponse(BaseModel):
    content: str
    content_type: str  # "html" or "manim"
    visual_text_score: float
    topic: str
    video_url: Optional[str] = None  # For manim animations
    thumbnail_url: Optional[str] = None  # For manim animations
    metadata: Dict[str, Any]


# Helper function to convert MongoDB ObjectId to string
def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ENDPOINT 1: GET User Profile
@app.get("/api/users/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """
    Retrieve a user's profile information.
    - user_id: The unique identifier for the user
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        user = db.users.find_one({"user_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")
        
        return UserProfile(
            user_id=user.get("user_id"),
            name=user.get("name", ""),
            email=user.get("email", ""),
            preferences=user.get("preferences"),
            created_at=user.get("created_at")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")


# ENDPOINT 2: GET Slide for User
@app.get("/api/slide/{slide_id}/for/{user_id}", response_model=SlideResponse)
async def get_slide_for_user(slide_id: str, user_id: str):
    """
    Retrieve a specific slide with user-specific adaptations.
    
    - slide_id: The unique identifier for the slide
    - user_id: The unique identifier for the user
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Fetch the base slide
        slide = db.slides.find_one({"slide_id": slide_id})
        
        if not slide:
            raise HTTPException(status_code=404, detail=f"Slide {slide_id} not found")
        
        # Fetch user-specific adaptations for this slide
        adaptations = db.adaptations.find_one({
            "user_id": user_id,
            "slide_id": slide_id
        })
        
        return SlideResponse(
            slide_id=slide.get("slide_id"),
            user_id=user_id,
            content=slide.get("content", {}),
            adaptations=adaptations.get("data") if adaptations else None,
            metadata=slide.get("metadata")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching slide: {str(e)}")


# ENDPOINT 3: GET User Adaptations
@app.get("/api/users/{user_id}/adaptations", response_model=List[Adaptation])
async def get_user_adaptations(
    user_id: str,
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results")
):
    """
    Retrieve adaptations for a specific user.
    
    - user_id: The unique identifier for the user
    - limit: Maximum number of adaptations to return (1-100)
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Fetch adaptations with limit, sorted by most recent
        query = {"user_id": user_id}
        adaptations_cursor = db.adaptations.find(query).sort("created_at", -1).limit(limit)
        adaptations = list(adaptations_cursor)
        
        if not adaptations:
            return []
        
        return [
            Adaptation(
                adaptation_id=str(adapt.get("_id")),
                user_id=adapt.get("user_id"),
                adaptation_type=adapt.get("adaptation_type", ""),
                content=adapt.get("content", {}),
                created_at=adapt.get("created_at", datetime.now()),
                effectiveness_score=adapt.get("effectiveness_score")
            )
            for adapt in adaptations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching adaptations: {str(e)}")


# ENDPOINT 4: POST Event
@app.post("/api/events", response_model=EventResponse, status_code=201)
async def create_event(event: Event):
    """
    Log a new user event (analytics/tracking).
    
    - event: Event data including user_id, event_type, and event_data
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Prepare event document
        event_doc = {
            "user_id": event.user_id,
            "event_type": event.event_type,
            "event_data": event.event_data,
            "timestamp": event.timestamp or datetime.now(),
            "session_id": event.session_id
        }
        
        # Insert into database
        result = db.events.insert_one(event_doc)
        
        return EventResponse(
            event_id=str(result.inserted_id),
            message="Event logged successfully",
            timestamp=event_doc["timestamp"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging event: {str(e)}")


# INTERVENTION SYSTEM
active_sessions = {}

@app.post("/api/session/start")
async def start_session(request: SessionStartRequest):
    """
    Initialize a new learning session for real-time monitoring.
    
    - user_id: The unique identifier for the user
    - session_id: Unique session identifier (generated by frontend)
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        session_data = {
            "session_id": request.session_id,
            "user_id": request.user_id,
            "started_at": datetime.now(),
            "current_slide_id": None,
            "time_on_current_slide": 0,
            "is_focused": True,
            "focus_percentage": 1.0,
            "confusion_signals": [],
            "last_updated": datetime.now(),
            "focus_history": [],
            "slide_metrics": {}
        }
        
        # Store in cache for real-time access
        active_sessions[request.session_id] = session_data
        
        # Also persist to database
        db.sessions.insert_one(session_data)
        
        return {
            "session_id": request.session_id,
            "message": "Session started",
            "timestamp": session_data["started_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting session: {str(e)}")

@app.post("/api/session/{session_id}/focus")
async def update_focus_state(session_id: str, focus_update: FocusUpdate):
    """
    Update focus state based on computer vision detection.
    Frontend sends this whenever CV detects focus changes.
    
    - session_id: Current session identifier
    - focus_update: Focus data from computer vision
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        focus_score = focus_update.focus_score or (1.0 if focus_update.is_focused else 0.0)
        
        if session_id in active_sessions:
            session = active_sessions[session_id]
            session["is_focused"] = focus_update.is_focused
            session["focus_percentage"] = focus_score
            session["last_updated"] = focus_update.timestamp or datetime.now()
            
            if "focus_history" not in session:
                session["focus_history"] = []
            session["focus_history"].append(focus_score)
            
            if len(session["focus_history"]) > 1000:
                session["focus_history"] = session["focus_history"][-500:]
        
        focus_event = {
            "user_id": focus_update.user_id,
            "session_id": session_id,
            "event_type": "focus_change",
            "event_data": {
                "is_focused": focus_update.is_focused,
                "focus_score": focus_score
            },
            "timestamp": focus_update.timestamp or datetime.now()
        }
        db.events.insert_one(focus_event)
        
        return {
            "message": "Focus state updated",
            "is_focused": focus_update.is_focused,
            "timestamp": focus_event["timestamp"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating focus: {str(e)}")


@app.get("/api/session/{session_id}/state")
async def get_session_state(session_id: str):
    """
    Get current session state for monitoring dashboard.
    
    - session_id: Current session identifier
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Try cache first for real-time data
        if session_id in active_sessions:
            session = active_sessions[session_id]
            return SessionState(**session)
        
        # Fallback to database
        session = db.sessions.find_one({"session_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        # Remove MongoDB _id for serialization
        session.pop("_id", None)
        return SessionState(**session)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching session state: {str(e)}")


@app.post("/api/session/{session_id}/slide-change")
async def track_slide_change(
    session_id: str,
    request: SlideChangeRequest
):
    """
    Track when student moves to a new slide.
    Detects if they were stuck on previous slide.
    Adjusts learning identity if confusion detected.
    
    - session_id: Current session identifier
    - user_id: The user viewing slides
    - new_slide_id: Slide they're moving to
    - previous_slide_id: Slide they're leaving
    - time_on_previous: How long they spent on previous slide (seconds)
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        confusion_signals = []
        
        # Detect "stuck on slide" signal
        STUCK_THRESHOLD = 300  # 5 minutes
        if request.time_on_previous and request.time_on_previous > STUCK_THRESHOLD:
            signal = {
                "signal_type": "stuck_on_slide",
                "severity": "medium" if request.time_on_previous < 600 else "high",
                "metadata": {
                    "slide_id": request.previous_slide_id,
                    "time_spent": request.time_on_previous
                },
                "detected_at": datetime.now()
            }
            confusion_signals.append(signal)
            
            # Log confusion signal
            db.confusion_signals.insert_one({
                "user_id": request.user_id,
                "session_id": session_id,
                **signal
            })
        
        # Update session state
        if session_id in active_sessions:
            session = active_sessions[session_id]
            session["current_slide_id"] = request.new_slide_id
            session["time_on_current_slide"] = 0
            session["confusion_signals"].extend(confusion_signals)
            session["last_updated"] = datetime.now()
        
        # Log slide change event
        db.events.insert_one({
            "user_id": request.user_id,
            "session_id": session_id,
            "event_type": "slide_change",
            "event_data": {
                "from_slide": request.previous_slide_id,
                "to_slide": request.new_slide_id,
                "time_on_previous": request.time_on_previous
            },
            "timestamp": datetime.now()
        })
        
        # ADJUST LEARNING IDENTITY if confusion detected
        if confusion_signals:
            user = db.users.find_one({"user_id": request.user_id})
            if user and "learning_identity" in user:
                identity = user["learning_identity"]
                adjusted_identity = LearningIdentityExtractor.adjust_identity_for_confusion(
                    identity, confusion_signals
                )
                
                # Update in database
                db.users.update_one(
                    {"user_id": request.user_id},
                    {"$set": {"learning_identity": adjusted_identity}}
                )
        
        return {
            "message": "Slide change tracked",
            "confusion_signals_detected": len(confusion_signals),
            "signals": confusion_signals,
            "identity_adjusted": len(confusion_signals) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking slide change: {str(e)}")


@app.post("/api/session/{session_id}/quiz-result")
async def track_quiz_result(
    session_id: str,
    request: QuizResultRequest
):
    """
    Track quiz completion and detect confusion if failed.
    Adjusts learning identity if confusion detected.
    
    - session_id: Current session identifier
    - user_id: The user taking quiz
    - slide_id: Slide the quiz is on
    - quiz_id: Quiz identifier
    - score: Quiz score (0.0 to 1.0)
    - passed: Whether they passed
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        confusion_signals = []
        
        # Detect quiz failure signal
        if not request.passed or request.score < 0.6:
            severity = "low" if request.score >= 0.4 else "medium" if request.score >= 0.2 else "high"
            signal = {
                "signal_type": "quiz_failed",
                "severity": severity,
                "metadata": {
                    "slide_id": request.slide_id,
                    "quiz_id": request.quiz_id,
                    "score": request.score
                },
                "detected_at": datetime.now()
            }
            confusion_signals.append(signal)
            
            # Log confusion signal
            db.confusion_signals.insert_one({
                "user_id": request.user_id,
                "session_id": session_id,
                **signal
            })
        
        # Update session state
        if session_id in active_sessions:
            session = active_sessions[session_id]
            session["confusion_signals"].extend(confusion_signals)
            session["last_updated"] = datetime.now()
        
        # Log quiz event
        db.events.insert_one({
            "user_id": request.user_id,
            "session_id": session_id,
            "event_type": "quiz_completed",
            "event_data": {
                "slide_id": request.slide_id,
                "quiz_id": request.quiz_id,
                "score": request.score,
                "passed": request.passed
            },
            "timestamp": datetime.now()
        })
        
        # ADJUST LEARNING IDENTITY if confusion detected
        if confusion_signals:
            user = db.users.find_one({"user_id": request.user_id})
            if user and "learning_identity" in user:
                identity = user["learning_identity"]
                adjusted_identity = LearningIdentityExtractor.adjust_identity_for_confusion(
                    identity, confusion_signals
                )
                
                # Update in database
                db.users.update_one(
                    {"user_id": request.user_id},
                    {"$set": {"learning_identity": adjusted_identity}}
                )
        
        return {
            "message": "Quiz result tracked",
            "passed": request.passed,
            "confusion_signals_detected": len(confusion_signals),
            "signals": confusion_signals,
            "identity_adjusted": len(confusion_signals) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking quiz result: {str(e)}")


@app.get("/api/users/{user_id}/confusion-signals")
async def get_confusion_signals(
    user_id: str,
    session_id: Optional[str] = Query(None, description="Filter by session"),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Retrieve confusion signals detected for a user.
    Used for monitoring dashboard and analytics.
    
    - user_id: The unique identifier for the user
    - session_id: Optional filter by specific session
    - limit: Maximum number of signals to return
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        query = {"user_id": user_id}
        if session_id:
            query["session_id"] = session_id
        
        signals = list(
            db.confusion_signals.find(query)
            .sort("detected_at", -1)
            .limit(limit)
        )
        
        # Remove MongoDB _id for serialization
        for signal in signals:
            signal["_id"] = str(signal["_id"])
        
        return {
            "user_id": user_id,
            "total_signals": len(signals),
            "signals": signals
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching confusion signals: {str(e)}")


@app.post("/api/session/{session_id}/end")
async def end_session(session_id: str, request: SessionEndRequest):
    """
    End a learning session and clean up.
    
    - session_id: Session to end
    - user_id: User ending session
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Get final session state
        session = active_sessions.get(session_id)
        
        if session:
            # Update database with final state
            db.sessions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "ended_at": datetime.now(),
                        "final_state": session
                    }
                }
            )
            
            # Remove from cache
            del active_sessions[session_id]
        
        return {
            "message": "Session ended",
            "session_id": session_id,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending session: {str(e)}")


# LEARNING IDENTITY EXTRACTION
@app.post("/api/users/{user_id}/extract-identity", response_model=LearningIdentityResponse)
async def extract_learning_identity(user_id: str, lookback_days: int = Query(30, ge=1, le=90)):
    """
    Extract/update user's learning identity based on behavioral events.
    Uses heuristic analysis of past events to determine learning preferences.
    
    - user_id: The unique identifier for the user
    - lookback_days: Number of days to analyze (default: 30)
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Fetch user's recent events
        cutoff_date = datetime.now() - timedelta(days=lookback_days)
        events_cursor = db.events.find({
            "user_id": user_id,
            "timestamp": {"$gte": cutoff_date}
        }).sort("timestamp", -1)
        
        events = list(events_cursor)
        
        # Get current identity if exists
        user = db.users.find_one({"user_id": user_id})
        current_identity = user.get("learning_identity") if user else None
        
        # Extract identity using heuristics
        identity = LearningIdentityExtractor.extract_from_events(events, current_identity)
        identity_dict = identity.to_dict()
        
        # Update user record in database
        db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "learning_identity": identity_dict,
                    "identity_last_updated": datetime.now()
                }
            },
            upsert=True
        )
        
        return LearningIdentityResponse(
            user_id=user_id,
            visual_text_score=identity.visual_text_score,
            pace=identity.pace,
            attention_span_minutes=identity.attention_span_minutes,
            processing_style=identity.processing_style,
            confidence_score=identity.confidence_score,
            last_updated=identity.last_updated.isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting learning identity: {str(e)}")


@app.get("/api/users/{user_id}/learning-identity", response_model=LearningIdentityResponse)
async def get_learning_identity(user_id: str):
    """
    Get user's current learning identity.
    If not yet extracted, returns default values.
    
    - user_id: The unique identifier for the user
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        user = db.users.find_one({"user_id": user_id})
        
        if not user or "learning_identity" not in user:
            # Return default identity
            return LearningIdentityResponse(
                user_id=user_id,
                visual_text_score=0.5,
                pace="moderate",
                attention_span_minutes=15,
                processing_style="bottom_up",
                confidence_score=0.0,
                last_updated=datetime.now().isoformat()
            )
        
        identity = user["learning_identity"]
        return LearningIdentityResponse(
            user_id=user_id,
            visual_text_score=identity.get("visual_text_score", 0.5),
            pace=identity.get("pace", "moderate"),
            attention_span_minutes=identity.get("attention_span_minutes", 15),
            processing_style=identity.get("processing_style", "bottom_up"),
            confidence_score=identity.get("confidence_score", 0.0),
            last_updated=identity.get("last_updated", datetime.now().isoformat())
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching learning identity: {str(e)}")


# ============================================================================
# DYNAMIC SLIDE GENERATION
# ============================================================================

@app.post("/api/slides/generate", response_model=SlideGenerationResponse)
async def generate_slide(request: SlideGenerationRequest):
    """
    Generate slide content dynamically using Gemini API based on user's learning identity.
    The content is generated on a continuous spectrum between visual and text-heavy.
    
    - request: Slide generation parameters including topic, objectives, and user_id
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Get user's learning identity
        user = db.users.find_one({"user_id": request.user_id})
        
        if not user or "learning_identity" not in user:
            # Use default or extract identity first
            raise HTTPException(
                status_code=404, 
                detail=f"Learning identity not found for user {request.user_id}. Please call /extract-identity first."
            )
        
        identity = user["learning_identity"]
        visual_text_score = identity.get("visual_text_score", 0.5)
        
        # Get slide generator
        generator = get_slide_generator()
        
        # Generate content (HTML or Manim based on visual_text_score)
        result = generator.generate_slide_content(
            topic=request.topic,
            learning_objectives=request.learning_objectives,
            visual_text_score=visual_text_score,
            context=request.context,
            previous_content=request.previous_content,
            force_format=request.force_format
        )
        
        # Log the generation event
        db.slide_generations.insert_one({
            "user_id": request.user_id,
            "topic": request.topic,
            "visual_text_score": visual_text_score,
            "generated_at": datetime.now(),
            "metadata": result.get("metadata", {})
        })
        
        return SlideGenerationResponse(
            content=result["content"],
            content_type=result.get("content_type", "html"),
            visual_text_score=result["visual_text_score"],
            topic=result["topic"],
            video_url=result.get("video_url"),
            thumbnail_url=result.get("thumbnail_url"),
            metadata=result.get("metadata", {})
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating slide: {str(e)}")


# ============================================================================
# Health Check Endpoint
# ============================================================================
@app.get("/health")
async def health_check():
    """Check if the API and database are operational."""
    db_status = "connected" if db is not None else "disconnected"
    return {
        "status": "healthy" if db is not None else "degraded",
        "database": db_status,
        "active_sessions": len(active_sessions),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/chapters/{chapter_id}/complete")
async def complete_chapter(
    chapter_id: str,
    course_id: str,
    user_id: str,
    session_id: str
):
    """
    Mark a chapter as complete and pre-generate slides for the next chapter.
    - If this is chapter_1 (baseline): Extract learning identity first
    - Then: Pre-generate ALL slides for the next chapter based on user's profile
    
    - chapter_id: The chapter being completed (e.g., "chapter_1")
    - course_id: The course this chapter belongs to
    - user_id: The user completing the chapter
    - session_id: Current session identifier
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Mark chapter as completed
        completion_doc = {
            "user_id": user_id,
            "course_id": course_id,
            "chapter_id": chapter_id,
            "session_id": session_id,
            "completed_at": datetime.now()
        }
        db.chapter_completions.insert_one(completion_doc)
        
        # Check if this is the first chapter (baseline)
        is_baseline = chapter_id == "chapter_1" or "chapter_1" in chapter_id
        
        profile_generated = False
        slides_generated = 0
        next_chapter_id = None
        
        # Extract or update learning identity
        user = db.users.find_one({"user_id": user_id})
        
        if is_baseline or not user or "learning_identity" not in user:
            # Extract learning identity from performance
            print(f"Extracting learning identity for user {user_id}...")
            identity = await extract_learning_identity(user_id, lookback_days=1)
            profile_generated = True
        else:
            # Use existing identity
            identity_data = user["learning_identity"]
            class Identity:
                def __init__(self, data):
                    self.visual_text_score = data.get("visual_text_score", 0.5)
                    self.pace = data.get("pace", "moderate")
            identity = Identity(identity_data)
        
        # Find next chapter
        current_chapter_order = int(chapter_id.split("_")[-1]) if "_" in chapter_id else 1
        next_chapter_order = current_chapter_order + 1
        next_chapter_id = f"chapter_{next_chapter_order}"
        
        # Get all slide topics for next chapter
        next_chapter_slides = list(
            db.slide_topics.find({
                "course_id": course_id,
                "chapter_id": next_chapter_id
            }).sort("order", 1)
        )
        
        if next_chapter_slides:
            # SAFETY CHECK: Never pre-generate slides for chapter_1 (baseline chapter)
            if next_chapter_id == "chapter_1" or "chapter_1" in next_chapter_id:
                print(f"⚠️ Skipping pre-generation for {next_chapter_id} - baseline chapter uses hardcoded HTML")
            else:
                print(f"Pre-generating {len(next_chapter_slides)} slides for {next_chapter_id}...")
                generator = get_slide_generator()
                
                failed_slides = []
                
                for slide_topic in next_chapter_slides:
                    max_retries = 2
                    retry_count = 0
                    success = False
                    
                    while retry_count <= max_retries and not success:
                        try:
                            # Generate slide content based on user's profile
                            print(f"  Generating: {slide_topic['title']}... (attempt {retry_count + 1}/{max_retries + 1})")
                            result = generator.generate_slide_content(
                                topic=slide_topic["title"],
                                learning_objectives=slide_topic["learning_objectives"],
                                visual_text_score=identity.visual_text_score,
                                context=slide_topic["context"]
                            )
                            
                            # Validate generated content
                            if not result.get("content") or len(result.get("content", "")) < 50:
                                raise ValueError("Generated content is too short or empty")
                            
                            # Store generated slide in database
                            generated_slide = {
                                "user_id": user_id,
                                "course_id": course_id,
                                "chapter_id": next_chapter_id,
                                "slide_id": slide_topic["slide_id"],
                                "title": slide_topic["title"],
                                "content": result["content"],
                                "content_type": result["content_type"],
                                "visual_text_score": result["visual_text_score"],
                                "video_url": result.get("video_url"),
                                "thumbnail_url": result.get("thumbnail_url"),
                                "metadata": result.get("metadata", {}),
                                "generated_at": datetime.now(),
                                "generation_attempts": retry_count + 1
                            }
                            db.generated_slides.insert_one(generated_slide)
                            slides_generated += 1
                            success = True
                            print(f"  ✓ Generated: {slide_topic['title']}")
                            
                        except Exception as e:
                            retry_count += 1
                            error_msg = str(e)
                            print(f"  ✗ Attempt {retry_count} failed for '{slide_topic['title']}': {error_msg}")
                            
                            if retry_count > max_retries:
                                # Store failed slide for later retry
                                failed_slides.append({
                                    "slide_id": slide_topic["slide_id"],
                                    "title": slide_topic["title"],
                                    "error": error_msg
                                })
                                
                                # Store failure in database for tracking
                                db.generation_failures.insert_one({
                                    "user_id": user_id,
                                    "course_id": course_id,
                                    "chapter_id": next_chapter_id,
                                    "slide_id": slide_topic["slide_id"],
                                    "slide_title": slide_topic["title"],
                                    "error": error_msg,
                                    "failed_at": datetime.now(),
                                    "retry_count": retry_count
                                })
                            else:
                                # Wait before retry (exponential backoff)
                                import time
                                time.sleep(2 ** retry_count)
                
                print(f"✓ Pre-generated {slides_generated}/{len(next_chapter_slides)} slides for {next_chapter_id}")
                
                if failed_slides:
                    print(f"⚠️ {len(failed_slides)} slides failed to generate and will be retried on-demand:")
                    for failed in failed_slides:
                        print(f"  - {failed['title']}: {failed['error']}")
        else:
            print(f"No more chapters found after {chapter_id}")
        
        return {
            "message": "Chapter completed successfully",
            "chapter_id": chapter_id,
            "next_chapter_id": next_chapter_id if next_chapter_slides else None,
            "is_baseline": is_baseline,
            "profile_generated": profile_generated,
            "slides_generated": slides_generated,
            "slides_total": len(next_chapter_slides),
            "slides_failed": len(failed_slides) if 'failed_slides' in locals() else 0,
            "failed_slides": failed_slides if 'failed_slides' in locals() else [],
            "timestamp": datetime.now()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing chapter: {str(e)}")


# ============================================================================
# SLIDE TOPICS AND COURSE STRUCTURE
# ============================================================================

@app.get("/api/courses/{course_id}/structure")
async def get_course_structure(course_id: str):
    """
    Get the complete course structure with chapters and slide topics.    
    - course_id: The course identifier
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Fetch all slide topics for this course
        slide_topics = list(
            db.slide_topics.find({"course_id": course_id})
            .sort([("chapter_order", 1), ("order", 1)])
        )
        
        if not slide_topics:
            raise HTTPException(status_code=404, detail=f"No slides found for course {course_id}")
        
        # Group slides by chapter
        chapters = {}
        for slide in slide_topics:
            chapter_id = slide["chapter_id"]
            
            if chapter_id not in chapters:
                chapters[chapter_id] = {
                    "id": chapter_id,
                    "title": slide["chapter_title"],
                    "order": slide["chapter_order"],
                    "slides": []
                }
            
            chapters[chapter_id]["slides"].append({
                "slide_id": slide["slide_id"],
                "title": slide["title"],
                "learning_objectives": slide["learning_objectives"],
                "context": slide["context"],
                "order": slide["order"]
            })
        
        # Convert to list and sort by order
        chapters_list = sorted(chapters.values(), key=lambda x: x["order"])
        
        return {
            "course_id": course_id,
            "total_chapters": len(chapters_list),
            "total_slides": len(slide_topics),
            "chapters": chapters_list
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching course structure: {str(e)}")


@app.post("/api/slides/generate-for-user", response_model=SlideGenerationResponse)
async def generate_slide_for_user(request: SlideGenerationRequest):
    """
    Generate personalized slide content on-demand for a specific user.
    This is called by the frontend when a student navigates to a slide.
    
    IMPORTANT: This should NEVER be called for chapter_1 slides, as chapter_1 
    is the baseline chapter that uses hardcoded HTML content to establish 
    baseline learning behavior.
    
    The content is dynamically generated based on:
    - The slide topic/title
    - The user's learning identity (visual vs text preference)
    - Learning objectives and context
    
    - request: Contains topic, learning_objectives, user_id, context
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # SAFETY CHECK: Prevent generation for chapter_1 (baseline chapter)
        if request.context and ("chapter_1" in request.context.lower() or "chapter 1" in request.context.lower()):
            raise HTTPException(
                status_code=400, 
                detail="Chapter 1 is the baseline chapter and should use hardcoded HTML content, not LLM generation."
            )
        
        # Get user's learning identity
        user = db.users.find_one({"user_id": request.user_id})
        
        if not user or "learning_identity" not in user:
            # Use default identity for first-time users
            visual_text_score = 0.5
            print(f"Warning: No learning identity found for user {request.user_id}, using default 0.5")
        else:
            identity = user["learning_identity"]
            visual_text_score = identity.get("visual_text_score", 0.5)
        
        # Get slide generator
        generator = get_slide_generator()
        
        # Generate personalized content
        result = generator.generate_slide_content(
            topic=request.topic,
            learning_objectives=request.learning_objectives,
            visual_text_score=visual_text_score,
            context=request.context,
            previous_content=request.previous_content,
            force_format=request.force_format
        )
        
        # Log the generation for analytics
        db.slide_generations.insert_one({
            "user_id": request.user_id,
            "topic": request.topic,
            "visual_text_score": visual_text_score,
            "generated_at": datetime.now(),
            "content_type": result.get("content_type"),
            "metadata": result.get("metadata", {})
        })
        
        return SlideGenerationResponse(
            content=result["content"],
            content_type=result.get("content_type", "html"),
            visual_text_score=result["visual_text_score"],
            topic=result["topic"],
            video_url=result.get("video_url"),
            thumbnail_url=result.get("thumbnail_url"),
            metadata=result.get("metadata", {})
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating slide: {str(e)}")


@app.get("/api/slides/pre-generated")
async def get_pre_generated_slides(
    user_id: str = Query(..., description="User ID"),
    course_id: str = Query(..., description="Course ID"),
    chapter_id: str = Query(..., description="Chapter ID")
):
    """
    Fetch pre-generated slides for a specific user, course, and chapter.
    Returns slides that were generated after completing the previous chapter.
    
    - user_id: The user requesting slides
    - course_id: The course ID
    - chapter_id: The chapter ID
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Find pre-generated slides
        slides = list(
            db.generated_slides.find({
                "user_id": user_id,
                "course_id": course_id,
                "chapter_id": chapter_id
            }).sort("generated_at", 1)
        )
        
        # Remove MongoDB _id for serialization
        for slide in slides:
            slide["_id"] = str(slide["_id"])
        
        return {
            "slides": slides,
            "count": len(slides)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pre-generated slides: {str(e)}")


@app.post("/api/slides/retry-failed")
async def retry_failed_generations(
    user_id: str,
    course_id: str,
    chapter_id: str
):
    """
    Retry generation for slides that failed during pre-generation.
    This can be called manually or scheduled as a background job.
    
    - user_id: The user ID
    - course_id: The course ID
    - chapter_id: The chapter ID to retry
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Find failed generations
        failed = list(
            db.generation_failures.find({
                "user_id": user_id,
                "course_id": course_id,
                "chapter_id": chapter_id
            })
        )
        
        if not failed:
            return {
                "message": "No failed generations to retry",
                "retried": 0
            }
        
        # Get user's learning identity
        user = db.users.find_one({"user_id": user_id})
        if not user or "learning_identity" not in user:
            raise HTTPException(status_code=404, detail="Learning identity not found")
        
        identity = user["learning_identity"]
        visual_text_score = identity.get("visual_text_score", 0.5)
        
        generator = get_slide_generator()
        retried_count = 0
        success_count = 0
        
        for failure in failed:
            try:
                # Get slide topic
                slide_topic = db.slide_topics.find_one({
                    "course_id": course_id,
                    "chapter_id": chapter_id,
                    "slide_id": failure["slide_id"]
                })
                
                if not slide_topic:
                    print(f"Slide topic not found: {failure['slide_id']}")
                    continue
                
                print(f"Retrying: {failure['slide_title']}...")
                
                # Retry generation
                result = generator.generate_slide_content(
                    topic=slide_topic["title"],
                    learning_objectives=slide_topic["learning_objectives"],
                    visual_text_score=visual_text_score,
                    context=slide_topic["context"]
                )
                
                # Store successful generation
                generated_slide = {
                    "user_id": user_id,
                    "course_id": course_id,
                    "chapter_id": chapter_id,
                    "slide_id": failure["slide_id"],
                    "title": failure["slide_title"],
                    "content": result["content"],
                    "content_type": result["content_type"],
                    "visual_text_score": result["visual_text_score"],
                    "video_url": result.get("video_url"),
                    "thumbnail_url": result.get("thumbnail_url"),
                    "metadata": result.get("metadata", {}),
                    "generated_at": datetime.now(),
                    "retry_generation": True
                }
                db.generated_slides.insert_one(generated_slide)
                
                # Remove from failures
                db.generation_failures.delete_one({"_id": failure["_id"]})
                
                success_count += 1
                retried_count += 1
                print(f"✓ Retry successful: {failure['slide_title']}")
                
            except Exception as e:
                print(f"✗ Retry failed: {failure['slide_title']}: {str(e)}")
                retried_count += 1
                # Update failure count
                db.generation_failures.update_one(
                    {"_id": failure["_id"]},
                    {"$inc": {"retry_count": 1}, "$set": {"last_retry": datetime.now()}}
                )
        
        return {
            "message": f"Retry complete: {success_count}/{retried_count} successful",
            "retried": retried_count,
            "successful": success_count,
            "still_failed": retried_count - success_count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrying failed generations: {str(e)}")


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "Mercury API",
        "version": "1.0.0",
        "docs": "/docs"
    }



# ============================================================================
# WEBCAM TRACKER CONTROL
# ============================================================================

@app.post("/api/tracker/start")
async def start_tracker():
    """Start the webcam attention tracker in a background thread."""
    global tracker_instance, tracker_thread
    
    if tracker_instance and tracker_instance.is_running:
        return {"message": "Tracker already running", "status": "running"}

    try:
        tracker_instance = ScreenTimeTracker()
        tracker_instance.start_tracking()
        
        def run_tracker():
            # Run the tracker loop
            # We could pass a callback here to log database events if needed
            tracker_instance.run()
            
        tracker_thread = threading.Thread(target=run_tracker, daemon=True)
        tracker_thread.start()
        
        return {"message": "Tracker started successfully", "status": "started"}
    except Exception as e:
        print(f"Failed to start tracker: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start tracker: {str(e)}")

@app.post("/api/tracker/stop")
async def stop_tracker():
    """Stop the webcam attention tracker."""
    global tracker_instance
    
    if tracker_instance and tracker_instance.is_running:
        tracker_instance.stop_tracking()
        return {"message": "Tracker stopped", "status": "stopped"}
    
    return {"message": "Tracker was not running", "status": "not_running"}


@app.get("/api/webcam/stream")
async def webcam_stream():
    """
    Stream the webcam feed with tracking overlay.
    """
    global tracker_instance
    if tracker_instance is None:
        tracker_instance = ScreenTimeTracker()
    
    return StreamingResponse(
        tracker_instance.get_stream_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
