from app.ai.camera import Camera
from app.ai.face_detector import FaceDetector
from app.ai.preprocessor import FacePreprocessor
from app.ai.face_encoder import FaceEncoder
from app.ai.face_recognizer import FaceRecognizer
from app.ai.attendance_processor import AttendanceProcessor
from app.models import student, attendance
import logging

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
            
            # Load all encodings
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
        except Exception as e:
            logger.warning(f"AI Pipeline initialization deferred: {e}")

    def _attendance_callback(self, student_id, confidence):
        try:
            if not attendance.is_checked_in_today(student_id):
                st = student.get_student(student_id)
                name = st.get('name', 'Unknown') if st else 'Unknown'
                attendance.check_in(student_id, name, confidence, self.active_session_id)
                logger.info(f"Marked attendance for {name} ({student_id})")
        except Exception as e:
            logger.error(f"Error recording attendance callback: {e}")

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

# Module-level proxy functions for convenient imports
def init_pipeline():
    return _recognition_service.init_pipeline()

def start_session(classroom_name="Classroom A"):
    return _recognition_service.start_session(classroom_name)

def stop_session():
    return _recognition_service.stop_session()

def get_status():
    return _recognition_service.get_status()

def get_latest_results():
    return _recognition_service.get_latest_results()

def get_camera_stream():
    return _recognition_service.get_camera_stream()
