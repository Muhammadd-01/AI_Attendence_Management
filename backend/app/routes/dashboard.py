from flask import Blueprint, request
import datetime
from app.utils.helpers import success_response, error_response
from app.models import student, attendance
from app.services import analytics_service

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        role = request.args.get('role')
        assigned_class = request.args.get('class')
        stats = analytics_service.get_dashboard_stats(role, assigned_class)
        return success_response(stats)
    except Exception as e:
        return error_response(str(e))

@dashboard_bp.route('/recent', methods=['GET'])
def get_recent():
    try:
        role = request.args.get('role')
        assigned_class = request.args.get('class')
        
        # Fetch today's records or recent 10 records
        today_records = attendance.get_today_attendance(person_type=None)
        
        # Filter by class if teacher
        if role == 'teacher' and assigned_class:
            # We need to filter today_records by class
            # Since attendance record might not have class_name directly, we check student list
            students_in_class = [s.get('student_id') for s in student.get_active_students() if s.get('class_name') == assigned_class]
            today_records = [r for r in today_records if r.get('student_id') in students_in_class]
            
        if not today_records:
            hist = attendance.get_attendance_history(page=1, per_page=10)
            today_records = hist.get('records', [])
            if role == 'teacher' and assigned_class:
                students_in_class = [s.get('student_id') for s in student.get_active_students() if s.get('class_name') == assigned_class]
                today_records = [r for r in today_records if r.get('student_id') in students_in_class]
                
        return success_response(today_records[:10])
    except Exception as e:
        return error_response(str(e))

@dashboard_bp.route('/weekly-trend', methods=['GET'])
def get_weekly_trend():
    try:
        role = request.args.get('role')
        assigned_class = request.args.get('class')
        
        stats = attendance.get_attendance_stats(days=7, role=role, assigned_class=assigned_class)
        trend = []
        today = datetime.datetime.now()
        
        for i in range(6, -1, -1):
            day_dt = today - datetime.timedelta(days=i)
            date_str = day_dt.strftime('%Y-%m-%d')
            day_label = day_dt.strftime('%a')
            
            day_data = stats.get(date_str, {'present': 0, 'late': 0, 'absent': 0})
            total = day_data.get('present', 0) + day_data.get('late', 0) + day_data.get('absent', 0)
            
            trend.append({
                'date': day_label,
                'full_date': date_str,
                'present': day_data.get('present', 0) + day_data.get('late', 0),
                'absent': day_data.get('absent', 0),
                'late': day_data.get('late', 0),
                'rate': round(((day_data.get('present', 0) + day_data.get('late', 0)) / max(total, 1)) * 100, 1) if total > 0 else 0
            })
            
        return success_response(trend)
    except Exception as e:
        return error_response(str(e))

@dashboard_bp.route('/monthly-trend', methods=['GET'])
def get_monthly_trend():
    try:
        role = request.args.get('role')
        assigned_class = request.args.get('class')
        
        stats = attendance.get_attendance_stats(days=30, role=role, assigned_class=assigned_class)
        trend = []
        for date_str in sorted(stats.keys()):
            s = stats[date_str]
            total = s.get('present', 0) + s.get('late', 0) + s.get('absent', 0)
            trend.append({
                'date': date_str,
                'present': s.get('present', 0) + s.get('late', 0),
                'absent': s.get('absent', 0),
                'rate': round(((s.get('present', 0) + s.get('late', 0)) / max(total, 1)) * 100, 1) if total > 0 else 0
            })
        return success_response(trend)
    except Exception as e:
        return error_response(str(e))
