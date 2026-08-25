# AI Attendance Manager

A Smart Attendance System Using Face Recognition. This full-stack application automatically identifies registered students using a classroom camera and records attendance without manual marking.

## Features
- **Real-time Face Recognition**: Powered by OpenCV and `face_recognition` (dlib).
- **React Dashboard**: Modern, responsive UI built with Tailwind CSS v4.
- **Firebase Database**: Real-time NoSQL data storage.
- **Analytics & Reports**: Insights into attendance trends and anomalies.
- **Anti-Proxy**: Real face verification prevents buddy punching.

## Prerequisites
- Python 3.9+
- Node.js 18+ (Node 22 recommended)
- `cmake` (required for dlib installation)
  - macOS: `brew install cmake`
  - Linux: `sudo apt install cmake`
  - Windows: Install CMake and Visual Studio C++ build tools.
- A Firebase project with Firestore enabled.
- A connected webcam.

## Installation

### 1. Database Initialization (Firebase)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project and enable **Firestore Database**.
3. Go to Project Settings > Service Accounts > Generate new private key.
4. Save the downloaded JSON file as `serviceAccountKey.json` in the root of this project.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### 1. Seed Demo Data (Optional)
To test the UI without registering students manually:
```bash
cd backend
source venv/bin/activate
python -m app.database.seed
```

### 2. Start the Backend
```bash
cd backend
source venv/bin/activate
python app.py
```
*The backend will run on http://localhost:5000*

### 3. Start the Frontend
In a new terminal window:
```bash
cd frontend
npm run dev
```
*The frontend will run on http://localhost:3000*

## System Workflow

1. **Registration**: Navigate to `Students` > `Add Student`. Fill details and click `Capture Faces` to take photos from the webcam.
2. **Training**: Once 20+ images are captured, the system will extract embeddings and update the recognition model.
3. **Live Attendance**: Navigate to `Live Attendance` and click `Start Session`. As students walk in front of the camera, they are identified and marked Present.
4. **Finalization**: Click `Finalize Session` to mark all unseen students as Absent.

## Troubleshooting
- **`dlib` fails to install**: Ensure you have CMake and a C++ compiler installed. On macOS, run `xcode-select --install`.
- **Camera not opening**: Ensure no other application (like Zoom or Teams) is using the webcam. Verify `CAMERA_INDEX=0` in `.env`.
- **Firebase Permission Error**: Verify that `serviceAccountKey.json` is placed in the root directory and contains valid credentials.
