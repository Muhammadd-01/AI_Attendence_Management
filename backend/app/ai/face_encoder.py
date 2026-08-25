import cv2
import face_recognition
import numpy as np
import logging

logger = logging.getLogger(__name__)

class FaceEncoder:
    def __init__(self):
        pass

    def encode(self, rgb_image, face_locations=None):
        """
        Generate 128-d embeddings for all faces in image.
        Returns list of numpy arrays.
        """
        try:
            encodings = face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)
            return encodings
        except Exception as e:
            logger.error(f"Error encoding faces: {str(e)}")
            return []

    def encode_single(self, rgb_face_image):
        """
        Encode a single cropped face image.
        Returns single numpy array or None.
        """
        try:
            # First detect face location in the cropped image
            face_locations = face_recognition.face_locations(rgb_face_image, model='hog')
            if not face_locations:
                # If detector fails on crop, assume full image is the face
                h, w, _ = rgb_face_image.shape
                face_locations = [(0, w, h, 0)]
                
            encodings = face_recognition.face_encodings(rgb_face_image, known_face_locations=face_locations)
            if encodings:
                return encodings[0]
            return None
        except Exception as e:
            logger.error(f"Error encoding single face: {str(e)}")
            return None

    def compute_representative_encodings(self, image_paths):
        """
        Takes list of image file paths, encodes each, returns list of all valid encodings.
        Used during student registration.
        """
        valid_encodings = []
        for path in image_paths:
            try:
                # Read using OpenCV, convert to RGB
                image = cv2.imread(path)
                if image is None:
                    logger.warning(f"Failed to read image at {path}")
                    continue
                    
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Detect and encode
                face_locations = face_recognition.face_locations(rgb_image, model='hog')
                if not face_locations:
                    logger.warning(f"No face found in image: {path}")
                    continue
                    
                encodings = face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)
                if encodings:
                    valid_encodings.append(encodings[0])
            except Exception as e:
                logger.error(f"Error processing {path}: {str(e)}")
                
        return valid_encodings

    def compute_encodings_from_frames(self, rgb_frames):
        """
        Takes list of RGB numpy frames, encodes each, returns list of valid encodings.
        Processes completely in memory without hitting the disk.
        """
        valid_encodings = []
        for rgb_image in rgb_frames:
            try:
                face_locations = face_recognition.face_locations(rgb_image, model='hog')
                if not face_locations:
                    continue
                encodings = face_recognition.face_encodings(rgb_image, known_face_locations=face_locations)
                if encodings:
                    valid_encodings.append(encodings[0])
            except Exception as e:
                logger.error(f"Error processing in-memory frame: {str(e)}")
        return valid_encodings

