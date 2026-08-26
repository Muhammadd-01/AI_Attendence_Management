import os
import cv2
import time
import base64
import urllib.request
import numpy as np
from pathlib import Path
from flask import current_app
from app.models import student
from app.services.recognition_service import recognition_service
from app.ai.face_encoder import FaceEncoder
from app.ai.face_detector import FaceDetector
from app.ai.preprocessor import FacePreprocessor
from app.config import Config
import logging

logger = logging.getLogger(__name__)

detector = FaceDetector()
preprocessor = FacePreprocessor()
encoder = FaceEncoder()

def get_all_students(status=None, class_name=None, search=None):
    return student.get_all_students(status, class_name, search)

def get_student(student_id):
    return student.get_student(student_id)

def create_student(data):
    return student.create_student(
        data.get('student_id'),
        data.get('name'),
        data.get('email', ''),
        data.get('class_name', ''),
        data.get('course', ''),
        password=data.get('password', 'student123')
    )

def update_student(student_id, data):
    return student.update_student(student_id, data)

def delete_student(student_id):
    return student.delete_student(student_id)

def get_dataset_path():
    try:
        return Path(Config.DATASET_FULL_PATH)
    except Exception:
        return Path(os.path.join(os.getcwd(), 'dataset'))

from concurrent.futures import ThreadPoolExecutor

def download_supabase_images(student_id, image_urls):
    """
    Downloads images from Supabase and returns them as in-memory RGB numpy arrays.
    Uses multi-threading for speed.
    """
    def fetch_url(url):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                img_bytes = resp.read()
                np_arr = np.frombuffer(img_bytes, np.uint8)
                bgr_frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if bgr_frame is not None:
                    return cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        except Exception as e:
            logger.warning(f"Error downloading {url}: {e}")
        return None

    frames = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(fetch_url, image_urls)
        for res in results:
            if res is not None:
                frames.append(res)
    return frames

def capture_face(student_id, image_data=None):
    """
    Saves a captured face image for training.
    """
    dataset_path = get_dataset_path() / str(student_id)
    dataset_path.mkdir(parents=True, exist_ok=True)
    
    frame = None
    if image_data:
        try:
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            img_bytes = base64.b64decode(image_data)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            return {"success": False, "error": f"Failed to decode base64: {e}"}
    elif recognition_service.camera and recognition_service.camera.is_opened():
        ret, frame = recognition_service.camera.get_frame()
        if not ret:
            frame = None
            
    if frame is None:
        return {"success": False, "error": "No camera frame or image data received"}
        
    timestamp = int(time.time() * 1000)
    file_path = dataset_path / f"{timestamp}.jpg"
    cv2.imwrite(str(file_path), frame)
    
    image_paths = list(dataset_path.glob("*.jpg")) + list(dataset_path.glob("*.png"))
    count = len(image_paths)
    student.update_face_count(student_id, count)
    
    return {
        "success": True, 
        "face_count": count, 
        "message": f"Sample #{count} captured successfully"
    }

def train_student_model(student_id, image_urls=None):
    """
    Extracts 128-d face encodings from disk and/or Supabase storage URLs and trains AI recognizer.
    """
    frames_to_encode = []
    
    if image_urls and len(image_urls) > 0:
        frames_to_encode.extend(download_supabase_images(student_id, image_urls))
        
    dataset_path = get_dataset_path() / str(student_id)
    image_paths = list(dataset_path.glob("*.jpg")) + list(dataset_path.glob("*.png")) + list(dataset_path.glob("*.jpeg"))
    
    if not frames_to_encode and not image_paths:
        st_data = student.get_student(student_id) or {}
        avatar_url = st_data.get('avatar_url')
        if avatar_url and avatar_url.startswith('http'):
            frames_to_encode.extend(download_supabase_images(student_id, [avatar_url]))
            
    if not frames_to_encode and not image_paths:
        return {"success": False, "error": f"No face samples found on disk or Supabase for student {student_id}."}
        
    try:
        # Encode local files if any exist
        encodings = []
        if image_paths:
            encodings.extend(encoder.compute_representative_encodings([str(p) for p in image_paths]))
            
        # Encode in-memory Supabase frames
        if frames_to_encode:
            encodings.extend(encoder.compute_encodings_from_frames(frames_to_encode))
            
        if not encodings:
            return {"success": False, "error": "Could not detect clear facial landmarks in captured images. Please retake photos with better lighting."}
            
        # Save to database
        student.save_encodings(student_id, encodings)
        
        st_data = student.get_student(student_id) or {}
        st_name = st_data.get('name', student_id)
        
        # Inject directly into live FaceRecognizer memory
        if recognition_service.recognizer:
            recognition_service.recognizer.add_student(student_id, st_name, encodings)
            
        recognition_service.sync_all()

        logger.info(f"Auto-trained AI model for student {st_name} ({student_id}) with {len(encodings)} embeddings.")
        return {
            "success": True,
            "encodings_count": len(encodings),
            "message": f"AI model successfully trained on {len(encodings)} facial embeddings for {st_name}!"
        }
    except Exception as e:
        logger.error(f"Error training model for student {student_id}: {e}")
        return {"success": False, "error": str(e)}
