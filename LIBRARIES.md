# Project Dependencies & Libraries

## 📦 External Libraries (Install via Pip)
These libraries must be installed for the project to run.

**Installation Command:**
```bash
pip install opencv-python>=4.8.0 numpy>=1.24.0
```

| Library | Version Used | Purpose |
| :--- | :--- | :--- |
| **opencv-python** | `>=4.8.0` | Real-time computer vision, accessing the webcam, and face detection logic (Haar Cascades). |
| **numpy** | `>=1.24.0` | High-performance numerical operations, frame buffer manipulation, and signal processing. |

## 🐍 Python Standard Libraries (Built-in)

| Module | Purpose |
| :--- | :--- |
| **tkinter** | Creates the Graphical User Interface (GUI) for the Lesson Viewer and Diagnostics Panel. |
| **threading** | Allows the Face Sensor to run in the background without freezing the User Interface. |
| **time** | Handles timestamping, session duration tracking, and performance measurement. |
| **datetime** | Formats human-readable timestamps for logs and reports. |
| **os** | Handles file system paths and environment interaction. |
| **random** | (Optional) Used for simulating content variations or selecting random quizzes. |

## 📂 Project Modules (Local)
| File | Purpose |
| :--- | :--- |
| **screen_tracker.py** | The core sensor class. Contains `screen_tracker.ScreenTimeTracker`. |
| **adaptive_system.py** | The main application controller. Contains the UI and Adaptive Logic. |
