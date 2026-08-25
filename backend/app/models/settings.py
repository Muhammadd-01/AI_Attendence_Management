from app.database.connection import get_db
import datetime

DEFAULT_SETTINGS = {
    'face_match_threshold': 0.55,
    'recognition_cooldown': 30,
    'session_duration': 60,
    'camera_index': 0,
    'classroom_name': 'Classroom A',
    'late_threshold': 15,
    'frame_process_interval': 5,
}

def get_settings():
    db = get_db()
    doc = db.collection('settings').document('app_settings').get()
    
    settings = DEFAULT_SETTINGS.copy()
    if doc.exists:
        stored = doc.to_dict()
        if stored:
            settings.update(stored)
            
    return settings

def update_settings(data):
    db = get_db()
    
    # Only allow keys that are in DEFAULT_SETTINGS
    filtered_data = {k: v for k, v in data.items() if k in DEFAULT_SETTINGS}
    
    if filtered_data:
        filtered_data['updated_at'] = datetime.datetime.utcnow()
        db.collection('settings').document('app_settings').set(filtered_data, merge=True)
        
    return get_settings()

def get_setting(key):
    settings = get_settings()
    return settings.get(key, DEFAULT_SETTINGS.get(key))

def reset_settings():
    db = get_db()
    db.collection('settings').document('app_settings').set(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
