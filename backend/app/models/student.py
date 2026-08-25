from app.database.connection import get_db
import datetime
import numpy as np

def create_student(student_id, name, email, class_name, course):
    db = get_db()
    
    student_data = {
        'student_id': student_id,
        'name': name,
        'email': email,
        'class_name': class_name,
        'course': course,
        'status': 'active',
        'face_count': 0,
        'encodings_count': 0,
        'registered_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow()
    }
    
    db.collection('students').document(student_id).set(student_data)
    return student_data

def get_student(student_id):
    db = get_db()
    doc = db.collection('students').document(student_id).get()
    
    if doc.exists:
        data = doc.to_dict()
        # Convert datetimes to strings if they exist, to ensure they can be JSON serialized later if needed,
        # but typically this is done at the API level. We'll leave them as is for now.
        return data
    return None

def get_all_students(status=None, class_name=None, search=None):
    db = get_db()
    query = db.collection('students')
    
    if status:
        query = query.where('status', '==', status)
    if class_name:
        query = query.where('class_name', '==', class_name)
        
    docs = query.stream()
    students = [doc.to_dict() for doc in docs]
    
    if search:
        search_lower = search.lower()
        students = [
            s for s in students 
            if search_lower in s.get('name', '').lower() 
            or search_lower in s.get('email', '').lower() 
            or search_lower in s.get('student_id', '').lower()
        ]
        
    return students

def update_student(student_id, data):
    db = get_db()
    doc_ref = db.collection('students').document(student_id)
    
    if not doc_ref.get().exists:
        return None
        
    update_data = data.copy()
    update_data['updated_at'] = datetime.datetime.utcnow()
    
    doc_ref.update(update_data)
    
    return doc_ref.get().to_dict()

def deactivate_student(student_id):
    db = get_db()
    doc_ref = db.collection('students').document(student_id)
    if doc_ref.get().exists:
        doc_ref.update({
            'status': 'inactive',
            'updated_at': datetime.datetime.utcnow()
        })
        return True
    return False

def delete_student(student_id):
    db = get_db()
    doc_ref = db.collection('students').document(student_id)
    if doc_ref.get().exists:
        # Also delete encodings subcollection
        delete_encodings(student_id)
        doc_ref.delete()
        return True
    return False

def update_face_count(student_id, count):
    db = get_db()
    db.collection('students').document(student_id).update({
        'face_count': count,
        'updated_at': datetime.datetime.utcnow()
    })

def get_student_count():
    db = get_db()
    # Getting the count without fetching all documents (using aggregation query if possible, or just length)
    # Using simple fetch for simplicity in this case as it's not a huge dataset
    return len(list(db.collection('students').stream()))

def get_active_students():
    return get_all_students(status='active')

def search_students(query):
    return get_all_students(search=query)

def save_encodings(student_id, encodings_list):
    db = get_db()
    
    # Get reference to the student's encodings subcollection
    encodings_ref = db.collection('students').document(student_id).collection('encodings')
    
    # First, optionally clear existing encodings
    delete_encodings(student_id)
    
    count = 0
    for enc in encodings_list:
        if isinstance(enc, np.ndarray):
            enc_list = enc.tolist()
        else:
            enc_list = list(enc)
            
        encodings_ref.add({
            'encoding': enc_list,
            'created_at': datetime.datetime.utcnow()
        })
        count += 1
        
    # Update the student document with the new count
    db.collection('students').document(student_id).update({
        'encodings_count': count,
        'updated_at': datetime.datetime.utcnow()
    })

def get_encodings(student_id):
    db = get_db()
    encodings_ref = db.collection('students').document(student_id).collection('encodings')
    docs = encodings_ref.stream()
    
    encodings_list = []
    for doc in docs:
        data = doc.to_dict()
        if 'encoding' in data:
            encodings_list.append(np.array(data['encoding']))
            
    return encodings_list

def get_all_encodings():
    db = get_db()
    active_students = get_active_students()
    
    result = {}
    for student in active_students:
        student_id = student['student_id']
        encodings = get_encodings(student_id)
        if encodings:
            result[student_id] = {
                'name': student['name'],
                'encodings': encodings
            }
            
    return result

def delete_encodings(student_id):
    db = get_db()
    encodings_ref = db.collection('students').document(student_id).collection('encodings')
    docs = encodings_ref.stream()
    for doc in docs:
        doc.reference.delete()
    
    # Reset count
    student_ref = db.collection('students').document(student_id)
    if student_ref.get().exists:
        student_ref.update({
            'encodings_count': 0,
            'updated_at': datetime.datetime.utcnow()
        })
