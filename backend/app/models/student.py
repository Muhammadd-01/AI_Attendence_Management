from app.database.connection import get_db
import datetime
import numpy as np

def create_student(student_id, name, email, class_name, course, status='active', password='student123'):
    db = get_db()
    data = {
        'student_id': student_id,
        'name': name,
        'email': email,
        'password': password,
        'class_name': class_name,
        'course': course,
        'status': status,
        'face_count': 0,
        'encodings_count': 0,
        'registered_at': datetime.datetime.now(),
        'updated_at': datetime.datetime.now()
    }
    db.collection('students').document(student_id).set(data)
    return data

def get_student(student_id):
    db = get_db()
    doc = db.collection('students').document(student_id).get()
    if doc.exists:
        return doc.to_dict()
    return None

def get_all_students(status=None, class_name=None, search=None):
    db = get_db()
    query = db.collection('students')
    
    if status:
        query = query.where('status', '==', status)
    if class_name:
        query = query.where('class_name', '==', class_name)
        
    docs = query.stream()
    students = []
    
    for doc in docs:
        data = doc.to_dict()
        if search:
            search_lower = search.lower()
            if (search_lower in data.get('name', '').lower() or
                search_lower in data.get('student_id', '').lower() or
                search_lower in data.get('email', '').lower()):
                students.append(data)
        else:
            students.append(data)
            
    return students

def update_student(student_id, data):
    db = get_db()
    data['updated_at'] = datetime.datetime.now()
    db.collection('students').document(student_id).update(data)
    return get_student(student_id)

def deactivate_student(student_id):
    db = get_db()
    db.collection('students').document(student_id).update({
        'status': 'inactive',
        'updated_at': datetime.datetime.now()
    })
    return True

def delete_student(student_id):
    db = get_db()
    delete_encodings(student_id)
    db.collection('students').document(student_id).delete()
    
    # Cascade delete all attendance records for this student
    try:
        att_docs = db.collection('attendance').where('student_id', '==', student_id).stream()
        for doc in att_docs:
            doc.reference.delete()
    except Exception as e:
        pass
        
    return True

def update_face_count(student_id, count):
    db = get_db()
    db.collection('students').document(student_id).update({
        'face_count': count,
        'updated_at': datetime.datetime.now()
    })

def get_student_count():
    db = get_db()
    docs = db.collection('students').stream()
    return len(list(docs))

def get_active_students():
    db = get_db()
    docs = db.collection('students').where('status', '==', 'active').stream()
    return [doc.to_dict() for doc in docs]

def search_students(query):
    return get_all_students(search=query)

def save_encodings(student_id, encodings_list):
    db = get_db()
    encodings_ref = db.collection('students').document(student_id).collection('encodings')
    delete_encodings(student_id)
    
    count = 0
    for enc in encodings_list:
        if isinstance(enc, np.ndarray):
            enc_list = enc.tolist()
        else:
            enc_list = list(enc)
            
        encodings_ref.add({
            'encoding': enc_list,
            'created_at': datetime.datetime.now()
        })
        count += 1
        
    db.collection('students').document(student_id).update({
        'encodings_count': count,
        'updated_at': datetime.datetime.now()
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
                'class_name': student.get('class_name', ''),
                'encodings': encodings,
                'role': 'student'
            }
            
    # Also load active faculty/teachers encodings
    try:
        teacher_docs = list(db.collection('teachers').where('status', '==', 'active').stream())
        for t_doc in teacher_docs:
            t_data = t_doc.to_dict()
            t_id = t_data.get('teacher_id') or t_doc.id
            t_encs_docs = list(db.collection('teachers').document(t_id).collection('encodings').stream())
            t_encs = [np.array(e.to_dict()['encoding']) for e in t_encs_docs if 'encoding' in e.to_dict()]
            if t_encs:
                result[t_id] = {
                    'name': t_data.get('name', 'Faculty Member'),
                    'class_name': t_data.get('assigned_class', ''),
                    'encodings': t_encs,
                    'role': 'teacher'
                }
    except Exception:
        pass

    return result

def delete_encodings(student_id):
    db = get_db()
    encodings_ref = db.collection('students').document(student_id).collection('encodings')
    docs = encodings_ref.stream()
    for doc in docs:
        doc.reference.delete()
    
    student_ref = db.collection('students').document(student_id)
    if student_ref.get().exists:
        student_ref.update({
            'encodings_count': 0,
            'updated_at': datetime.datetime.now()
        })
