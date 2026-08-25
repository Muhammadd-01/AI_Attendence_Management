import face_recognition
import numpy as np
import threading
import logging
from app.config import Config

logger = logging.getLogger(__name__)

class FaceRecognizer:
    def __init__(self):
        self.known_encodings = {}  # {student_id: {'name': str, 'encodings': [np.array]}}
        self.threshold = Config.FACE_MATCH_THRESHOLD
        self.lock = threading.Lock()

    def load_encodings(self, student_encodings):
        """Load dict of {student_id: {'name': str, 'encodings': [numpy arrays]}} into memory"""
        with self.lock:
            self.known_encodings = student_encodings
            logger.info(f"Loaded encodings for {len(self.known_encodings)} students.")

    def add_student(self, student_id, name, encodings):
        """Add single student's encodings"""
        with self.lock:
            self.known_encodings[student_id] = {
                'name': name,
                'encodings': encodings
            }
            logger.info(f"Added encodings for student: {name} ({student_id})")

    def remove_student(self, student_id):
        """Remove student's encodings"""
        with self.lock:
            if student_id in self.known_encodings:
                del self.known_encodings[student_id]
                logger.info(f"Removed student {student_id} from recognizer.")

    def recognize(self, face_encoding):
        """
        Compare one face encoding against all known students.
        Return dict: {'student_id': str|None, 'name': str, 'confidence': float, 'recognized': bool}
        """
        best_match = {
            'student_id': None,
            'name': 'Unknown',
            'confidence': 0.0,
            'recognized': False
        }
        
        best_distance = 1.0
        
        with self.lock:
            for student_id, data in self.known_encodings.items():
                name = data['name']
                encodings = data['encodings']
                
                if not encodings:
                    continue
                    
                distances = face_recognition.face_distance(encodings, face_encoding)
                min_distance = np.min(distances)
                
                if min_distance < best_distance:
                    best_distance = min_distance
                    best_match['student_id'] = student_id
                    best_match['name'] = name

        if best_distance <= self.threshold:
            best_match['confidence'] = float(1.0 - best_distance)
            best_match['recognized'] = True
            
        return best_match

    def recognize_multiple(self, face_encodings):
        """Recognize multiple faces. Returns list of recognition results."""
        results = []
        for encoding in face_encodings:
            results.append(self.recognize(encoding))
        return results
