# Screen Time Tracker

A Python application that uses computer vision to track how long someone is looking at the screen through webcam face detection.

## Features

- **Real-time Face Detection**: Uses OpenCV's Haar Cascade classifier to detect faces
- **Attention Span Tracking**: Calculates your focus percentage (Focus Time / Total Session Time)
- **Live Statistics**: Displays real-time stats including:
  - Current status (looking/not looking)
  - Attention Span % (0-100%)
  - Total Focus Time (time spent looking at screen)
  - Total Session Time (wall clock duration)
- **Visual Feedback**: Shows detected faces with bounding boxes
- **Summary Report**: Displays detailed summary when you quit

## System Requirements

### Hardware
- **Webcam**: Standard internal or external camera (Required for sensor)
- **Processor**: Minimum 1.6 GHz dual-core (Recommended for smooth CV)
- **RAM**: Minimum 2 GB

### Software Prerequisites
- **OS**: Windows 10/11, macOS, or Linux
- **Python**: Version 3.10+ (Recommended for best compatibility)

### Required Libraries
All dependencies are handled via `pip`:
- **opencv-python** (>= 4.8.0): Real-time face detection
- **numpy** (>= 1.24.0): Signal processing and math operations
- **tkinter**: GUI rendering (Included with Python)

## Installation

This project uses Python 3.10 in a virtual environment for better package compatibility.

### Option 1: Quick Start (Windows)
Simply double-click `run_tracker.bat` to start the tracker!

### Option 2: Manual Setup
1. The virtual environment is already created with Python 3.10
2. Packages are already installed (opencv-python and numpy)
3. Run the tracker:
```bash
venv\Scripts\python.exe screen_tracker.py
```

### Option 3: Fresh Setup (if needed)
If you need to recreate the environment:
```bash
# Create virtual environment with Python 3.10
py -3.10 -m venv venv

# Install dependencies
venv\Scripts\python.exe -m pip install opencv-python numpy
```

## Usage

**Easy way:** Double-click `run_tracker.bat`

**Command line:**
```bash
venv\Scripts\python.exe screen_tracker.py
```

### Controls

- **q**: Quit the application and view summary
- **r**: Reset all tracking data

## How It Works

1. **Face Detection**: The application uses OpenCV's Haar Cascade classifier to detect faces in real-time from your webcam
2. **Focus Tracking**: When a face is detected, it accumulates "Focus Time"
3. **Session Tracking**: The "Session Time" tracks the total wall-clock time since the app started (or was reset)
4. **Attention Span**: Calculated as `Focus Time / Session Time` and displayed as a percentage
5. **Visual Display**: A live video feed shows your webcam with:
   - Green rectangles around detected faces
   - Status overlay with statistics
   - Color-coded Attention Span (Green > 80%, Yellow > 50%, Red < 50%)

## Adaptive Learning PoC

We have added a Proof-of-Concept for an **Auto-Adapting Lesson Engine**.

1. **Run**: `run_adaptive.bat`
2. **Experience**:
   - The app launches a "Text Heavy" math lesson.
   - The Sensor (Webcam) tracks your attention.
   - **Simulation**: Look away from the screen for ~10 seconds.
   - **Adaptation**: As your attention score drops below 40%, the system ALERTS and *automatically* switches the lesson format to a **Visual Diagram**.

## Configuration

You can modify these parameters in the `ScreenTimeTracker` class:

- `detection_threshold`: Time (seconds) before considering "not looking" (default: 1.0)
- `min_face_size`: Minimum face size to detect in pixels (default: 30x30)

## Privacy Note

This application processes video locally on your machine. No data is sent anywhere or stored permanently. All tracking data is lost when you close the application.

## Troubleshooting

**Webcam not detected:**
- Make sure your webcam is connected and not being used by another application
- Try changing the camera index in `cv2.VideoCapture(0)` to `1` or `2`

**Face not detected:**
- Ensure you have adequate lighting
- Face the camera directly
- Adjust the `min_face_size` parameter if needed

**Performance issues:**
- Close other applications using the webcam
- Reduce the webcam resolution if needed

