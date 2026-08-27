import face_recognition
import numpy as np
import threading
import logging
from app.config import Config

logger = logging.getLogger(__name__)

class FaceRecognizer:
    def __init__(self):
        self.known_encodings = {}  # {student_id: {'name': str, 'encodings': [np.array]}}
        # 0.48 is extremely strict and prevents false positives with strangers
        self.threshold = 0.44 
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

    def recognize(self, face_encoding, allowed_class=None):
        """
        Compare one face encoding against all known registered persons.
        Returns recognized candidate ONLY if distance is within strict threshold.
        """
        best_candidate_id = None
        best_candidate_name = None
        best_candidate_class = ''
        best_distance = 1.0
        
        with self.lock:
            for student_id, data in self.known_encodings.items():
                name = data['name']
                class_name = data.get('class_name', '')
                encodings = data['encodings']
                
                # Class filtering is now handled downstream to allow explicit "Wrong Class" error messages
                
                if not encodings or len(encodings) == 0:
                    continue
                    
                distances = face_recognition.face_distance(encodings, face_encoding)
                
                # Consensus verification:
                # If person has multiple training images (>= 3), take the average of top 3 closest matches.
                if len(distances) >= 3:
                    sorted_dist = np.sort(distances)
                    robust_distance = float(np.mean(sorted_dist[:3]))
                else:
                    robust_distance = float(np.min(distances))
                
                if robust_distance < best_distance:
                    best_distance = robust_distance
                    best_candidate_id = student_id
                    best_candidate_name = name
                    best_candidate_class = class_name

        # STRICT VERIFICATION:
        # Only assign person identity if face strictly matches registered biometric model
        if best_distance <= self.threshold and best_candidate_id is not None:
            # Map distance (e.g. 0.20 - 0.44) into accurate confidence (e.g. 98% - 75%)
            confidence = float(max(0.70, min(1.0, 1.0 - (best_distance * 0.65))))
            return {
                'student_id': best_candidate_id,
                'name': best_candidate_name,
                'class_name': best_candidate_class,
                'confidence': confidence,
                'recognized': True
            }
        else:
            # Unknown / Unregistered Stranger: NEVER return any registered person's name or ID!
            return {
                'student_id': None,
                'name': 'Unknown Face',
                'class_name': '',
                'confidence': 0.0,
                'recognized': False
            }

    def recognize_multiple(self, face_encodings, allowed_class=None):
        """Recognize multiple faces. Returns list of recognition results."""
        results = []
        for encoding in face_encodings:
            results.append(self.recognize(encoding, allowed_class))
        return results
