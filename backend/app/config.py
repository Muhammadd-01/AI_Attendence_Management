"""
Central configuration for the AI Attendance Manager.
Reads from environment variables with sensible defaults.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration loaded from environment variables."""

    # Flask
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'

    # Firebase
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'serviceAccountKey.json')

    # Face Recognition
    FACE_MATCH_THRESHOLD = float(os.getenv('FACE_MATCH_THRESHOLD', 0.55))
    RECOGNITION_COOLDOWN_SECONDS = int(os.getenv('RECOGNITION_COOLDOWN_SECONDS', 30))
    CAMERA_INDEX = int(os.getenv('CAMERA_INDEX', 0))
    FRAME_PROCESS_INTERVAL = int(os.getenv('FRAME_PROCESS_INTERVAL', 5))

    # Attendance
    LATE_THRESHOLD_MINUTES = int(os.getenv('LATE_THRESHOLD_MINUTES', 15))
    SESSION_DURATION_MINUTES = int(os.getenv('SESSION_DURATION_MINUTES', 60))

    # Application
    CLASSROOM_NAME = os.getenv('CLASSROOM_NAME', 'Classroom A')
    DATASET_PATH = os.getenv('DATASET_PATH', 'dataset')
    UPLOADS_PATH = os.getenv('UPLOADS_PATH', 'uploads')

    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATASET_FULL_PATH = os.path.join(BASE_DIR, DATASET_PATH)
    UPLOADS_FULL_PATH = os.path.join(BASE_DIR, UPLOADS_PATH)

    # Face detection model paths (OpenCV DNN)
    FACE_DETECTOR_PROTOTXT = os.path.join(BASE_DIR, 'models', 'deploy.prototxt')
    FACE_DETECTOR_MODEL = os.path.join(BASE_DIR, 'models', 'res10_300x300_ssd_iter_140000.caffemodel')
    FACE_DETECTOR_CONFIDENCE = 0.7

    # Image preprocessing
    FACE_IMAGE_SIZE = (150, 150)
    MIN_FACE_SIZE = (30, 30)
    BLUR_THRESHOLD = 50.0
