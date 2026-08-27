from app.database.connection import get_db
import datetime
from app.config import Config

def check_in(student_id, student_name, confidence, session_id=None, person_type=None):
    db = get_db()
    now = datetime.datetime.now()
    date_str = now.strftime('%Y-%m-%d')
    time_str = now.strftime('%H:%M:%S')
    
    # Auto-detect person_type if not explicitly provided
    if not person_type:
        if str(student_id).startswith('TCH') or str(student_id).startswith('T-') or 'teacher' in str(student_id).lower():
            person_type = 'teacher'
        else:
            person_type = 'student'

    # Determine if late
    status = 'Present'
    if session_id:
        session_doc = db.collection('attendance_sessions').document(session_id).get()
        if session_doc.exists:
            session_data = session_doc.to_dict()
            start_time = session_data.get('start_time')
            if start_time:
                if isinstance(start_time, str):
                    try:
                        start_time = datetime.datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    except ValueError:
                        pass
                
                if isinstance(start_time, datetime.datetime):
                    if start_time.tzinfo is not None:
                        start_time = start_time.replace(tzinfo=None)
                        
                    time_diff = now - start_time
                    if time_diff.total_seconds() > (Config.LATE_THRESHOLD_MINUTES * 60):
                        status = 'Late'

    data = {
        'student_id': student_id,
        'student_name': student_name,
        'person_type': person_type, # 'teacher' or 'student'
        'role': person_type,
        'date': date_str,
        'status': status,
        'check_in_time': time_str,
        'check_out_time': None,
        'duration_minutes': None,
        'confidence': float(confidence),
        'session_id': session_id,
        'demo_data': False,
        'created_at': now,
        'updated_at': now
    }
    
    doc_ref = db.collection('attendance').document()
    doc_ref.set(data)
    
    result = data.copy()
    result['id'] = doc_ref.id
    return result

def check_out(student_id, date=None):
    db = get_db()
    now = datetime.datetime.now()
    date_str = date or now.strftime('%Y-%m-%d')
    time_str = now.strftime('%H:%M:%S')
    
    query = db.collection('attendance').where('student_id', '==', student_id).where('date', '==', date_str).limit(1)
    docs = list(query.stream())
    
    if not docs:
        return None
        
    doc = docs[0]
    data = doc.to_dict()
        
    check_in_time_str = data.get('check_in_time')
    duration_minutes = None
    if check_in_time_str:
        try:
            in_time = datetime.datetime.strptime(check_in_time_str, '%H:%M:%S')
            out_time = datetime.datetime.strptime(time_str, '%H:%M:%S')
            duration = out_time - in_time
            duration_minutes = round(duration.total_seconds() / 60.0, 2)
        except ValueError:
            pass
            
    is_teacher = str(student_id).startswith('TCH') or str(student_id).startswith('T-') or data.get('person_type') == 'teacher' or data.get('role') == 'teacher'
    
    status = data.get('status', 'Present')
    # If faculty / teacher didn't complete 8 hours (480 minutes) of duty upon checkout, mark as 'Half Day'
    if is_teacher and duration_minutes is not None:
        if duration_minutes < 480.0:  # 8 hours = 480 minutes
            status = 'Half Day'
        else:
            status = 'Present' # if they check out again and now have > 8 hours, it should change from Half Day to Present

    update_data = {
        'check_out_time': time_str,
        'duration_minutes': duration_minutes,
        'status': status,
        'updated_at': now
    }
    
    doc.reference.update(update_data)
    
    data.update(update_data)
    data['id'] = doc.id
    return data

def get_today_attendance(person_type=None):
    db = get_db()
    date_str = datetime.datetime.now().strftime('%Y-%m-%d')
    records = get_attendance_by_date(date_str)
    if person_type:
        records = [r for r in records if r.get('person_type') == person_type or (person_type == 'teacher' and str(r.get('student_id','')).startswith('TCH')) or (person_type == 'student' and not str(r.get('student_id','')).startswith('TCH'))]
    return records

