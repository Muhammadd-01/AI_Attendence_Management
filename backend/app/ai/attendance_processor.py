import time
import threading
import cv2
import face_recognition
import logging
from app.config import Config
from .camera import Camera

logger = logging.getLogger(__name__)

class AttendanceProcessor:
    def __init__(self, face_detector, preprocessor, encoder, recognizer, attendance_callback):
        self.face_detector = face_detector
        self.preprocessor = preprocessor
        self.encoder = encoder
        self.recognizer = recognizer
        self.attendance_callback = attendance_callback
        
        self.camera = Camera()
        self.running = False
        self.thread = None
        self.lock = threading.Lock()
        self.allowed_class = None
        
        self.cooldown_dict = {}  # {student_id: last_timestamp}
        self.cooldown_seconds = Config.RECOGNITION_COOLDOWN_SECONDS
        self.process_interval = Config.FRAME_PROCESS_INTERVAL
        
        self.latest_results = []
        self.latest_annotated_frame = None

    def start_session(self, allowed_class=None):
        """Start processing in background thread."""
        with self.lock:
            if not self.running:
                self.running = True
                self.allowed_class = allowed_class
                self.camera.start()
                self.thread = threading.Thread(target=self._processing_loop, daemon=True)
                self.thread.start()
                logger.info(f"Attendance processing session started (Filter class: {allowed_class}).")

    def stop_session(self):
        """Stop processing."""
        with self.lock:
            self.running = False
            self.camera.stop()
            if self.thread:
                self.thread.join(timeout=2.0)
            logger.info("Attendance processing session stopped.")

    def is_running(self):
        """Check if session is active"""
        with self.lock:
            return self.running

    def process_frame(self, frame):
        """Full pipeline for one frame"""
        # 1. Detect faces
        faces = self.face_detector.detect_faces(frame)
        if not faces:
            return []
            
        # 2. Get face locations
        face_locations = [face['frame_location'] for face in faces]
        
        # 3. Convert frame to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 4. Get encodings
        encodings = self.encoder.encode(rgb_frame, face_locations=face_locations)
        
        frame_results = []
        
        # 5. For each encoding, recognize
        for i, encoding in enumerate(encodings):
            rec_result = self.recognizer.recognize(encoding, self.allowed_class)
            bbox = face_locations[i]
            
            result_dict = {
                'bbox': bbox,
                'student_id': rec_result.get('student_id'),
                'name': rec_result.get('name', 'Unknown'),
                'confidence': rec_result.get('confidence', 0.0),
                'recognized': rec_result.get('recognized', False)
            }
            frame_results.append(result_dict)
            
            # 6. Accumulate consecutive hits to prevent ghost/fluke check-ins
            if result_dict['recognized'] and result_dict['student_id']:
                sid = result_dict['student_id']
                if not hasattr(self, 'hit_counters'):
                    self.hit_counters = {}
                
                self.hit_counters[sid] = self.hit_counters.get(sid, 0) + 1
                
                # Require 3 valid recognition frames before officially checking in
                if self.hit_counters[sid] >= 3:
                    if self._cooldown_check(sid):
                        try:
                            self.attendance_callback(sid, result_dict['confidence'])
                        except Exception as e:
                            logger.error(f"Error calling attendance callback: {str(e)}")
                    # We don't reset hit_counter here so the UI bounding box stays green continuously,
                    # the cooldown_check handles preventing duplicate DB entries.
            else:
                # Optional: If you want to decay hits for unrecognized people you could loop here,
                # but it's fine to leave it as is for UI stability.
                pass
                
        return frame_results

    def _cooldown_check(self, student_id):
        """Check if student was recognized within RECOGNITION_COOLDOWN_SECONDS."""
        now = time.time()
        with self.lock:
            last_seen = self.cooldown_dict.get(student_id, 0)
            if now - last_seen > self.cooldown_seconds:
                self.cooldown_dict[student_id] = now
                return True
            return False

    def get_latest_results(self):
        """Return the most recent recognition results for the UI to poll."""
        with self.lock:
            return self.latest_results

    def _processing_loop(self):
        """Background thread loop. Reads camera frame, processes every N frames."""
        frame_count = 0
        while self.is_running():
            ret, frame = self.camera.get_frame()
            if not ret or frame is None:
                time.sleep(0.01)
                continue
                
            frame_count += 1
            if frame_count % self.process_interval == 0:
                results = self.process_frame(frame)
                with self.lock:
                    self.latest_results = results
                    self.latest_annotated_frame = frame.copy()
            else:
                time.sleep(0.01)
