from app.database.connection import get_db
import datetime
from app.config import Config

def check_in(student_id, student_name, confidence, session_id=None):
    db = get_db()
    now = datetime.datetime.utcnow()
    date_str = now.strftime('%Y-%m-%d')
    time_str = now.strftime('%H:%M:%S')
    
    # Determine if late
    status = 'Present'
    if session_id:
        session_doc = db.collection('attendance_sessions').document(session_id).get()
        if session_doc.exists:
            session_data = session_doc.to_dict()
            start_time = session_data.get('start_time')
            if start_time:
                # Convert to datetime if it's a string, or use directly if it's datetime
                if isinstance(start_time, str):
                    try:
                        start_time = datetime.datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    except ValueError:
                        pass
                
                if isinstance(start_time, datetime.datetime):
                    # Make start_time timezone naive for calculation
                    if start_time.tzinfo is not None:
                        start_time = start_time.replace(tzinfo=None)
                        
                    time_diff = now - start_time
                    if time_diff.total_seconds() > (Config.LATE_THRESHOLD_MINUTES * 60):
                        status = 'Late'

    data = {
        'student_id': student_id,
        'student_name': student_name,
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
    now = datetime.datetime.utcnow()
    date_str = date or now.strftime('%Y-%m-%d')
    time_str = now.strftime('%H:%M:%S')
    
    query = db.collection('attendance').where('student_id', '==', student_id).where('date', '==', date_str).limit(1)
    docs = list(query.stream())
    
    if not docs:
        return None
        
    doc = docs[0]
    data = doc.to_dict()
    
    if data.get('check_out_time'):
        return data  # Already checked out
        
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
            
    update_data = {
        'check_out_time': time_str,
        'duration_minutes': duration_minutes,
        'updated_at': now
    }
    
    doc.reference.update(update_data)
    
    data.update(update_data)
    data['id'] = doc.id
    return data

def get_today_attendance():
    db = get_db()
    date_str = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    return get_attendance_by_date(date_str)

def get_attendance_by_date(date_str):
    db = get_db()
    query = db.collection('attendance').where('date', '==', date_str).order_by('created_at', direction=firestore.Query.DESCENDING)
    docs = query.stream()
    
    results = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        results.append(data)
        
    return results

def get_student_attendance(student_id, start_date=None, end_date=None):
    db = get_db()
    query = db.collection('attendance').where('student_id', '==', student_id)
    
    if start_date:
        query = query.where('date', '>=', start_date)
    if end_date:
        query = query.where('date', '<=', end_date)
        
    query = query.order_by('date', direction=firestore.Query.DESCENDING)
    
    docs = query.stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        results.append(data)
        
    return results

def get_attendance_history(page=1, per_page=20, student_id=None, date=None, status=None, class_name=None):
    db = get_db()
    query = db.collection('attendance')
    
    if student_id:
        query = query.where('student_id', '==', student_id)
    if date:
        query = query.where('date', '==', date)
    if status:
        query = query.where('status', '==', status)
        
    # We can't filter by class_name easily unless we denormalize, assuming we don't for now or we filter post-query
    # For a real app, you'd denormalize class_name into the attendance doc.
    
    query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
    
    # Poor man's pagination (fetch all matching and slice, since firestore pagination requires cursors)
    docs = list(query.stream())
    
    results = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        results.append(data)
        
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
    date_str = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    query = db.collection('attendance').where('student_id', '==', student_id).where('date', '==', date_str).limit(1)
    return len(list(query.stream())) > 0

def is_checked_out_today(student_id):
    db = get_db()
    date_str = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    query = db.collection('attendance').where('student_id', '==', student_id).where('date', '==', date_str).limit(1)
    docs = list(query.stream())
    
    if not docs:
        return False
        
    data = docs[0].to_dict()
    return data.get('check_out_time') is not None

def mark_absent(student_id, student_name, date_str=None, session_id=None):
    db = get_db()
    now = datetime.datetime.utcnow()
    date_str = date_str or now.strftime('%Y-%m-%d')
    
    data = {
        'student_id': student_id,
        'student_name': student_name,
        'date': date_str,
        'status': 'Absent',
        'check_in_time': None,
        'check_out_time': None,
        'duration_minutes': None,
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

def get_present_count_today():
    records = get_today_attendance()
    return sum(1 for r in records if r.get('status') in ('Present', 'Late'))

def get_absent_count_today():
    records = get_today_attendance()
    return sum(1 for r in records if r.get('status') == 'Absent')

def finalize_session(session_id=None):
    from app.models.student import get_active_students
    
    db = get_db()
    date_str = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    
    # Get all active students
    active_students = get_active_students()
    
    # Get today's attendance
    today_records = get_attendance_by_date(date_str)
    checked_in_ids = {r.get('student_id') for r in today_records if r.get('status') in ('Present', 'Late')}
    
    marked_absent = []
    
    for student in active_students:
        sid = student['student_id']
        if sid not in checked_in_ids:
            # Check if they are already marked absent to prevent duplicates
            already_absent = any(r.get('student_id') == sid and r.get('status') == 'Absent' for r in today_records)
            if not already_absent:
                mark_absent(sid, student['name'], date_str, session_id)
                marked_absent.append(student['name'])
                
    # Also end the session if one was provided
    if session_id:
        end_session(session_id)
                
    return {
        'marked_absent': marked_absent,
        'total_present': len(checked_in_ids),
        'total_absent': len(marked_absent) + sum(1 for r in today_records if r.get('status') == 'Absent')
    }

def get_attendance_stats(days=30):
    db = get_db()
    
    end_date = datetime.datetime.utcnow()
    start_date = end_date - datetime.timedelta(days=days)
    
    start_str = start_date.strftime('%Y-%m-%d')
    
    query = db.collection('attendance').where('date', '>=', start_str).order_by('date')
    docs = list(query.stream())
    
    # Aggregate by date
    stats = {}
    for doc in docs:
        data = doc.to_dict()
        date = data['date']
        status = data['status']
        
        if date not in stats:
            stats[date] = {'Present': 0, 'Late': 0, 'Absent': 0, 'Total': 0}
            
        if status in stats[date]:
            stats[date][status] += 1
        stats[date]['Total'] += 1
        
    return stats

def get_student_attendance_percentage(student_id, days=30):
    db = get_db()
    
    end_date = datetime.datetime.utcnow()
    start_date = end_date - datetime.timedelta(days=days)
    
    start_str = start_date.strftime('%Y-%m-%d')
    
    query = db.collection('attendance').where('student_id', '==', student_id).where('date', '>=', start_str)
    docs = list(query.stream())
    
    total = len(docs)
    if total == 0:
        return 0.0
        
    present_or_late = sum(1 for doc in docs if doc.to_dict().get('status') in ('Present', 'Late'))
    
    return round((present_or_late / total) * 100, 2)

def create_session(classroom_name=None):
    db = get_db()
    now = datetime.datetime.utcnow()
    
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
    now = datetime.datetime.utcnow()
    
    doc_ref = db.collection('attendance_sessions').document(session_id)
    doc_ref.update({
        'end_time': now,
        'status': 'completed'
    })
    
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        data['session_id'] = doc.id
        return data
    return None

def get_active_session():
    db = get_db()
    query = db.collection('attendance_sessions').where('status', '==', 'active').order_by('start_time', direction=firestore.Query.DESCENDING).limit(1)
    docs = list(query.stream())
    
    if docs:
        data = docs[0].to_dict()
        data['session_id'] = docs[0].id
        return data
    return None

from firebase_admin import firestore
