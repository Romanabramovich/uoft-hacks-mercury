# 🎓 Mercury - Adaptive Learning Platform

An AI-powered educational platform that personalizes learning content in real-time based on student behavior, attention patterns, and learning style preferences.

## 📋 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [API Endpoints](#api-endpoints)

---

## 🌟 Overview

Mercury is an adaptive learning system that combines:
- **Computer Vision** - Tracks student attention via webcam
- **AI Content Generation** - Creates personalized slides using Google Gemini API
- **Behavioral Analysis** - Builds learning profiles from interaction patterns
- **Real-time Adaptation** - Adjusts content difficulty and format dynamically

The platform establishes a baseline learning profile using Chapter 1 (hardcoded content), then generates personalized content for subsequent chapters based on individual learning preferences.

---

## ✨ Key Features

### 🎯 Adaptive Content Generation
- **Dynamic Slide Creation**: AI-generated content tailored to each student's visual-text preference spectrum (0.0 = text-heavy, 1.0 = visual-heavy)
- **Pre-generation**: Next chapter content generated immediately after completing current chapter
- **Fallback System**: Ensures students always receive content even if AI generation fails

### 📊 Real-time Behavioral Tracking
- **Webcam Attention Monitoring**: OpenCV-based face detection tracks focus levels
- **Interaction Analytics**: Tracks time on slides, navigation patterns, quiz performance
- **Confusion Detection**: Identifies struggling students via stuck-on-slide detection and quiz failures

### 🧠 Learning Identity Profiling
Builds multi-dimensional profiles including:
- **Visual-Text Score** (0.0-1.0): Preference for visual diagrams vs text explanations
- **Learning Pace**: Fast, moderate, or slow
- **Attention Span**: 5-30 minute ranges
- **Processing Style**: Top-down (examples first) vs bottom-up (theory first)

### 🔄 Real-time Profile Adjustment
- Automatically adjusts learning profile when confusion signals detected
- Pushes students towards opposite content format when struggling
- Continuous refinement based on performance data

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MERCURY PLATFORM                                │
└─────────────────────────────────────────────────────────────────────────────┘

                                   ┌──────────────┐
                                   │   STUDENT    │
                                   │   (Browser)  │
                                   └──────┬───────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
              ┌──────▼──────┐      ┌─────▼──────┐     ┌──────▼──────┐
              │   WEBCAM    │      │  FRONTEND  │     │ BEHAVIORAL  │
              │   TRACKER   │      │  (Next.js) │     │   EVENTS    │
              └──────┬──────┘      └─────┬──────┘     └──────┬──────┘
                     │                    │                    │
                     │  Focus Scores      │  API Calls         │  Analytics
                     │  (0.0 - 1.0)       │                    │
                     └────────────────────┼────────────────────┘
                                          │
                                   ┌──────▼──────┐
                                   │   BACKEND   │
                                   │  (FastAPI)  │
                                   └──────┬──────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
             ┌──────▼──────┐       ┌─────▼──────┐      ┌──────▼──────┐
             │  CONFUSION  │       │  LEARNING  │      │   CONTENT   │
             │  DETECTION  │       │  IDENTITY  │      │  GENERATOR  │
             │             │       │  EXTRACTOR │      │             │
             └──────┬──────┘       └─────┬──────┘      └──────┬──────┘
                    │                     │                     │
                    │   Signals           │   Profile           │   Prompt
                    │                     │   (4 dimensions)    │
                    └─────────────────────┼─────────────────────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                  ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
                  │   MONGODB   │  │  GEMINI AI │  │   OPENCV   │
                  │  (Storage)  │  │    (LLM)   │  │  (CV Lib)  │
                  └─────────────┘  └────────────┘  └────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
    │  events   │  │  users  │  │ generated │
    │ sessions  │  │ slides  │  │  slides   │
    └───────────┘  └─────────┘  └───────────┘
