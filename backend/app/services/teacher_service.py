import os
import cv2
import time
import base64
import urllib.request
import numpy as np
from pathlib import Path
from flask import current_app
from app.database.connection import get_db
from app.services.recognition_service import recognition_service
from app.ai.face_encoder import FaceEncoder
from app.config import Config
import logging
import datetime

logger = logging.getLogger(__name__)
encoder = FaceEncoder()

def get_dataset_path():
    try:
        return Path(Config.DATASET_FULL_PATH)
    except Exception:
        return Path(os.path.join(os.getcwd(), 'dataset'))

from concurrent.futures import ThreadPoolExecutor

def download_supabase_images(teacher_id, image_urls):
    """
    Downloads images from Supabase and returns them as in-memory RGB numpy arrays.
    Uses multi-threading with retry logic to avoid rate limits or timeouts.
    """
    def fetch_url(url, retries=3):
        for attempt in range(retries):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                # 15s timeout, increasing by 5s each attempt
                with urllib.request.urlopen(req, timeout=15 + (attempt * 5)) as resp:
                    img_bytes = resp.read()
                    np_arr = np.frombuffer(img_bytes, np.uint8)
                    bgr_frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                    if bgr_frame is not None:
                        return cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
            except Exception as e:
                if attempt < retries - 1:
                    time.sleep(1.5 * (attempt + 1))  # Exponential backoff
                else:
                    logger.warning(f"Error downloading faculty image {url} after {retries} attempts: {e}")
        return None

    frames = []
    # Reduced to 5 workers to avoid "Connection reset by peer" and SSL handshake limits
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = executor.map(fetch_url, image_urls)
        for res in results:
            if res is not None:
                frames.append(res)
    return frames

def get_all_teachers():
    db = get_db()
    docs = db.collection('teachers').stream()
    return [{**doc.to_dict(), 'id': doc.id} for doc in docs]

def get_teacher(teacher_id):
    db = get_db()
    docs = list(db.collection('teachers').where('teacher_id', '==', teacher_id).limit(1).stream())
    if docs:
        return {**docs[0].to_dict(), 'id': docs[0].id}
        
    doc = db.collection('teachers').document(teacher_id).get()
    if doc.exists:
        return {**doc.to_dict(), 'id': doc.id}
    return None

def create_teacher(data):
    db = get_db()
    doc_ref = db.collection('teachers').document()
    
    teacher_id = data.get('teacher_id') or doc_ref.id
    teacher_data = {
        'teacher_id': teacher_id,
        'name': data.get('name', ''),
        'email': data.get('email', ''),
        'password': data.get('password', ''),
        'department': data.get('department', 'Computer Science'),
        'assigned_class': data.get('assigned_class', ''),
        'status': data.get('status', 'active'),
        'salary': float(data.get('salary', 85000.0)),
        'hourly_rate': float(data.get('hourly_rate', 85000.0 / (26 * 8))),
        'currency': 'PKR',
        'face_count': 0,
        'encodings_count': 0,
        'lastLogin': data.get('lastLogin', 'Never'),
        'created_at': datetime.datetime.now().isoformat(),
        'updated_at': datetime.datetime.now().isoformat()
    }
    
    doc_ref.set(teacher_data)
    return {**teacher_data, 'id': doc_ref.id}

def update_teacher(teacher_id, data):
    db = get_db()
    docs = list(db.collection('teachers').where('teacher_id', '==', teacher_id).limit(1).stream())
    if docs:
        doc_ref = docs[0].reference
    else:
        doc_ref = db.collection('teachers').document(teacher_id)
        
    update_data = data.copy()
    if 'salary' in update_data and update_data['salary'] is not None:
        try:
            sal = float(update_data['salary'])
            update_data['salary'] = sal
            update_data['hourly_rate'] = round(sal / (26.0 * 8.0), 2)
        except Exception:
            pass
    update_data['updated_at'] = datetime.datetime.now().isoformat()
    doc_ref.update(update_data)
    return get_teacher(teacher_id)

