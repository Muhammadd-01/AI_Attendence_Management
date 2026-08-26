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

_cached_settings = None

def get_settings():
    global _cached_settings
    if _cached_settings is not None:
        return _cached_settings.copy()
        
    try:
        db = get_db()
        doc = db.collection('settings').document('app_settings').get()
        settings = DEFAULT_SETTINGS.copy()
        if doc.exists:
            stored = doc.to_dict()
            if stored:
                settings.update(stored)
        _cached_settings = settings
        return settings
    except Exception:
        return DEFAULT_SETTINGS.copy()

def update_settings(data):
    global _cached_settings
    current = get_settings()
    current.update({k: v for k, v in data.items() if k in DEFAULT_SETTINGS})
    _cached_settings = current
    
    try:
        db = get_db()
        filtered_data = {k: v for k, v in data.items() if k in DEFAULT_SETTINGS}
        if filtered_data:
            filtered_data['updated_at'] = datetime.datetime.now()
            db.collection('settings').document('app_settings').set(filtered_data, merge=True)
    except Exception:
        pass
        
    return _cached_settings.copy()

def get_setting(key):
    settings = get_settings()
    return settings.get(key, DEFAULT_SETTINGS.get(key))

def reset_settings():
    global _cached_settings
    _cached_settings = DEFAULT_SETTINGS.copy()
    try:
        db = get_db()
        db.collection('settings').document('app_settings').set(DEFAULT_SETTINGS)
    except Exception:
        pass
    return DEFAULT_SETTINGS.copy()
