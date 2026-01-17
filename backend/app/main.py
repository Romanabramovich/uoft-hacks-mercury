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


# Health Check Endpoint
@app.get("/health")
async def health_check():
    """Check if the API and database are operational."""
    db_status = "connected" if db else "disconnected"
    return {
        "status": "healthy" if db else "degraded",
        "database": db_status,
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
