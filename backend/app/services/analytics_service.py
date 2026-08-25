import csv
from io import StringIO
from app.models import student, attendance

def get_dashboard_stats():
    total_students = student.get_student_count()
    present_today = attendance.get_present_count_today()
    absent_today = attendance.get_absent_count_today()
    
    attendance_rate = 0
    if total_students and total_students > 0:
        attendance_rate = (present_today / total_students) * 100
        
    return {
        "total_students": total_students or 0,
        "present_today": present_today or 0,
        "absent_today": absent_today or 0,
        "attendance_rate": attendance_rate
    }

def get_anomalies():
    # Students with < 75% attendance or 3+ consecutive absences
    anomalies = []
    active_students = student.get_active_students()
    
    if not active_students:
        return anomalies
        
    for s in active_students:
        student_id = s.get('id')
        attendance_percentage = attendance.get_student_attendance_percentage(student_id)
        
        is_anomaly = False
        reasons = []
        
        if attendance_percentage is not None and attendance_percentage < 75.0:
            is_anomaly = True
            reasons.append("Low attendance (<75%)")
            
        history = attendance.get_student_attendance(student_id, limit=3)
        if history and len(history) >= 3:
            consecutive_absences = all(record.get('status') == 'absent' for record in history[:3])
            if consecutive_absences:
                is_anomaly = True
                reasons.append("3+ consecutive absences")
                
        if is_anomaly:
            anomalies.append({
                "student": s,
                "reasons": reasons
            })
            
    return anomalies

def generate_csv_report(report_type, date_str=None):
    output = StringIO()
    writer = csv.writer(output)
    
    if report_type == "daily":
        writer.writerow(["Student ID", "Name", "Time In", "Time Out", "Status"])
        if date_str:
            records = attendance.get_attendance_by_date(date_str)
        else:
            records = attendance.get_today_attendance()
            
        if records:
            for record in records:
                writer.writerow([
                    record.get("student_id", ""),
                    record.get("student_name", ""),
                    record.get("check_in_time", ""),
                    record.get("check_out_time", ""),
                    record.get("status", "")
                ])
            
    elif report_type == "monthly":
        writer.writerow(["Student ID", "Name", "Total Present", "Total Absent", "Attendance %"])
        stats = attendance.get_attendance_stats(month=date_str)
        if stats:
            for stat in stats:
                writer.writerow([
                    stat.get("student_id", ""),
                    stat.get("student_name", ""),
                    stat.get("total_present", 0),
                    stat.get("total_absent", 0),
                    stat.get("attendance_percentage", 0.0)
                ])
            
    return output.getvalue()
