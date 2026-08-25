import cv2
import logging
from app.config import Config

logger = logging.getLogger(__name__)

class FacePreprocessor:
    def __init__(self):
        self.target_size = Config.FACE_IMAGE_SIZE
        self.blur_threshold = Config.BLUR_THRESHOLD

    def preprocess(self, face_image):
        """
        Full pipeline - quality check, resize, normalize.
        Returns (processed_image, is_valid)
        """
        quality_score = self.check_quality(face_image)
        if quality_score < self.blur_threshold:
            logger.warning(f"Face image too blurry (score: {quality_score:.2f} < {self.blur_threshold})")
            return face_image, False
            
        resized = self.resize(face_image)
        normalized = self.normalize(resized)
        
        return normalized, True

    def resize(self, face_image, target_size=None):
        """Resize face to standard dimensions"""
        if target_size is None:
            target_size = self.target_size
        return cv2.resize(face_image, target_size, interpolation=cv2.INTER_AREA)

    def normalize(self, face_image):
        """Histogram equalization on luminance channel (convert to LAB, equalize L, convert back)"""
        if len(face_image.shape) == 3 and face_image.shape[2] == 3:
            lab = cv2.cvtColor(face_image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            cl = clahe.apply(l)
            limg = cv2.merge((cl, a, b))
            return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        return face_image

    def check_quality(self, face_image):
        """Returns quality score using Laplacian variance for blur detection."""
        gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        return variance

    def to_rgb(self, bgr_image):
        """Convert BGR to RGB"""
        return cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
