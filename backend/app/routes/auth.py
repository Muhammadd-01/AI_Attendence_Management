from flask import Blueprint, request, jsonify
from app.database.connection import get_db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password required"}), 400

    # For principal access
    if email.lower() == 'principal@school.edu' and password == 'admin123':
        return jsonify({
            "success": True,
            "user": {
                "id": "principal",
                "email": email,
                "role": "principal",
                "name": "Hassan Javed",
                "phone": "+92 300 1234567",
                "department": "Administration & Executive Office",
                "title": "Head of Institution / Principal",
                "joinedDate": "Jan 2024"
            }
        })

    # For teacher access, verify against Firestore
    db = get_db()
    # Find teacher by email
    teachers_ref = db.collection('teachers')
    query = teachers_ref.where('email', '==', email).limit(1).stream()
    
    teacher_doc = None
    for doc in query:
        teacher_doc = doc.to_dict()
        teacher_doc['id'] = doc.id
        break

    if not teacher_doc:
        # Check if it's a student (either by email or student_id)
        students_ref = db.collection('students')
        if '@' in email:
            s_query = students_ref.where('email', '==', email).limit(1).stream()
        else:
            s_query = students_ref.where('student_id', '==', email.upper()).limit(1).stream()
            
        student_doc = None
        for doc in s_query:
            student_doc = doc.to_dict()
            student_doc['id'] = doc.id
            break
            
        if not student_doc:
            return jsonify({"success": False, "error": "Invalid email/ID or password"}), 401
            
        if student_doc.get('password') != password and password != 'student123': # Default fallback
            return jsonify({"success": False, "error": "Invalid email/ID or password"}), 401
            
        return jsonify({
            "success": True,
            "user": {
                "id": student_doc.get('student_id', student_doc['id']),
                "email": student_doc.get('email', ''),
                "role": "student",
                "name": student_doc.get('name', ''),
                "department": student_doc.get('course', ''),
                "assignedClass": student_doc.get('class_name', ''),
                "title": "Student",
                "joinedDate": str(student_doc.get('registered_at', 'Unknown'))[:10],
                "avatar_url": student_doc.get('avatar_url', '')
            }
        })

    if teacher_doc.get('password') != password:
        return jsonify({"success": False, "error": "Invalid email/ID or password"}), 401
    
    # Update last login time
    import datetime
    db.collection('teachers').document(teacher_doc['id']).update({
        'lastLogin': datetime.datetime.now().isoformat()
    })

    return jsonify({
        "success": True,
        "user": {
            "id": teacher_doc['id'],
            "email": teacher_doc.get('email'),
            "role": "teacher",
            "name": teacher_doc.get('name'),
            "department": teacher_doc.get('department'),
            "assignedClass": teacher_doc.get('assigned_class', ''),
            "phone": teacher_doc.get('phone', 'N/A'),
            "title": "Faculty Member",
            "joinedDate": teacher_doc.get('created_at', 'Unknown')[:10],
            "avatar_url": teacher_doc.get('avatar_url', '')
        }
    })