def delete_supabase_teacher_faces(person_id):
    """Deletes face images from Supabase Storage via REST API for all buckets"""
    if not person_id:
        return
    supabase_url = 'https://rsasnwxsaohotxcqtesq.supabase.co'
    supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYXNud3hzYW9ob3R4Y3F0ZXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NTUzNDMsImV4cCI6MjEwMzIzMTM0M30.AEsV0UxzEes28gTdZZqiAlrGGknVTubLdxlFXFbVjQM'
    buckets = ['teacher-faces', 'student-faces', 'faces']
    import urllib.request
    import json
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    for bucket in buckets:
        try:
            list_url = f"{supabase_url}/storage/v1/object/list/{bucket}"
            list_payload = json.dumps({"prefix": str(person_id), "limit": 200}).encode('utf-8')
            req = urllib.request.Request(list_url, data=list_payload, headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=10) as resp:
                files = json.loads(resp.read().decode('utf-8'))
                
            if isinstance(files, list) and len(files) > 0:
                file_paths = [f"{person_id}/{f['name']}" for f in files if isinstance(f, dict) and 'name' in f]
                if file_paths:
                    del_url = f"{supabase_url}/storage/v1/object/{bucket}"
                    del_payload = json.dumps({"prefixes": file_paths}).encode('utf-8')
                    del_req = urllib.request.Request(del_url, data=del_payload, headers=headers, method='DELETE')
                    with urllib.request.urlopen(del_req, timeout=10) as del_resp:
                        pass
                    logger.info(f"Deleted {len(file_paths)} images from Supabase bucket {bucket} for teacher {person_id}")
        except Exception as e:
            logger.warning(f"Error cleaning up Supabase storage bucket {bucket} for {person_id}: {e}")

def delete_teacher(teacher_id):
    db = get_db()
    
    # Resolve all possible identifiers for this faculty member
    doc_id = str(teacher_id)
    real_teacher_id = str(teacher_id)
    teacher_name = None
    
    # Try finding by teacher_id field first
    docs = list(db.collection('teachers').where('teacher_id', '==', teacher_id).limit(1).stream())
    if docs:
        doc_data = docs[0].to_dict()
        doc_id = docs[0].id
        real_teacher_id = doc_data.get('teacher_id', teacher_id)
        teacher_name = doc_data.get('name')
        try:
            docs[0].reference.delete()
        except Exception:
            pass
    else:
        # Try finding by document id
        d = db.collection('teachers').document(teacher_id).get()
        if d.exists:
            doc_data = d.to_dict()
            doc_id = d.id
            real_teacher_id = doc_data.get('teacher_id', teacher_id)
            teacher_name = doc_data.get('name')
            try:
                d.reference.delete()
            except Exception:
                pass

    ids_to_clean = set([doc_id, real_teacher_id, str(teacher_id)])

    def _background_cleanup():
        db = get_db()
        # 1. Delete teacher's encodings subcollections for both doc_id and real_teacher_id
        for tid in ids_to_clean:
            try:
                enc_docs = db.collection('teachers').document(tid).collection('encodings').stream()
                for edoc in enc_docs:
                    edoc.reference.delete()
            except Exception:
                pass
            try:
                db.collection('teachers').document(tid).delete()
            except Exception:
                pass

        # 2. Cascade delete ALL attendance records for this teacher
        for tid in ids_to_clean:
            try:
                att_docs = db.collection('attendance').where('student_id', '==', tid).stream()
                for adoc in att_docs:
                    adoc.reference.delete()
            except Exception as e:
                pass
                
        if teacher_name:
            try:
                att_name_docs = db.collection('attendance').where('student_name', '==', teacher_name).stream()
                for adoc in att_name_docs:
                    adata = adoc.to_dict()
                    if adata.get('person_type') == 'teacher' or adata.get('role') == 'teacher' or str(adata.get('student_id', '')).startswith('TCH'):
                        adoc.reference.delete()
            except Exception:
                pass

        # 3. Permanently delete all photos from Supabase Storage
        for tid in ids_to_clean:
            delete_supabase_teacher_faces(tid)

        # 4. Delete local dataset images so old faces don't mix if ID is reused
        import shutil
        for tid in ids_to_clean:
            try:
                dataset_path = get_dataset_path() / str(tid)
                if dataset_path.exists():
                    shutil.rmtree(dataset_path)
            except Exception:
                pass
            
        # 5. Sync AI models so the deleted teacher is instantly forgotten from memory
        from app.services import recognition_service
        for tid in ids_to_clean:
            try:
                if recognition_service._recognition_service and recognition_service._recognition_service.recognizer:
                    recognition_service._recognition_service.recognizer.remove_student(tid)
            except Exception:
                pass
                
        try:
            recognition_service.sync_all()
        except Exception as e:
            pass

    import threading
    threading.Thread(target=_background_cleanup).start()
    return True

