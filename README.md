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
- [How It Works](#how-it-works)

---

## 🌟 Overview

Mercury is an adaptive learning system that combines:
- **Computer Vision** - Tracks student attention via webcam
- **AI Content Generation** - Creates personalized slides using Google Gemini API
- **Behavioral Analysis** - Builds learning profiles from interaction patterns
- **Real-time Adaptation** - Adjusts content difficulty and format dynamically

The platform establishes a baseline learning profile using Chapter 1 (hardcoded content), then generates personalized content for subsequent chapters based on individual learning preferences.

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
                         ┌────────────────┼
                         │                │                
                  ┌──────▼──────┐  ┌─────▼──────┐  
                  │   MONGODB   │  │  GEMINI AI │  
                  │  (Storage)  │  │    (LLM)   │  
                  └─────────────┘  └────────────┘  
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

## 🤝 Contributing

This is a hackathon project for UofT Hacks. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is part of UofT Hacks Team Mercury submission.

---
## 🙏 Acknowledgments

- **Google Gemini API** - AI content generation
- **MongoDB Atlas** - Database hosting
- **OpenCV** - Computer vision library
- **Next.js & FastAPI** - Framework foundations
- **UofT Hacks** - Hackathon platform
---
