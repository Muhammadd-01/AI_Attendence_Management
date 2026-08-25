import csv
import datetime
from io import StringIO
from app.models import student, attendance

def get_dashboard_stats():
    total_students = student.get_student_count()
    present_today = attendance.get_present_count_today()
    absent_today = attendance.get_absent_count_today()
    
    attendance_rate = 0
    if total_students and total_students > 0:
        attendance_rate = round((present_today / total_students) * 100, 1)
        
    return {
        "total_students": total_students or 0,
        "present_today": present_today or 0,
        "absent_today": absent_today or 0,
        "attendance_rate": attendance_rate
    }

def get_anomalies():
    # Students with < 75% attendance or consecutive absences
    anomalies = []
    active_students = student.get_active_students()
    
    if not active_students:
        return anomalies
        
    for s in active_students:
        student_id = s.get('student_id') or s.get('id')
        attendance_pct = attendance.get_student_attendance_percentage(student_id)
        
        reasons = []
        if attendance_pct is not None and attendance_pct < 75.0 and attendance_pct > 0:
            reasons.append(f"Low overall attendance ({attendance_pct}%)")
            
        history = attendance.get_student_attendance(student_id)
        if history and len(history) >= 3:
            consecutive_absences = sum(1 for record in history[:3] if record.get('status') == 'Absent')
            if consecutive_absences >= 3:
                reasons.append("3+ consecutive absences detected")
                
        if reasons:
            anomalies.append({
                "student_id": student_id,
                "student_name": s.get('name', 'Student'),
                "class_name": s.get('class_name', 'General'),
                "attendance_rate": attendance_pct,
                "reasons": reasons
            })
            
    return anomalies

def get_class_statistics():
    all_students = student.get_all_students()
    classes = {}
    
    for s in all_students:
        c_name = s.get('class_name', 'CS-401')
        if c_name not in classes:
            classes[c_name] = {'total_students': 0, 'present_sum': 0, 'attendance_pct_sum': 0}
        classes[c_name]['total_students'] += 1
        pct = attendance.get_student_attendance_percentage(s.get('student_id', s.get('id')))
        classes[c_name]['attendance_pct_sum'] += (pct or 0)
        
    results = []
    for c_name, data in classes.items():
        tot = data['total_students']
        avg_rate = round(data['attendance_pct_sum'] / max(tot, 1), 1)
        results.append({
            'class_name': c_name,
            'students_count': tot,
            'average_rate': avg_rate
        })
        
    return results

def get_attendance_distribution():
    today_records = attendance.get_today_attendance()
    if not today_records:
        # Fallback to last 30 days totals
        stats = attendance.get_attendance_stats(days=30)
        p = sum(v.get('Present', 0) for v in stats.values())
        l = sum(v.get('Late', 0) for v in stats.values())
        a = sum(v.get('Absent', 0) for v in stats.values())
        return {'present': p, 'late': l, 'absent': a}
        
    p = sum(1 for r in today_records if r.get('status') == 'Present')
    l = sum(1 for r in today_records if r.get('status') == 'Late')
    a = sum(1 for r in today_records if r.get('status') == 'Absent')
    return {'present': p, 'late': l, 'absent': a}

def get_full_analytics():
    stats = get_dashboard_stats()
    classes = get_class_statistics()
    distribution = get_attendance_distribution()
    anomalies = get_anomalies()
    
    # Top absent students
    all_students = student.get_all_students()
    student_scores = []
    for s in all_students:
        sid = s.get('student_id', s.get('id'))
        pct = attendance.get_student_attendance_percentage(sid)
        history = attendance.get_student_attendance(sid)
        absences = sum(1 for r in history if r.get('status') == 'Absent')
        student_scores.append({
            'student_id': sid,
            'name': s.get('name'),
            'class_name': s.get('class_name'),
            'attendance_rate': pct,
            'absences': absences
        })
        
    student_scores.sort(key=lambda x: x['absences'], reverse=True)
    
    return {
        'stats': stats,
        'classes': classes,
        'distribution': distribution,
        'anomalies': anomalies,
        'most_absent': student_scores[:10]
    }