```

---

## 🔄 Data Flow

### **Phase 1: Session Initialization**
1. Student accesses course → Frontend generates session ID
2. Backend creates session record in MongoDB
3. Webcam tracker starts (optional)

### **Phase 2: Real-time Tracking**
```
Webcam → Face Detection → Focus Score (0-1) → Backend → MongoDB
Student Interactions → Event Queue → Batch Upload → MongoDB
```

**Tracked Events:**
- Slide views (time spent, navigation)
- Quiz attempts (score, correctness)
- Focus changes (looking at screen)
- Confusion signals (stuck, failed quiz)

### **Phase 3: Learning Profile Creation**
After completing **Chapter 1** (baseline):
1. Backend analyzes all collected behavioral events
2. Calculates 4-dimensional learning profile:
   - **Visual-Text Score**: Engagement with visual vs text content
   - **Pace**: Average time per slide
   - **Attention Span**: Focus duration before loss
   - **Processing Style**: Navigation patterns
3. Stores profile in MongoDB `users` collection

### **Phase 4: Adaptive Content Generation**
When chapter completes:
1. Backend pre-generates all slides for next chapter
2. Sends learning profile to Gemini API
3. Gemini generates HTML content tailored to student's visual-text score:
   - **Low score (0.0-0.3)**: Text-heavy, bullet points, definitions
   - **High score (0.7-1.0)**: Visual-heavy, diagrams, infographics
4. Stores in MongoDB `generated_slides` collection

### **Phase 5: Real-time Adjustment**
During learning:
1. Backend monitors for confusion signals
2. If detected: Adjusts visual-text score
   - Currently visual (>0.5) → Push towards text
   - Currently text (<0.5) → Push towards visual
3. Future content generated with updated profile

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, Lucide Icons
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion

### **Backend**
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Atlas)
- **AI**: Google Gemini API (gemini-3-flash-preview)
- **Computer Vision**: OpenCV + MediaPipe
- **Video Generation**: Manim (planned, currently disabled)

### **Infrastructure**
- **Database**: MongoDB Atlas (Cloud)
- **Package Manager**: npm (frontend), pip (backend)
- **Development**: Hot reload (Next.js dev server, Uvicorn)

---

## 📦 Prerequisites

### **Required Software**
- **Node.js**: 20.x or higher
- **Python**: 3.10 or higher
- **MongoDB Atlas Account**: Free tier available
- **Gemini API Key**: Free from Google AI Studio
- **Webcam**: Optional (for attention tracking)

### **System Requirements**
- **OS**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB for dependencies

---

## 🚀 Installation & Setup

### **1. Clone Repository**
```bash
git clone <repository-url>
cd uoft-hacks-mercury
```

### **2. Backend Setup**

#### Install Python Dependencies
```bash
cd backend
pip install -r ../requirements.txt
```

**Required packages:**
```
pymongo
python-dotenv
fastapi
uvicorn[standard]
pydantic
certifi
google-generativeai
manim
opencv-python
numpy
mediapipe
```

#### Configure Environment Variables
Create `backend/.env`:
```env
# MongoDB Atlas Connection
DB_USER=your_mongodb_username
DB_PASSWORD=your_mongodb_password
DB_NAME=mercury

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Manim Output Directory (optional)
MANIM_OUTPUT_DIR=./generated_animations
```

**Getting API Keys:**
1. **MongoDB Atlas**: 
   - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create cluster → Get connection string
   - Extract username and password

2. **Gemini API**:
   - Visit [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Create API key (free tier available)

### **3. Frontend Setup**

#### Install Node Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment Variables
Create `frontend/.env.local`:
```env
# MongoDB Connection (same as backend)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=mercury

# Feature Flags
NEXT_PUBLIC_ENABLE_DYNAMIC_GENERATION=true
```

### **4. Database Setup**

#### Seed Initial Data
The backend includes a seeding script to populate course structure:

```bash
cd backend/app
python seed_slides.py
```

This creates:
- Course structure in `slide_topics` collection
- Chapter 1 baseline content
- Slide topics for Chapter 2+ (for generation)

---

## ▶️ Running the Application

### **Development Mode**

#### Terminal 1: Start Backend
```bash
cd backend/app
python main.py
# Or using uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

#### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

### **Production Mode**

#### Backend
```bash
cd backend/app
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Frontend
```bash
cd frontend
npm run build
npm start
```

---

## 🔧 Environment Variables

### **Backend (`backend/.env`)**
| Variable | Required | Description |
|----------|----------|-------------|
| `DB_USER` | ✅ | MongoDB username |
| `DB_PASSWORD` | ✅ | MongoDB password |
| `DB_NAME` | ✅ | Database name (default: `mercury`) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `MANIM_OUTPUT_DIR` | ❌ | Directory for animation videos (default: `./generated_animations`) |

### **Frontend (`frontend/.env.local`)**
| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | Full MongoDB connection string |
| `MONGODB_DB_NAME` | ✅ | Database name (must match backend) |
| `NEXT_PUBLIC_ENABLE_DYNAMIC_GENERATION` | ❌ | Enable AI generation (default: `true`) |

---

## 📁 Project Structure

```
uoft-hacks-mercury/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application & endpoints
│   │   ├── database.py                # MongoDB connection
│   │   ├── learning_identity.py       # Profile extraction logic
│   │   ├── gemini_generator.py        # AI content generation
│   │   ├── understanding_calculator.py # Confusion detection
│   │   ├── screen_tracker.py          # OpenCV webcam tracker
│   │   ├── seed_slides.py             # Database seeding script
│   │   └── generated_animations/      # Manim output (videos)
│   └── check_db.py                    # Database verification utility
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                   # Landing page
│   │   ├── dashboard/                 # Student dashboard
│   │   ├── learn/[courseId]/          # Slide viewer
│   │   ├── professor/                 # Instructor analytics
│   │   └── api/events/                # Event ingestion API route
│   ├── components/
│   │   ├── slide-viewer/              # Slide rendering components
│   │   ├── dashboard/                 # Dashboard widgets
│   │   ├── providers/                 # Context providers
│   │   └── ui/                        # Reusable UI components
│   ├── hooks/
│   │   └── analytics/                 # Tracking hooks
│   ├── lib/
│   │   ├── api/                       # API client
│   │   ├── events.ts                  # Event type definitions
│   │   └── mongodb.ts                 # MongoDB client
│   └── services/
│       └── api.ts                     # Backend API wrapper
│
├── CV_AttentionTracker/               # Standalone CV demo
├── requirements.txt                   # Python dependencies
├── README.md                          # This file
├── README_CV.md                       # CV tracker documentation
└── LIBRARIES.md                       # Dependency reference
```

---

## 🧪 How It Works

### **1. Baseline Learning (Chapter 1)**
- Student learns from **hardcoded HTML slides** (not AI-generated)
- System tracks all interactions: time on slides, quiz scores, focus levels
- Establishes baseline behavior without bias

### **2. Profile Extraction**
After Chapter 1 completion, the system analyzes:
- **Visual Engagement**: Time on diagrams, interactions with visuals
- **Text Engagement**: Time on text-heavy slides, scrolling patterns
- **Quiz Performance**: Success after visual vs text content
- **Focus Patterns**: Attention duration, distraction frequency

**Output**: 4-dimensional learning profile stored in MongoDB

### **3. Personalized Generation**
For Chapter 2+:
- Backend retrieves student's visual-text score (e.g., 0.72)
- Sends to Gemini API with tailored prompt:
  - **Score 0.0-0.3**: "Generate TEXT-HEAVY content with bullet points and definitions"
  - **Score 0.7-1.0**: "Generate VISUAL-HEAVY content with diagram descriptions"
- Gemini returns HTML with appropriate balance
- Content cached in MongoDB for instant loading

### **4. Adaptive Adjustments**
During learning:
- **Confusion detected** (stuck on slide >5 min OR quiz score <60%)
  - System adjusts visual-text score towards opposite format
  - Example: If student (visual learner, score 0.8) struggles → adjust to 0.65 (more text)
- Next generated content uses updated score
- Continuous refinement cycle

### **5. Real-time Tracking**
- **Webcam**: Face detection runs in background thread
  - Detected face → Focus score 1.0
  - No face → Focus score 0.0
  - Sent to backend every few seconds
- **Frontend**: Batches interaction events
  - Sends to `/api/events` every 10 seconds or 20 events
  - Minimizes network overhead

---

## 🌐 API Endpoints

### **Sessions**
- `POST /api/session/start` - Initialize learning session
- `POST /api/session/{session_id}/focus` - Update focus state
- `POST /api/session/{session_id}/slide-change` - Track navigation
- `POST /api/session/{session_id}/quiz-result` - Submit quiz answer
- `POST /api/session/{session_id}/end` - End session
- `GET /api/session/{session_id}/state` - Get session state

### **Learning Identity**
- `POST /api/users/{user_id}/extract-identity` - Extract profile from events
- `GET /api/users/{user_id}/learning-identity` - Get current profile
- `GET /api/users/{user_id}/confusion-signals` - Get detected confusion

### **Content Generation**
- `POST /api/slides/generate-for-user` - Generate personalized slide
- `GET /api/slides/pre-generated` - Fetch cached slides
- `POST /api/chapters/{chapter_id}/complete` - Mark complete & pre-generate

### **Course Structure**
- `GET /api/courses/{course_id}/structure` - Get all chapters and slides

### **Webcam Tracker**
- `POST /api/tracker/start` - Start background tracker
- `POST /api/tracker/stop` - Stop tracker
- `GET /api/webcam/stream` - Live video stream

### **Utilities**
- `GET /health` - Health check
- `POST /api/events` - Log behavioral events

**Full API Documentation**: Visit http://localhost:8000/docs when backend is running

---

## 🐛 Troubleshooting

### **MongoDB Connection Failed**
```
Error: MongoDB connection failed
```
**Solution**:
1. Verify credentials in `.env` files
2. Check MongoDB Atlas network access (allow your IP)
3. Ensure cluster is active (not paused)
4. Test connection: `cd backend && python check_db.py`

### **Gemini API Errors**
```
Error: Failed to generate HTML content
```
**Solution**:
1. Verify `GEMINI_API_KEY` in `backend/.env`
2. Check API quota at [makersuite.google.com](https://makersuite.google.com)
3. Free tier limits: 60 requests/minute
4. System uses fallback content if generation fails

### **Webcam Not Detected**
```
Error: Could not open webcam
```
**Solution**:
1. Ensure webcam is connected and not in use
2. Grant browser webcam permissions
3. Check camera privacy settings (Windows/macOS)
4. Webcam tracking is optional - system works without it

### **Frontend API Connection Failed**
```
Error: Failed to fetch
```
**Solution**:
1. Verify backend is running on http://localhost:8000
2. Check `frontend/services/api.ts` BASE_URL matches backend port
3. Disable CORS browser extensions
4. Check firewall settings

### **Slides Not Generating**
**Check**:
1. Did you complete Chapter 1 first? (Required for profile extraction)
2. Check backend logs for generation errors
3. Verify Gemini API key is valid
4. Try manual generation: `POST /api/slides/generate-for-user` via `/docs`

---

## 📊 Database Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles and learning identities |
| `sessions` | Active/past learning sessions |
| `events` | All behavioral tracking events |
| `slides` | Base slide content (Chapter 1) |
| `slide_topics` | Course structure and topics |
| `generated_slides` | AI-generated personalized content |
| `confusion_signals` | Detected struggle moments |
| `adaptations` | Applied profile adjustments |
| `chapter_completions` | Progress tracking |
| `generation_failures` | Failed generations for retry |

---

## 🤝 Contributing

This is a hackathon project for UofT Hacks. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is part of UofT Hacks Mercury submission.

---

## 🙏 Acknowledgments

- **Google Gemini API** - AI content generation
- **MongoDB Atlas** - Database hosting
- **OpenCV** - Computer vision library
- **Next.js & FastAPI** - Framework foundations
- **UofT Hacks** - Hackathon platform

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for adaptive learning**
