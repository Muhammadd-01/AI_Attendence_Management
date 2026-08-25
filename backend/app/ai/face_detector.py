import cv2
import face_recognition
import logging
from app.config import Config

logger = logging.getLogger(__name__)

class FaceDetector:
    def __init__(self):
        self.min_face_size = Config.MIN_FACE_SIZE
        self.model = 'hog'

    def detect_faces(self, frame):
        """
        Takes BGR OpenCV frame, converts to RGB, uses face_recognition to detect faces.
        Returns list of dicts: [{'bbox': (top, right, bottom, left), 'frame_location': (top, right, bottom, left)}]
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame, model=self.model)
        
        valid_faces = []
        for top, right, bottom, left in face_locations:
            width = right - left
            height = bottom - top
            if width >= self.min_face_size[0] and height >= self.min_face_size[1]:
                valid_faces.append({
                    'bbox': (top, right, bottom, left),
                    'frame_location': (top, right, bottom, left)
                })
        
        if valid_faces:
            logger.info(f"Detected {len(valid_faces)} valid faces.")
            
        return valid_faces

    def detect_and_crop(self, frame):
        """
        Detects faces AND returns cropped face images.
        Returns list of dicts: [{'bbox': ..., 'face_image': cropped_bgr_image}]
        """
        valid_faces = self.detect_faces(frame)
        results = []
        
        for face in valid_faces:
            top, right, bottom, left = face['bbox']
            # Crop the face from the original BGR frame
            face_image = frame[top:bottom, left:right]
            
            results.append({
                'bbox': face['bbox'],
                'face_image': face_image
            })
            
        return results
