from app.ai.camera import Camera
from app.ai.face_detector import FaceDetector
from app.ai.preprocessor import FacePreprocessor
from app.ai.face_encoder import FaceEncoder
from app.ai.face_recognizer import FaceRecognizer
from app.ai.attendance_processor import AttendanceProcessor
from app.models import student, attendance

class RecognitionService:
    def __init__(self):
        self.camera = None
        self.detector = None
        self.preprocessor = None
        self.encoder = None
        self.recognizer = None
        self.attendance_processor = None
        self.active_session_id = None

    def init_pipeline(self):
        self.camera = Camera()
        self.detector = FaceDetector()
        self.preprocessor = FacePreprocessor()
        self.encoder = FaceEncoder()
        self.recognizer = FaceRecognizer()
        
        # Load all encodings
        encodings = student.get_all_encodings()
        formatted_encodings = {}
        for row in encodings:
            student_id = row.get('student_id')
            encoding_data = row.get('encoding_data')
            if student_id not in formatted_encodings:
                formatted_encodings[student_id] = []
            formatted_encodings[student_id].append(encoding_data)
            
        self.recognizer.load_encodings(formatted_encodings)
        
        self.attendance_processor = AttendanceProcessor(callback=self._attendance_callback)

    def _attendance_callback(self, student_id, action, timestamp):
        if not self.active_session_id:
            return
            
        if action == "check_in":
            attendance.check_in(student_id, self.active_session_id, timestamp)
        elif action == "check_out":
            attendance.check_out(student_id, self.active_session_id, timestamp)

    def start_recognition_session(self, classroom_name="Default Classroom"):
        session_id = attendance.create_session(classroom_name)
        self.active_session_id = session_id
        if self.attendance_processor:
            self.attendance_processor.start()
        return session_id

    def stop_recognition_session(self):
        if self.attendance_processor:
            self.attendance_processor.stop()
        if self.active_session_id:
            attendance.finalize_session(self.active_session_id)
            attendance.end_session(self.active_session_id)
            self.active_session_id = None

    def get_camera_stream(self):
        if self.camera and self.recognizer:
            return self.camera.generate_annotated_stream(recognizer_callback=self.recognizer.recognize_multiple)
        return None

# Global singleton
recognition_service = RecognitionService()