def get_attendance_by_date(date_str):
    db = get_db()
    query = db.collection('attendance').where('date', '==', date_str)
    docs = query.stream()
    results = []
    seen = {}
    
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        if 'person_type' not in data:
            data['person_type'] = 'teacher' if str(data.get('student_id', '')).startswith('TCH') else 'student'
            
        # Deduplicate: only keep the most recently updated/created document per person per day
        s_id = data.get('student_id')
        if s_id:
            if s_id not in seen or str(data.get('updated_at', data.get('created_at', ''))) > str(seen[s_id].get('updated_at', seen[s_id].get('created_at', ''))):
                seen[s_id] = data
        else:
            results.append(data)
            
    results.extend(seen.values())
    results.sort(key=lambda x: str(x.get('created_at', '')), reverse=True)
    return results

def get_student_attendance(student_id, start_date=None, end_date=None):
    db = get_db()
    query = db.collection('attendance').where('student_id', '==', student_id)
    
    if start_date:
        query = query.where('date', '>=', start_date)
    if end_date:
        query = query.where('date', '<=', end_date)
        
    docs = query.stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        results.append(data)
        
    results.sort(key=lambda x: str(x.get('date', '')), reverse=True)
    return results

def get_attendance_history(page=1, per_page=20, student_id=None, date=None, status=None, class_name=None, person_type=None):
    db = get_db()
    query = db.collection('attendance')
    
    if student_id:
        query = query.where('student_id', '==', student_id)
    if date:
        query = query.where('date', '==', date)
    if status:
        query = query.where('status', '==', status)
        
    docs = list(query.stream())
    
    results = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        if 'person_type' not in data:
            data['person_type'] = 'teacher' if str(data.get('student_id', '')).startswith('TCH') else 'student'
        results.append(data)
        
    results.sort(key=lambda x: str(x.get('created_at', '')), reverse=True)
    
    if person_type and person_type != 'all':
        results = [r for r in results if r.get('person_type') == person_type or (person_type == 'teacher' and str(r.get('student_id','')).startswith('TCH')) or (person_type == 'student' and not str(r.get('student_id','')).startswith('TCH'))]
        
    total = len(results)
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated_results = results[start:end]
    
    return {
        'records': paginated_results,
        'total': total,
        'page': page,
        'per_page': per_page
    }

def is_checked_in_today(student_id):
    db = get_db()
    date_str = datetime.datetime.now().strftime('%Y-%m-%d')
    query = db.collection('attendance').where('student_id', '==', student_id).where('date', '==', date_str).limit(1)
    return len(list(query.stream())) > 0

def is_checked_out_today(student_id):
    db = get_db()
    date_str = datetime.datetime.now().strftime('%Y-%m-%d')
    query = db.collection('attendance').where('student_id', '==', student_id).where('date', '==', date_str).limit(1)
    docs = list(query.stream())
    
    if not docs:
        return False
        
    data = docs[0].to_dict()
    return data.get('check_out_time') is not None

def mark_absent(student_id, student_name, date_str=None, session_id=None, person_type='student'):
    db = get_db()
    now = datetime.datetime.now()
    date_str = date_str or now.strftime('%Y-%m-%d')
    
    data = {
        'student_id': student_id,
        'student_name': student_name,
        'person_type': person_type,
        'date': date_str,
        'status': 'Absent',
        'check_in_time': None,
        'check_out_time': None,
        'duration_minutes': 0,
        'confidence': 0.0,
        'session_id': session_id,
        'demo_data': False,
        'created_at': now,
        'updated_at': now
    }
    
    doc_ref = db.collection('attendance').document()
    doc_ref.set(data)
    
    result = data.copy()
    result['id'] = doc_ref.id
    return result

