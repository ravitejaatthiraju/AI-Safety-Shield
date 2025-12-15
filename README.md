# 🛡 AI Safety Shield – Intelligent Surveillance System
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb)
![AI](https://img.shields.io/badge/AI-Computer%20Vision%20%26%20Audio-success)
![YOLO](https://img.shields.io/badge/Model-YOLOv8-orange)
![Status](https://img.shields.io/badge/Status-Prototype-yellow)

AI Safety Shield is a **real-time, multimodal surveillance system** designed to detect threats in public or private spaces. It combines **computer vision** and **audio intelligence** to identify weapons, distress screams, aggressive postures, and overcrowding, and instantly alerts administrators via a **live dashboard** and **email notifications**.

---

## 🚀 Key Features

- ⚔ **Weapon Detection** – Real-time detection of dangerous objects (Knives, Bats, Scissors) using **YOLOv8**
- 🎤 **Audio Analysis** – Detects distress keywords like *“Help”* and *“Scream”*
- 🙌 **Pose Estimation** – Identifies *Hands-Up (Surrender)* and *Fall* postures using **MediaPipe**
- 📏 **Proximity Detection** – Monitors crowd density to detect aggressive overcrowding
- 📧 **Instant Alerts** – Automatic email alerts when threat levels cross thresholds
- 💻 **Live Dashboard** – React + Vite UI showing live video feed and threat telemetry

---

## 🛠 Tech Stack

### Backend (Python)
- Flask – REST API & video streaming
- OpenCV – Video capture & processing
- Ultralytics YOLOv8 – Weapon detection
- MediaPipe – Pose estimation
- SpeechRecognition – Audio analysis
- Threading – Parallel video & audio processing

### Frontend (React)
- React.js (Vite) – Fast modern UI
- Tailwind CSS – Styling & responsiveness
- Lucide React – Icons
- Fetch API – Backend communication

---

## ⚙ Prerequisites

- Python **3.8+**
- Node.js & npm
- Webcam (Built-in or USB)

---

## 📥 Installation Guide

### 1️⃣ Backend Setup (Python)

Navigate to the project root (where `backend.py` exists):

```bash
python -m venv venv
```

Activate virtual environment:

**Windows**
```bash
venv\Scripts\activate
```

**Mac/Linux**
```bash
source venv/bin/activate
```

Install dependencies:
```bash
pip install flask flask-cors opencv-python numpy ultralytics mediapipe SpeechRecognition pyaudio
```

> ⚠ If `pyaudio` fails, install system audio dependencies or use a precompiled `.whl` on Windows.

---

### 2️⃣ Frontend Setup (React)

```bash
cd ai-safety-shield
npm install
```

---

## 🔧 Configuration

### Email Alert Setup

Open `email_alert_module.py` and update:

```python
SENDER_EMAIL = "your_email@gmail.com"
SENDER_PASSWORD = "your_app_password"
```

> Use a **Google App Password**, not your real password.

---

## ▶ Execution Commands

Run backend and frontend in **two terminals**.

### Terminal 1 – Backend
```bash
python backend.py
```

Expected output:
```
⚙ Initializing Weapon Detection Model...
✅ Camera found at Index 0
🚀 BACKEND RUNNING ON: http://localhost:5000
```

---

### Terminal 2 – Frontend
```bash
cd ai-safety-shield
npm run dev
```

Open:
```
http://localhost:5173
```

---

## 📂 Project Structure

```
AI-Safety-Shield/
├── backend.py
├── weapon_detector.py
├── audio_thread.py
├── pose_module.py
├── proximity_logic.py
├── email_alert_module.py
├── yolov8n.pt
│
└── ai-safety-shield/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

---

## ❓ Troubleshooting

### 1. WinError 6 – Handle is invalid
**Fix:** Use lazy-loaded YOLO model inside `weapon_detector.py`.

### 2. Address already in use
**Fix:** Backend auto-switches to port **5001**. Update frontend API URL.

### 3. Camera not opening
**Fix:** Close Zoom/Teams/Meet apps and restart terminal.

### 4. Audio not working
**Fix:** Audio is optional. Backend continues running with video-only mode.

---
## 🔮 Future Scope
- Mobile alerts (SMS/WhatsApp)
- Cloud deployment
- Face recognition


## 📌 Summary

**AI Safety Shield** delivers proactive, intelligent surveillance by fusing vision, audio, and behavior analysis into a single real-time safety platform.
