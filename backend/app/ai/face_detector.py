import cv2
import face_recognition
import logging
from app.config import Config

logger = logging.getLogger(__name__)

class FaceDetector:
    def __init__(self):
        self.min_face_size = Config.MIN_FACE_SIZE
        self.model = 'hog'
        try:
            self.cascade_frontal = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            self.cascade_profile = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        except Exception:
            self.cascade_frontal = None
            self.cascade_profile = None

    def detect_faces(self, frame):
        """
        Takes BGR OpenCV frame, downscales for fast inference, converts to RGB,
        and detects faces with primary HOG and secondary multi-angle fallback.
        """
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]
        target_w = 560
        if w > target_w:
            scale = target_w / float(w)
            small_frame = cv2.resize(frame, (target_w, int(h * scale)), interpolation=cv2.INTER_LINEAR)
            inv_scale = 1.0 / scale
        else:
            small_frame = frame
            inv_scale = 1.0

        rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        face_locations = list(face_recognition.face_locations(rgb_frame, model=self.model))

        # Fallback to OpenCV Cascade if HOG missed due to angled/tilted head movement
        if not face_locations and self.cascade_frontal is not None:
            gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
            detected = self.cascade_frontal.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(35, 35))
            if len(detected) == 0 and self.cascade_profile is not None:
                detected = self.cascade_profile.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(35, 35))
            
            for (x, y, fw, fh) in detected:
                face_locations.append((y, x + fw, y + fh, x))
        
        valid_faces = []
        for top, right, bottom, left in face_locations:
            orig_top = max(0, int(top * inv_scale))
            orig_right = min(w, int(right * inv_scale))
            orig_bottom = min(h, int(bottom * inv_scale))
            orig_left = max(0, int(left * inv_scale))
            width = orig_right - orig_left
            height = orig_bottom - orig_top
            if width >= self.min_face_size[0] and height >= self.min_face_size[1]:
                valid_faces.append({
                    'bbox': (orig_top, orig_right, orig_bottom, orig_left),
                    'frame_location': (orig_top, orig_right, orig_bottom, orig_left)
                })
        
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