def capture_teacher_face(teacher_id, image_data=None):
    dataset_path = get_dataset_path() / str(teacher_id)
    dataset_path.mkdir(parents=True, exist_ok=True)
    
    frame = None
    if image_data:
        try:
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            img_bytes = base64.b64decode(image_data)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            return {"success": False, "error": f"Failed to decode base64: {e}"}
    elif recognition_service.camera and recognition_service.camera.is_opened():
        ret, frame = recognition_service.camera.get_frame()
        if not ret:
            frame = None
            
    if frame is None:
        return {"success": False, "error": "No camera frame or image data received"}
        
    timestamp = int(time.time() * 1000)
    file_path = dataset_path / f"{timestamp}.jpg"
    cv2.imwrite(str(file_path), frame)
    
    image_paths = list(dataset_path.glob("*.jpg")) + list(dataset_path.glob("*.png"))
    count = len(image_paths)
    update_teacher(teacher_id, {'face_count': count})
    
    return {
        "success": True, 
        "face_count": count, 
        "message": f"Faculty sample #{count} captured"
    }

def train_teacher_model(teacher_id, image_urls=None):
    frames_to_encode = []
    
    if image_urls and len(image_urls) > 0:
        frames_to_encode.extend(download_supabase_images(teacher_id, image_urls))
        
    dataset_path = get_dataset_path() / str(teacher_id)
    image_paths = []
    
    # Only use local disk images if no supabase images were provided
    if not frames_to_encode:
        image_paths = list(dataset_path.glob("*.jpg")) + list(dataset_path.glob("*.png")) + list(dataset_path.glob("*.jpeg"))
    
    if not frames_to_encode and not image_paths:
        t_data = get_teacher(teacher_id) or {}
        avatar_url = t_data.get('avatar_url')
        if avatar_url and avatar_url.startswith('http'):
            frames_to_encode.extend(download_supabase_images(teacher_id, [avatar_url]))
            
    if not frames_to_encode and not image_paths:
        return {"success": False, "error": f"No face samples found on disk or Supabase for faculty {teacher_id}."}
        
    try:
        # Encode local files if any exist
        encodings = []
        if image_paths:
            encodings.extend(encoder.compute_representative_encodings([str(p) for p in image_paths]))
            
        # Encode in-memory Supabase frames
        if frames_to_encode:
            encodings.extend(encoder.compute_encodings_from_frames(frames_to_encode))
            
        if not encodings:
            return {"success": False, "error": "Could not detect clear facial landmarks in captured photos."}
            
        db = get_db()
        encodings_ref = db.collection('teachers').document(teacher_id).collection('encodings')
        for doc in encodings_ref.stream():
            doc.reference.delete()
            
        for enc in encodings:
            encodings_ref.add({
                'encoding': enc.tolist() if isinstance(enc, np.ndarray) else list(enc),
                'created_at': datetime.datetime.now()
            })
            
        update_teacher(teacher_id, {'encodings_count': len(encodings), 'is_trained': True})
        
        # VERY IMPORTANT: Reload AI models in memory so live scanner works instantly
        try:
            recognition_service.sync_all()
        except Exception as e:
            logger.warning(f"Failed to sync recognition models: {e}")
            
        t_data = get_teacher(teacher_id) or {}
        t_name = t_data.get('name', teacher_id)
        
        if recognition_service.recognizer:
            recognition_service.recognizer.add_student(teacher_id, t_name, encodings)
            
        logger.info(f"Auto-trained AI model for faculty {t_name} ({teacher_id}) with {len(encodings)} embeddings.")
        return {
            "success": True,
            "encodings_count": len(encodings),
            "message": f"AI model successfully trained on {len(encodings)} facial embeddings for {t_name}!"
        }
    except Exception as e:
        logger.error(f"Error training model for teacher {teacher_id}: {e}")
        return {"success": False, "error": str(e)}

