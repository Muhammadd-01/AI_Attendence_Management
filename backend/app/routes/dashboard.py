from flask import Blueprint
import datetime
from app.utils.helpers import success_response, error_response
from app.models import student, attendance
from app.services import analytics_service

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        stats = analytics_service.get_dashboard_stats()
        return success_response(stats)
    except Exception as e:
        return error_response(str(e))

@dashboard_bp.route('/recent', methods=['GET'])
def get_recent():
    try:
        # Fetch today's records or recent 10 records
        today_records = attendance.get_today_attendance()
        if not today_records:
            hist = attendance.get_attendance_history(page=1, per_page=10)
            today_records = hist.get('records', [])
        return success_response(today_records[:10])
    except Exception as e:
        return error_response(str(e))

@dashboard_bp.route('/weekly-trend', methods=['GET'])
def get_weekly_trend():
    try:
        # Get past 7 days breakdown
        stats = attendance.get_attendance_stats(days=7)
        trend = []
        today = datetime.datetime.utcnow()
        days_of_week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        for i in range(6, -1, -1):
            day_dt = today - datetime.timedelta(days=i)
            date_str = day_dt.strftime('%Y-%m-%d')
            day_label = day_dt.strftime('%a')
            
            day_data = stats.get(date_str, {'Present': 0, 'Late': 0, 'Absent': 0, 'Total': 0})
            trend.append({
                'date': day_label,
                'full_date': date_str,
                'present': day_data.get('Present', 0) + day_data.get('Late', 0),
                'absent': day_data.get('Absent', 0),
                'late': day_data.get('Late', 0),
                'rate': round(((day_data.get('Present', 0) + day_data.get('Late', 0)) / max(day_data.get('Total', 1), 1)) * 100, 1) if day_data.get('Total', 0) > 0 else 0
            })
            
        return success_response(trend)
    except Exception as e:
        return error_response(str(e))

@dashboard_bp.route('/monthly-trend', methods=['GET'])
def get_monthly_trend():
    try:
        # 30 days trend
        stats = attendance.get_attendance_stats(days=30)
        trend = []
        for date_str in sorted(stats.keys()):
            s = stats[date_str]
            trend.append({
                'date': date_str,
                'present': s.get('Present', 0) + s.get('Late', 0),
                'absent': s.get('Absent', 0),
                'rate': s.get('rate', 0)
            })
        return success_response(trend)
    except Exception as e:
        return error_response(str(e))
