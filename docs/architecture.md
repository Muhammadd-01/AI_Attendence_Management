# AI Attendance Manager Architecture

## Overview
The AI Attendance Manager is a multi-tier application designed to automatically identify registered students using a classroom camera and record attendance. The system comprises a React/Vite frontend and a Python/Flask backend, communicating via REST APIs.

## System Components

### 1. Frontend (React)
- **Framework:** React 18 with Vite for fast bundling.
- **UI Styling:** Tailwind CSS v4 for utility-first styling.
- **State Management:** React Context API for global state (`sessionActive`, `settings`).
- **Data Fetching:** Axios with interceptors, paired with custom hooks like `usePolling` for real-time updates.
- **Routing:** React Router v7.
- **Data Visualization:** Recharts for analytics and trends.

### 2. Backend (Flask)
- **Framework:** Flask 3, providing REST endpoints and serving the MJPEG video stream.
- **Database:** Firebase Firestore, a NoSQL document database used for real-time sync capabilities, storing students, attendance, and settings.
- **Core AI Pipeline:**
  - **Detector:** OpenCV DNN face detector using a ResNet-10 model (`res10_300x300_ssd_iter_140000.caffemodel`).
  - **Preprocessor:** Image normalization, resizing, and blur detection via Laplacian variance.
  - **Encoder:** `face_recognition` library leveraging dlib's 128-dimensional ResNet model for robust facial embeddings.
  - **Recognizer:** Matches faces against registered student embeddings using Euclidean distance.

## Data Flow: Real-Time Attendance

1. The frontend initiates a session by calling `/api/recognition/start`.
2. The backend opens the camera and spawns a background thread.
3. For each frame (processed every Nth frame):
   - OpenCV detects faces.
   - The preprocessor validates quality.
   - `face_recognition` computes 128-d embeddings.
   - Embeddings are compared against known student encodings.
   - If matched (and not in cooldown), an attendance record is created in Firestore.
4. The frontend pulls MJPEG stream from `/video_feed` and polls `/api/recognition/latest` for real-time overlay data.

## Deployment Topology
This application is designed to run locally or on a LAN. The backend and the camera must reside on the same physical machine or be securely tunneled, as the backend directly accesses the webcam (`cv2.VideoCapture`). The frontend can be served and accessed from any network-connected device.
