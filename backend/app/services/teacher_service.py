import os
import cv2
import time
import base64
import urllib.request
import numpy as np
from pathlib import Path
from flask import current_app
from app.database.connection import get_db
from app.services.recognition_service import recognition_service
from app.ai.face_encoder import FaceEncoder
from app.config import Config
import logging
import datetime

logger = logging.getLogger(__name__)
encoder = FaceEncoder()

def get_dataset_path():
    try:
        return Path(Config.DATASET_FULL_PATH)
    except Exception:
        return Path(os.path.join(os.getcwd(), 'dataset'))

def download_supabase_images(teacher_id, image_urls):
    """
    Downloads images from Supabase and returns them as in-memory RGB numpy arrays.
    Prevents saving images to local disk.
    """
    frames = []
    for idx, url in enumerate(image_urls):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                img_bytes = resp.read()
                np_arr = np.frombuffer(img_bytes, np.uint8)
                bgr_frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if bgr_frame is not None:
                    rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
                    frames.append(rgb_frame)
        except Exception as e:
            logger.warning(f"Error downloading faculty image {url}: {e}")
            
    return frames

def get_all_teachers():
    db = get_db()
    docs = db.collection('teachers').stream()
    return [{**doc.to_dict(), 'id': doc.id} for doc in docs]

def get_teacher(teacher_id):
    db = get_db()
    docs = list(db.collection('teachers').where('teacher_id', '==', teacher_id).limit(1).stream())
    if docs:
        return {**docs[0].to_dict(), 'id': docs[0].id}
        
    doc = db.collection('teachers').document(teacher_id).get()
    if doc.exists:
        return {**doc.to_dict(), 'id': doc.id}
    return None

def create_teacher(data):
    db = get_db()
    doc_ref = db.collection('teachers').document()
    
    teacher_id = data.get('teacher_id') or doc_ref.id
    teacher_data = {
        'teacher_id': teacher_id,
        'name': data.get('name', ''),
        'email': data.get('email', ''),
        'password': data.get('password', ''),
        'department': data.get('department', 'Computer Science'),
        'status': data.get('status', 'active'),
        'face_count': 0,
        'encodings_count': 0,
        'lastLogin': data.get('lastLogin', 'Never'),
        'created_at': datetime.datetime.utcnow().isoformat(),
        'updated_at': datetime.datetime.utcnow().isoformat()
    }
    
    doc_ref.set(teacher_data)
    return {**teacher_data, 'id': doc_ref.id}

def update_teacher(teacher_id, data):
    db = get_db()
    docs = list(db.collection('teachers').where('teacher_id', '==', teacher_id).limit(1).stream())
    if docs:
        doc_ref = docs[0].reference
    else:
        doc_ref = db.collection('teachers').document(teacher_id)
        
    update_data = data.copy()
    update_data['updated_at'] = datetime.datetime.utcnow().isoformat()
    doc_ref.update(update_data)
    return get_teacher(teacher_id)

def delete_teacher(teacher_id):
    db = get_db()
    docs = list(db.collection('teachers').where('teacher_id', '==', teacher_id).limit(1).stream())
    if docs:
        docs[0].reference.delete()
    else:
        db.collection('teachers').document(teacher_id).delete()
    return True

def capture_teacher_face(teacher_id, image_data=None):
    dataset_path = get_dataset_path() / str(teacher_id)
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
    update_teacher(teacher_id, {'face_count': count})
    
    return {
        "success": True, 
        "face_count": count, 
        "message": f"Faculty sample #{count} captured"
    }

def train_teacher_model(teacher_id, image_urls=None):
    frames_to_encode = []
    
    if image_urls and len(image_urls) > 0:
        frames_to_encode.extend(download_supabase_images(teacher_id, image_urls))
        
    dataset_path = get_dataset_path() / str(teacher_id)
    image_paths = list(dataset_path.glob("*.jpg")) + list(dataset_path.glob("*.png")) + list(dataset_path.glob("*.jpeg"))
    
    if not frames_to_encode and not image_paths:
        t_data = get_teacher(teacher_id) or {}
        avatar_url = t_data.get('avatar_url')
        if avatar_url and avatar_url.startswith('http'):
            frames_to_encode.extend(download_supabase_images(teacher_id, [avatar_url]))
            
    if not frames_to_encode and not image_paths:
        return {"success": False, "error": f"No face samples found on disk or Supabase for faculty {teacher_id}."}
        
    try:
        # Encode local files if any exist
        encodings = []
        if image_paths:
            encodings.extend(encoder.compute_representative_encodings([str(p) for p in image_paths]))
            
        # Encode in-memory Supabase frames
        if frames_to_encode:
            encodings.extend(encoder.compute_encodings_from_frames(frames_to_encode))
            
        if not encodings:
            return {"success": False, "error": "Could not detect clear facial landmarks in captured photos."}
            
        db = get_db()
        encodings_ref = db.collection('teachers').document(teacher_id).collection('encodings')
        for doc in encodings_ref.stream():
            doc.reference.delete()
            
        for enc in encodings:
            encodings_ref.add({
                'encoding': enc.tolist() if isinstance(enc, np.ndarray) else list(enc),
                'created_at': datetime.datetime.utcnow()
            })
            
        update_teacher(teacher_id, {'encodings_count': len(encodings)})
        
        t_data = get_teacher(teacher_id) or {}
        t_name = t_data.get('name', teacher_id)
        
        if recognition_service.recognizer:
            recognition_service.recognizer.add_student(teacher_id, t_name, encodings)
            
        logger.info(f"Auto-trained AI model for faculty {t_name} ({teacher_id}) with {len(encodings)} embeddings.")
        return {
            "success": True,
            "encodings_count": len(encodings),
            "message": f"AI model successfully trained on {len(encodings)} facial embeddings for {t_name}!"
        }
    except Exception as e:
        logger.error(f"Error training model for teacher {teacher_id}: {e}")
        return {"success": False, "error": str(e)}
