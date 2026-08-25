from app.ai.camera import Camera
from app.ai.face_detector import FaceDetector
from app.ai.preprocessor import FacePreprocessor
from app.ai.face_encoder import FaceEncoder
from app.ai.face_recognizer import FaceRecognizer
from app.ai.attendance_processor import AttendanceProcessor
from app.models import student, attendance
from app.database.connection import get_db
from app.config import Config
import logging
import cv2
import numpy as np
import base64
import os
from pathlib import Path

logger = logging.getLogger(__name__)

class RecognitionService:
    def __init__(self):
        self.camera = None
        self.detector = None
        self.preprocessor = None
        self.encoder = None
        self.recognizer = None
        self.attendance_processor = None
        self.active_session_id = None
        self._initialized = False

    def init_pipeline(self):
        try:
            self.camera = Camera()
            self.detector = FaceDetector()
            self.preprocessor = FacePreprocessor()
            self.encoder = FaceEncoder()
            self.recognizer = FaceRecognizer()
            
            # Sync any existing users who have images on disk but missing encodings
            self.sync_untrained_users()

            # Load all encodings (both students and teachers)
            encodings = student.get_all_encodings()
            self.recognizer.load_encodings(encodings)
            
            self.attendance_processor = AttendanceProcessor(
                face_detector=self.detector,
                preprocessor=self.preprocessor,
                encoder=self.encoder,
                recognizer=self.recognizer,
                attendance_callback=self._attendance_callback
            )
            self._initialized = True
            logger.info("Recognition pipeline successfully initialized with all student & faculty models.")
        except Exception as e:
            logger.warning(f"AI Pipeline initialization deferred: {e}")

    def sync_untrained_users(self):
        """Scans dataset directories for any previous users and generates 128-d embeddings if missing."""
        try:
            dataset_dir = Path(Config.DATASET_FULL_PATH)
            if not dataset_dir.exists():
                return
                
            db = get_db()
            for person_dir in dataset_dir.iterdir():
                if person_dir.is_dir():
                    p_id = person_dir.name
                    image_paths = list(person_dir.glob("*.jpg")) + list(person_dir.glob("*.png"))
                    if image_paths:
                        is_teacher = str(p_id).startswith('TCH') or str(p_id).startswith('T-')
                        if is_teacher:
                            enc_count = len(list(db.collection('teachers').document(p_id).collection('encodings').stream()))
                            if enc_count == 0:
                                encs = self.encoder.compute_representative_encodings([str(p) for p in image_paths])
                                if encs:
                                    enc_ref = db.collection('teachers').document(p_id).collection('encodings')
                                    for enc in encs:
                                        enc_ref.add({'encoding': enc.tolist() if isinstance(enc, np.ndarray) else list(enc)})
                                    logger.info(f"Auto-synced {len(encs)} embeddings for previous faculty {p_id}")
                        else:
                            enc_count = len(list(db.collection('students').document(p_id).collection('encodings').stream()))
                            if enc_count == 0:
                                encs = self.encoder.compute_representative_encodings([str(p) for p in image_paths])
                                if encs:
                                    student.save_encodings(p_id, encs)
                                    logger.info(f"Auto-synced {len(encs)} embeddings for previous student {p_id}")
        except Exception as e:
            logger.warning(f"Auto-sync error: {e}")

    def _attendance_callback(self, student_id, confidence):
        try:
            if not attendance.is_checked_in_today(student_id):
                is_teacher = str(student_id).startswith('TCH') or str(student_id).startswith('T-') or 'teacher' in str(student_id).lower()
                name = 'Unknown'
                person_type = 'student'

                if is_teacher:
                    db = get_db()
                    t_docs = list(db.collection('teachers').where('teacher_id', '==', student_id).limit(1).stream())
                    if t_docs:
                        name = t_docs[0].to_dict().get('name', 'Faculty Member')
                    else:
                        name = f"Teacher ({student_id})"
                    person_type = 'teacher'
                else:
                    st = student.get_student(student_id)
                    name = st.get('name', 'Student') if st else 'Student'
                    person_type = 'student'

                attendance.check_in(
                    student_id=student_id, 
                    student_name=name, 
                    confidence=confidence, 
                    session_id=self.active_session_id,
                    person_type=person_type
                )
                logger.info(f"Unified AI marked {person_type} attendance for {name} ({student_id})")
        except Exception as e:
            logger.error(f"Error recording unified attendance callback: {e}")

    def detect_and_recognize_frame(self, image_data=None):
        """Processes a frame either from base64 payload or active camera"""
        if not self._initialized:
            self.init_pipeline()
            
        frame = None
        if image_data:
            try:
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                img_bytes = base64.b64decode(image_data)
                np_arr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            except Exception as e:
                logger.error(f"Frame decode error: {e}")
                frame = None
        elif self.camera and self.camera.is_opened():
            ret, frame = self.camera.get_frame()
            if not ret:
                frame = None
                
        if frame is None:
            return {'face_detected': False, 'count': 0, 'results': []}
            
        try:
            faces = self.detector.detect_faces(frame)
            if not faces:
                return {'face_detected': False, 'count': 0, 'results': []}
                
            face_locations = [f['frame_location'] for f in faces]
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            encodings = self.encoder.encode(rgb_frame, face_locations=face_locations)
            
            matches = []
            for i, enc in enumerate(encodings):
                rec = self.recognizer.recognize(enc)
                s_id = rec.get('student_id')
                is_teacher = str(s_id).startswith('TCH') or str(s_id).startswith('T-')
                matches.append({
                    'student_id': s_id,
                    'name': rec.get('name', 'Unknown Face'),
                    'confidence': float(rec.get('confidence', 0.0)),
                    'recognized': bool(rec.get('recognized', False)),
                    'role': 'teacher' if is_teacher else 'student',
                    'bbox': face_locations[i]
                })
                
            return {
                'face_detected': True,
                'count': len(faces),
                'results': matches
            }
        except Exception as e:
            logger.error(f"Error during detect_and_recognize_frame: {e}")
            return {'face_detected': False, 'count': 0, 'results': [], 'error': str(e)}

    def sync_all(self):
        """Reloads all encodings from database and returns stats"""
        if not self._initialized:
            self.init_pipeline()
        self.sync_untrained_users()
        all_encs = student.get_all_encodings()
        if self.recognizer:
            self.recognizer.load_encodings(all_encs)
        return {
            "success": True,
            "total_registered_models": len(all_encs),
            "users": list(all_encs.keys())
        }

    def start_session(self, classroom_name="Classroom A"):
        if not self._initialized:
            self.init_pipeline()
            
        session_info = attendance.create_session(classroom_name)
        self.active_session_id = session_info.get('session_id')
        if self.attendance_processor:
            self.attendance_processor.start_session()
        return session_info

    def stop_session(self):
        if self.attendance_processor:
            self.attendance_processor.stop_session()
        if self.active_session_id:
            summary = attendance.finalize_session(self.active_session_id)
            self.active_session_id = None
            return summary
        return {"status": "stopped"}

    def get_status(self):
        active = bool(self.attendance_processor and self.attendance_processor.is_running())
        return {
            "session_active": active,
            "is_active": active,
            "session_id": self.active_session_id
        }

    def get_latest_results(self):
        if self.attendance_processor:
            return self.attendance_processor.get_latest_results()
        return []

    def get_camera_stream(self):
        if not self._initialized:
            self.init_pipeline()
        if self.camera and self.recognizer:
            return self.camera.generate_annotated_stream(recognizer_callback=self.recognizer.recognize_multiple)
        return None

# Global singleton
recognition_service = RecognitionService()
_recognition_service = recognition_service

# Module-level proxy functions
def init_pipeline():
    return _recognition_service.init_pipeline()

def sync_all():
    return _recognition_service.sync_all()

def start_session(classroom_name="Classroom A"):
    return _recognition_service.start_session(classroom_name)

def stop_session():
    return _recognition_service.stop_session()

def get_status():
    return _recognition_service.get_status()

def get_latest_results():
    return _recognition_service.get_latest_results()

def detect_and_recognize_frame(image_data=None):
    return _recognition_service.detect_and_recognize_frame(image_data)

def get_camera_stream():
    return _recognition_service.get_camera_stream()