def update_teacher_salary(teacher_id, salary_data):
    """Updates base monthly salary and hourly rate for a teacher"""
    salary = float(salary_data.get('salary', 85000.0))
    hourly_rate = float(salary_data.get('hourly_rate', salary / (26 * 8)))
    return update_teacher(teacher_id, {
        'salary': salary,
        'hourly_rate': round(hourly_rate, 2),
        'currency': 'PKR'
    })

def calculate_teacher_payroll(teacher_id=None, month=None):
    """
    Calculates salary for faculty based on base monthly salary,
    duty duration (8-hour requirement), early checkouts, and half days.
    """
    db = get_db()
    now = datetime.datetime.now()
    month_str = month or now.strftime('%Y-%m') # e.g. '2026-08'
    
    if teacher_id:
        t = get_teacher(teacher_id)
        teachers_list = [t] if t else []
    else:
        teachers_list = get_all_teachers()
        
    # Fetch all teacher attendance records
    attendance_query = db.collection('attendance').where('person_type', '==', 'teacher').stream()
    all_records = [doc.to_dict() for doc in attendance_query]
    
    # Filter records for the specified month
    month_records = [r for r in all_records if str(r.get('date', '')).startswith(month_str)]
    
    payroll_results = []
    
    for t in teachers_list:
        t_id = t.get('teacher_id') or t.get('id')
        base_salary = float(t.get('salary') or 85000.0)
        total_working_days = 26  # Standard working days per month
        daily_rate = round(base_salary / float(total_working_days), 2)
        hourly_rate = round(daily_rate / 8.0, 2)
        
        # Get this teacher's attendance records
        t_records = [r for r in month_records if r.get('student_id') == t_id]
        
        full_days = 0
        half_days = 0
        total_worked_hours = 0.0
        early_checkout_records = []
        
        for r in t_records:
            dur_mins = r.get('duration_minutes')
            status = r.get('status', 'Present')
            
            # 8-hour duty rule: if duty duration < 480 minutes (8 hours) -> Half Day
            is_half_day = status == 'Half Day' or (dur_mins is not None and dur_mins < 480.0)
            
            if is_half_day:
                half_days += 1
                dur_h = round(float(dur_mins or 0) / 60.0, 1) if dur_mins is not None else 4.0
                early_checkout_records.append({
                    'date': r.get('date'),
                    'check_in': r.get('check_in_time', '--:--'),
                    'check_out': r.get('check_out_time', '--:--'),
                    'duration_hours': dur_h,
                    'status': 'Half Day',
                    'deduction_amount': round(daily_rate * 0.5, 2)
                })
            else:
                full_days += 1
                
            if dur_mins is not None:
                total_worked_hours += round(float(dur_mins) / 60.0, 1)
            else:
                total_worked_hours += 8.0
                
        # Deductions: 50% daily rate per half day
        half_day_deductions = round(half_days * (daily_rate * 0.5), 2)
        
        # Net Salary to pay = Base Salary - Half Day Deductions
        net_salary = max(0.0, round(base_salary - half_day_deductions, 2))
        
        payroll_results.append({
            'teacher_id': t_id,
            'name': t.get('name', 'Faculty Member'),
            'email': t.get('email', ''),
            'department': t.get('department', 'General'),
            'base_salary': base_salary,
            'daily_rate': daily_rate,
            'hourly_rate': hourly_rate,
            'total_working_days': total_working_days,
            'attended_days': len(t_records),
            'full_days': full_days,
            'half_days': half_days,
            'total_worked_hours': round(total_worked_hours, 1),
            'half_day_deductions': half_day_deductions,
            'net_salary': net_salary,
            'early_checkouts': early_checkout_records,
            'month': month_str
        })
        
    return payroll_results
