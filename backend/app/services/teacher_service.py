from app.database.connection import get_db
import datetime

def get_all_teachers():
    db = get_db()
    docs = db.collection('teachers').stream()
    return [{**doc.to_dict(), 'id': doc.id} for doc in docs]

def get_teacher(teacher_id):
    db = get_db()
    doc = db.collection('teachers').document(teacher_id).get()
    if doc.exists:
        return {**doc.to_dict(), 'id': doc.id}
    return None

def create_teacher(data):
    db = get_db()
    doc_ref = db.collection('teachers').document()
    
    teacher_data = {
        'name': data.get('name', ''),
        'email': data.get('email', ''),
        'password': data.get('password', ''),
        'status': data.get('status', 'active'),
        'lastLogin': data.get('lastLogin', 'Never'),
        'created_at': datetime.datetime.utcnow().isoformat(),
        'updated_at': datetime.datetime.utcnow().isoformat()
    }
    
    doc_ref.set(teacher_data)
    return {**teacher_data, 'id': doc_ref.id}

def update_teacher(teacher_id, data):
    db = get_db()
    doc_ref = db.collection('teachers').document(teacher_id)
    update_data = data.copy()
    update_data['updated_at'] = datetime.datetime.utcnow().isoformat()
    doc_ref.update(update_data)
    return get_teacher(teacher_id)

def delete_teacher(teacher_id):
    db = get_db()
    db.collection('teachers').document(teacher_id).delete()
    return True
