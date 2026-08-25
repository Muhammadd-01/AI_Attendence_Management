import os
import cv2
import time
from pathlib import Path
from flask import current_app
from app.models import student
from app.services.recognition_service import recognition_service
from app.ai.face_encoder import FaceEncoder
from app.ai.face_detector import FaceDetector
from app.ai.preprocessor import FacePreprocessor

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
        data.get('course', '')
    )

def update_student(student_id, data):
    return student.update_student(student_id, data)

def delete_student(student_id):
    return student.delete_student(student_id)

detector = FaceDetector()
preprocessor = FacePreprocessor()
encoder = FaceEncoder()

def get_dataset_path():
    try:
        from app.config import Config
        return Path(Config.DATASET_FULL_PATH)
    except ImportError:
        return Path(current_app.config.get('DATASET_FULL_PATH', 'datasets'))

def capture_face(student_id, frame):
    dataset_path = get_dataset_path() / str(student_id)
    dataset_path.mkdir(parents=True, exist_ok=True)
    
    faces = detector.detect(frame)
    if not faces:
        return False, "No face detected"
    
    # Process only the first detected face for capture
    x, y, w, h = faces[0]
    face_img = frame[y:y+h, x:x+w]
    processed_face = preprocessor.preprocess(face_img)
    
    if processed_face is None:
         return False, "Face preprocessing failed"
         
    timestamp = int(time.time())
    file_path = dataset_path / f"{timestamp}.jpg"
    cv2.imwrite(str(file_path), processed_face)
    
    student.update_face_count(student_id, increment=1)
    return True, "Face captured successfully"

def train_student_model(student_id):
    dataset_path = get_dataset_path() / str(student_id)
    if not dataset_path.exists():
        return False, "Dataset not found"
        
    image_paths = list(dataset_path.glob("*.jpg"))
    if not image_paths:
         return False, "No images found for student"
         
    try:
        encodings = encoder.compute_representative_encodings([str(p) for p in image_paths])
        
        student.delete_encodings(student_id)
        for enc in encodings:
            student.save_encodings(student_id, enc)
            
        # Update global recognizer
        all_encodings = student.get_all_encodings()
        formatted_encodings = {}
        for row in all_encodings:
            sid = row.get('student_id')
            enc_data = row.get('encoding_data')
            if sid not in formatted_encodings:
                formatted_encodings[sid] = []
            formatted_encodings[sid].append(enc_data)
            
        if recognition_service.recognizer:
            recognition_service.recognizer.load_encodings(formatted_encodings)
            
        return True, "Model trained successfully"
    except Exception as e:
        return False, str(e)
