import cv2
import threading
import logging
from app.config import Config

logger = logging.getLogger(__name__)

class Camera:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(Camera, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self, camera_index=None):
        if self._initialized:
            return
            
        if camera_index is None:
            camera_index = Config.CAMERA_INDEX
            
        self.camera_index = camera_index
        self.cap = None
        self.frame_lock = threading.Lock()
        self._initialized = True

    def start(self):
        """Open camera if not already open"""
        with self.frame_lock:
            if self.cap is None or not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.camera_index)
                if not self.cap.isOpened():
                    logger.error(f"Failed to open camera index {self.camera_index}")
                else:
                    logger.info(f"Camera {self.camera_index} started successfully")

    def stop(self):
        """Release camera"""
        with self.frame_lock:
            if self.cap is not None:
                self.cap.release()
                self.cap = None
                logger.info(f"Camera {self.camera_index} stopped")

    def get_frame(self):
        """Read single frame from camera. Returns (success, frame)"""
        with self.frame_lock:
            if self.cap is not None and self.cap.isOpened():
                ret, frame = self.cap.read()
                return ret, frame
            return False, None

    def is_opened(self):
        """Check if camera is active"""
        with self.frame_lock:
            return self.cap is not None and self.cap.isOpened()

    def generate_mjpeg_stream(self):
        """Generator that yields MJPEG frames for Flask streaming response."""
        self.start()
        try:
            while self.is_opened():
                ret, frame = self.get_frame()
                if not ret or frame is None:
                    continue
                    
                ret, jpeg = cv2.imencode('.jpg', frame)
                if ret:
                    jpeg_bytes = jpeg.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + jpeg_bytes + b'\r\n')
        finally:
            self.stop()

    def generate_annotated_stream(self, recognizer_callback=None):
        """Generator that yields annotated MJPEG frames."""
        self.start()
        try:
            while self.is_opened():
                ret, frame = self.get_frame()
                if not ret or frame is None:
                    continue
                    
                if recognizer_callback:
                    # callback returns list of dicts: {'bbox': (t,r,b,l), 'name': str, 'recognized': bool}
                    results = recognizer_callback(frame)
                    if results:
                        for res in results:
                            top, right, bottom, left = res['bbox']
                            name = res.get('name', 'Unknown')
                            recognized = res.get('recognized', False)
                            
                            color = (0, 255, 0) if recognized else (0, 0, 255)
                            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                            cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, color, 2)

                ret, jpeg = cv2.imencode('.jpg', frame)
                if ret:
                    jpeg_bytes = jpeg.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + jpeg_bytes + b'\r\n')
        finally:
            self.stop()
