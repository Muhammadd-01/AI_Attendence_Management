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
import threading
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
        self._init_lock = threading.Lock()

    def init_pipeline(self):
        with self._init_lock:
            if self._initialized:
                return
            try:
                self.camera = Camera()
                self.detector = FaceDetector()
                self.preprocessor = FacePreprocessor()
                self.encoder = FaceEncoder()
                self.recognizer = FaceRecognizer()
                
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
                logger.info("Recognition pipeline successfully initialized.")

                # Run disk sync in background thread so it never blocks UI or API responses
                threading.Thread(target=self.sync_untrained_users, daemon=True).start()
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

    def detect_and_recognize_frame(self, image_data=None, allowed_class=None, target_role=None):
        """
        Accepts base64 image or captures from camera, detects all faces, recognizes them,
        applies role filtering (faculty only vs student only), and executes auto-attendance.
        """
        if not self._initialized:
            self.init_pipeline()
            
        frame = None
        if image_data:
            try:
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                np_arr = np.frombuffer(image_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            except Exception as e:
                logger.error(f"Failed to decode base64 in detect_and_recognize_frame: {e}")
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
            h_frame, w_frame = frame.shape[:2]
            for i, enc in enumerate(encodings):
                rec = self.recognizer.recognize(enc, allowed_class)
                s_id = rec.get('student_id')
                is_teacher = str(s_id).startswith('TCH') or str(s_id).startswith('T-') or str(s_id).startswith('PRN') or 'teacher' in str(s_id).lower() or 'principal' in str(s_id).lower()
                top, right, bottom, left = face_locations[i]

                box_top_pct = round((top / float(h_frame)) * 100, 2)
                box_bottom_pct = round((bottom / float(h_frame)) * 100, 2)
                box_left_pct = round((left / float(w_frame)) * 100, 2)
                box_right_pct = round((right / float(w_frame)) * 100, 2)
                box_width_pct = round(((right - left) / float(w_frame)) * 100, 2)
                box_height_pct = round(((bottom - top) / float(h_frame)) * 100, 2)

                # ROLE RESTRICTION: Faculty-Only Check-In/Out Kiosk
                if target_role in ['faculty', 'teacher', 'staff']:
                    if rec.get('recognized') and not is_teacher:
                        # Student detected at Faculty Kiosk
                        matches.append({
                            'student_id': s_id,
                            'name': rec.get('name', 'Student'),
                            'class_name': '',
                            'confidence': float(rec.get('confidence', 0.0)),
                            'recognized': True,
                            'role': 'student',
                            'roleLabel': 'Student Detected',
                            'error': True,
                            'is_student_kiosk_violation': True,
                            'error_message': 'Access Restricted: Kiosk is for Teachers & Principal only. Students must be marked via Classroom Live Attendance.',
                            'bbox': [int(top), int(right), int(bottom), int(left)],
                            'box_top_pct': box_top_pct,
                            'box_bottom_pct': box_bottom_pct,
                            'box_left_pct': box_left_pct,
                            'box_right_pct': box_right_pct,
                            'box_width_pct': box_width_pct,
                            'box_height_pct': box_height_pct
                        })
                        continue

                # ROLE RESTRICTION: Student-Only Classroom Live Attendance
                if target_role == 'student':
                    if rec.get('recognized') and is_teacher:
                        # Faculty member in classroom - NOT marked, strictly restricted
                        matches.append({
                            'student_id': s_id,
                            'name': rec.get('name', 'Faculty Member'),
                            'class_name': '',
                            'confidence': float(rec.get('confidence', 0.0)),
                            'recognized': False, # Explicitly false so it never shows as marked
                            'is_restricted': True,
                            'role': 'teacher',
                            'roleLabel': 'Faculty Member (Restricted)',
                            'is_teacher_in_room': True,
                            'status_text': 'Restricted: Not Recorded',
                            'error': True,
                            'error_message': 'Faculty attendance is not recorded in Classroom Live Vision.',
                            'bbox': [int(top), int(right), int(bottom), int(left)],
                            'box_top_pct': box_top_pct,
                            'box_bottom_pct': box_bottom_pct,
                            'box_left_pct': box_left_pct,
                            'box_right_pct': box_right_pct,
                            'box_width_pct': box_width_pct,
                            'box_height_pct': box_height_pct
                        })
                        continue
                
                # CLASS RESTRICTION: Student doesn't belong to the teacher's class
                if target_role == 'student' and rec.get('recognized') and not is_teacher:
                    if allowed_class and rec.get('class_name') != allowed_class:
                        matches.append({
                            'student_id': s_id,
                            'name': rec.get('name', 'Student'),
                            'class_name': rec.get('class_name', ''),
                            'confidence': float(rec.get('confidence', 0.0)),
                            'recognized': False, # Explicitly false so it's not marked present
                            'is_restricted': True,
                            'role': 'student',
                            'roleLabel': 'Wrong Class / Unauthorized',
                            'error': True,
                            'error_message': f"Student belongs to {rec.get('class_name', 'another class')} and cannot be marked present in {allowed_class}.",
                            'bbox': [int(top), int(right), int(bottom), int(left)],
                            'box_top_pct': box_top_pct,
                            'box_bottom_pct': box_bottom_pct,
                            'box_left_pct': box_left_pct,
                            'box_right_pct': box_right_pct,
                            'box_width_pct': box_width_pct,
                            'box_height_pct': box_height_pct
                        })
                        continue
                
                # Execute auto-attendance if recognized
                if rec.get('recognized') and s_id:
                    # Auto-attendance is ONLY for Classroom Live Attendance (Students)
                    # For Faculty Kiosk, the frontend handles explicit Check-In or Check-Out API calls.
                    if target_role == 'student' and not is_teacher:
                        try:
                            self._attendance_callback(s_id, float(rec.get('confidence', 0.95)))
                        except Exception as e:
                            logger.error(f"Auto-attendance recording error: {e}")

                matches.append({
                    'student_id': s_id,
                    'name': rec.get('name', 'Completely Different Person'),
                    'class_name': rec.get('class_name', ''),
                    'confidence': float(rec.get('confidence', 0.0)),
                    'recognized': bool(rec.get('recognized', False)),
                    'role': 'teacher' if is_teacher else 'student',
                    'bbox': [int(top), int(right), int(bottom), int(left)],
                    'box_top_pct': box_top_pct,
                    'box_bottom_pct': box_bottom_pct,
                    'box_left_pct': box_left_pct,
                    'box_right_pct': box_right_pct,
                    'box_width_pct': box_width_pct,
                    'box_height_pct': box_height_pct
                })
                
            return {
                'face_detected': True,
                'count': len(faces),
                'frame_width': int(w_frame),
                'frame_height': int(h_frame),
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

    def start_session(self, allowed_class=None, classroom_name="Classroom A"):
        if not self._initialized:
            self.init_pipeline()
            
        session_info = attendance.create_session(classroom_name)
        self.active_session_id = session_info.get('session_id')
        if self.attendance_processor:
            self.attendance_processor.start_session(allowed_class=allowed_class)
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
        if self.camera:
            return self.camera.generate_mjpeg_stream()
        return None

# Global singleton
recognition_service = RecognitionService()
_recognition_service = recognition_service

# Module-level proxy functions
def init_pipeline():
    return _recognition_service.init_pipeline()

def sync_all():
    return _recognition_service.sync_all()

def start_session(allowed_class=None, classroom_name="Classroom A"):
    return _recognition_service.start_session(allowed_class, classroom_name)

def stop_session():
    return _recognition_service.stop_session()

def get_status():
    return _recognition_service.get_status()

def get_latest_results():
    return _recognition_service.get_latest_results()

def detect_and_recognize_frame(image_data=None, allowed_class=None, target_role=None):
    return _recognition_service.detect_and_recognize_frame(image_data, allowed_class, target_role)

def get_camera_stream():
    return _recognition_service.get_camera_stream()