def get_present_count_today(person_type='student'):
    today_records = get_today_attendance(person_type=person_type)
    return len([r for r in today_records if r.get('status') in ['Present', 'Late']])

def get_absent_count_today(person_type='student'):
    today_records = get_today_attendance(person_type=person_type)
    return len([r for r in today_records if r.get('status') == 'Absent'])

def finalize_session(session_id=None):
    db = get_db()
    students_query = db.collection('students').where('status', '==', 'active')
    active_students = list(students_query.stream())
    
    marked_absent = []
    total_present = 0
    total_absent = 0
    
    for doc in active_students:
        student = doc.to_dict()
        s_id = student.get('student_id')
        s_name = student.get('name')
        
        if is_checked_in_today(s_id):
            total_present += 1
        else:
            mark_absent(s_id, s_name, session_id=session_id, person_type='student')
            marked_absent.append(s_name)
            total_absent += 1
            
    return {
        'marked_absent': marked_absent,
        'total_present': total_present,
        'total_absent': total_absent
    }

def get_attendance_stats(days=30, person_type='student', role=None, assigned_class=None):
    db = get_db()
    now = datetime.datetime.now()
    start_date = (now - datetime.timedelta(days=days)).strftime('%Y-%m-%d')
    
    query = db.collection('attendance').where('date', '>=', start_date)
    docs = list(query.stream())
    
    # Pre-fetch students for class filtering
    students_in_class = []
    if role == 'teacher' and assigned_class:
        from app.models.student import get_active_students
        students_in_class = [s.get('student_id') for s in get_active_students() if s.get('class_name') == assigned_class]
    
    stats_by_date = {}
    for doc in docs:
        data = doc.to_dict()
        
        # If teacher viewing, filter by their assigned class
        if role == 'teacher' and assigned_class:
            if data.get('student_id') not in students_in_class:
                continue
        elif role == 'principal':
            # Principal sees everyone
            pass
        elif person_type and person_type != 'all':
            p_type = data.get('person_type') or ('teacher' if str(data.get('student_id','')).startswith('TCH') else 'student')
            if p_type != person_type:
                continue
                
        date = data.get('date')
        status = data.get('status')
        
        if date not in stats_by_date:
            stats_by_date[date] = {'present': 0, 'absent': 0, 'late': 0}
            
        if status == 'Present':
            stats_by_date[date]['present'] += 1
        elif status == 'Absent':
            stats_by_date[date]['absent'] += 1
        elif status == 'Late':
            stats_by_date[date]['late'] += 1
            
    return stats_by_date

def get_student_attendance_percentage(student_id, days=30):
    records = get_student_attendance(student_id)
    if not records:
        return 0.0
        
    present_count = len([r for r in records if r.get('status') in ['Present', 'Late']])
    return round((present_count / len(records)) * 100, 2)

def create_session(classroom_name=None):
    db = get_db()
    now = datetime.datetime.now()
    
    data = {
        'classroom_name': classroom_name or Config.CLASSROOM_NAME,
        'start_time': now,
        'end_time': None,
        'status': 'active',
        'created_at': now
    }
    
    doc_ref = db.collection('attendance_sessions').document()
    doc_ref.set(data)
    
    result = data.copy()
    result['session_id'] = doc_ref.id
    return result

def end_session(session_id):
    db = get_db()
    now = datetime.datetime.now()
    
    doc_ref = db.collection('attendance_sessions').document(session_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return None
        
    update_data = {
        'end_time': now,
        'status': 'ended'
    }
    
    doc_ref.update(update_data)
    data = doc.to_dict()
    data.update(update_data)
    data['session_id'] = doc.id
    return data

def get_active_session():
    db = get_db()
    query = db.collection('attendance_sessions').where('status', '==', 'active').limit(1)
    docs = list(query.stream())
    
    if not docs:
        return None
        
    data = docs[0].to_dict()
    data['session_id'] = docs[0].id
    return data
