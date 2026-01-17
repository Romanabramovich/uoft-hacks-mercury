from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from database import get_database

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
    time_on_current_slide: int = 0  # seconds
    is_focused: bool = True
    focus_percentage: float = 1.0  # 0.0 to 1.0
    confusion_signals: List[str] = []
    last_updated: datetime

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
    if not db:
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
    if not db:
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
    if not db:
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
    if not db:
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


# INTERVENTION SYSTEM: Session State Monitoring
active_sessions = {}

@app.post("/api/session/start")
async def start_session(user_id: str, session_id: str):
    """
    Initialize a new learning session for real-time monitoring.
    
    - user_id: The unique identifier for the user
    - session_id: Unique session identifier (generated by frontend)
    """
    if not db:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "started_at": datetime.now(),
            "current_slide_id": None,
            "time_on_current_slide": 0,
            "is_focused": True,
            "focus_percentage": 1.0,
            "confusion_signals": [],
            "last_updated": datetime.now()
        }
        
        # Store in cache for real-time access
        active_sessions[session_id] = session_data
        
        # Also persist to database
        db.sessions.insert_one(session_data)
        
        return {
            "session_id": session_id,
            "message": "Session started",
            "timestamp": session_data["started_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting session: {str(e)}")

"""
REPLACE WITH A COUNTER?
"""


@app.post("/api/session/{session_id}/focus")
async def update_focus_state(session_id: str, focus_update: FocusUpdate):
    """
    Update focus state based on computer vision detection.
    Frontend sends this whenever CV detects focus changes.
    
    - session_id: Current session identifier
    - focus_update: Focus data from computer vision
    """
    if not db:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        # Update in-memory cache
        if session_id in active_sessions:
            session = active_sessions[session_id]
            session["is_focused"] = focus_update.is_focused
            session["focus_percentage"] = focus_update.focus_score or (1.0 if focus_update.is_focused else 0.0)
            session["last_updated"] = focus_update.timestamp or datetime.now()
        
        # Log focus event
        focus_event = {
            "user_id": focus_update.user_id,
            "session_id": session_id,
            "event_type": "focus_change",
            "event_data": {
                "is_focused": focus_update.is_focused,
                "focus_score": focus_update.focus_score
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
    if not db:
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
    user_id: str,
    new_slide_id: str,
    previous_slide_id: Optional[str] = None,
    time_on_previous: Optional[int] = None
):
    """
    Track when student moves to a new slide.
    Detects if they were stuck on previous slide.
    
    - session_id: Current session identifier
    - user_id: The user viewing slides
    - new_slide_id: Slide they're moving to
    - previous_slide_id: Slide they're leaving
    - time_on_previous: How long they spent on previous slide (seconds)
    """
    if not db:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        confusion_signals = []
        
        # Detect "stuck on slide" signal
        STUCK_THRESHOLD = 300  # 5 minutes
        if time_on_previous and time_on_previous > STUCK_THRESHOLD:
            signal = {
                "signal_type": "stuck_on_slide",
                "severity": "medium" if time_on_previous < 600 else "high",
                "metadata": {
                    "slide_id": previous_slide_id,
                    "time_spent": time_on_previous
                },
                "detected_at": datetime.now()
            }
            confusion_signals.append(signal)
            
            # Log confusion signal
            db.confusion_signals.insert_one({
                "user_id": user_id,
                "session_id": session_id,
                **signal
            })
        
        # Update session state
        if session_id in active_sessions:
            session = active_sessions[session_id]
            session["current_slide_id"] = new_slide_id
            session["time_on_current_slide"] = 0
            session["confusion_signals"].extend(confusion_signals)
            session["last_updated"] = datetime.now()
        
        # Log slide change event
        db.events.insert_one({
            "user_id": user_id,
            "session_id": session_id,
            "event_type": "slide_change",
            "event_data": {
                "from_slide": previous_slide_id,
                "to_slide": new_slide_id,
                "time_on_previous": time_on_previous
            },
            "timestamp": datetime.now()
        })
        
        return {
            "message": "Slide change tracked",
            "confusion_signals_detected": len(confusion_signals),
            "signals": confusion_signals
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking slide change: {str(e)}")


@app.post("/api/session/{session_id}/quiz-result")
async def track_quiz_result(
    session_id: str,
    user_id: str,
    slide_id: str,
    quiz_id: str,
    score: float,  # 0.0 to 1.0
    passed: bool
):
    """
    Track quiz completion and detect confusion if failed.
    
    - session_id: Current session identifier
    - user_id: The user taking quiz
    - slide_id: Slide the quiz is on
    - quiz_id: Quiz identifier
    - score: Quiz score (0.0 to 1.0)
    - passed: Whether they passed
    """
    if not db:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    try:
        confusion_signals = []
        
        # Detect quiz failure signal
        if not passed or score < 0.6:
            severity = "low" if score >= 0.4 else "medium" if score >= 0.2 else "high"
            signal = {
                "signal_type": "quiz_failed",
                "severity": severity,
                "metadata": {
                    "slide_id": slide_id,
                    "quiz_id": quiz_id,
                    "score": score
                },
                "detected_at": datetime.now()
            }
            confusion_signals.append(signal)
            
            # Log confusion signal
            db.confusion_signals.insert_one({
                "user_id": user_id,
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
            "user_id": user_id,
            "session_id": session_id,
            "event_type": "quiz_completed",
            "event_data": {
                "slide_id": slide_id,
                "quiz_id": quiz_id,
                "score": score,
                "passed": passed
            },
            "timestamp": datetime.now()
        })
        
        return {
            "message": "Quiz result tracked",
            "passed": passed,
            "confusion_signals_detected": len(confusion_signals),
            "signals": confusion_signals
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
    if not db:
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
async def end_session(session_id: str, user_id: str):
    """
    End a learning session and clean up.
    
    - session_id: Session to end
    - user_id: User ending session
    """
    if not db:
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


# ============================================================================
# Health Check Endpoint
# ============================================================================
@app.get("/health")
async def health_check():
    """Check if the API and database are operational."""
    db_status = "connected" if db else "disconnected"
    return {
        "status": "healthy" if db else "degraded",
        "database": db_status,
        "active_sessions": len(active_sessions),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "Mercury API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
