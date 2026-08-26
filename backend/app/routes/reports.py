from flask import Blueprint, request, send_file
import io
import csv
import datetime
from app.utils.helpers import success_response, error_response
from app.models import student, attendance

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/daily', methods=['GET'])
def get_daily_reports():
    try:
        date_str = request.args.get('date', datetime.datetime.now().strftime('%Y-%m-%d'))
        records = attendance.get_attendance_by_date(date_str)
        
        total = len(records)
        present = sum(1 for r in records if r.get('status') == 'Present')
        late = sum(1 for r in records if r.get('status') == 'Late')
        absent = sum(1 for r in records if r.get('status') == 'Absent')
        rate = round(((present + late) / max(total, 1)) * 100, 1) if total > 0 else 0
        
        return success_response({
            'date': date_str,
            'total': total,
            'present': present,
            'late': late,
            'absent': absent,
            'attendance_rate': rate,
            'records': records
        })
    except Exception as e:
        return error_response(str(e))

@reports_bp.route('/monthly', methods=['GET'])
def get_monthly_reports():
    try:
        month = request.args.get('month', datetime.datetime.now().strftime('%m'))
        year = request.args.get('year', datetime.datetime.now().strftime('%Y'))
        
        month_prefix = f"{year}-{str(month).zfill(2)}"
        
        # Get 30-day stats
        all_stats = attendance.get_attendance_stats(days=60)
        
        filtered_days = []
        total_present = 0
        total_absent = 0
        total_late = 0
        
        for date_str in sorted(all_stats.keys()):
            if date_str.startswith(month_prefix):
                day_data = all_stats[date_str]
                p = day_data.get('Present', 0)
                l = day_data.get('Late', 0)
                a = day_data.get('Absent', 0)
                tot = p + l + a
                
                total_present += p
                total_late += l
                total_absent += a
                
                filtered_days.append({
                    'date': date_str.split('-')[-1],
                    'full_date': date_str,
                    'present': p + l,
                    'absent': a,
                    'rate': round(((p + l) / max(tot, 1)) * 100, 1) if tot > 0 else 0
                })
                
        grand_total = total_present + total_late + total_absent
        avg_rate = round(((total_present + total_late) / max(grand_total, 1)) * 100, 1) if grand_total > 0 else 0
        
        return success_response({
            'month': month,
            'year': year,
            'total_present': total_present,
            'total_late': total_late,
            'total_absent': total_absent,
            'average_rate': avg_rate,
            'days': filtered_days
        })
    except Exception as e:
        return error_response(str(e))

@reports_bp.route('/student/<student_id>', methods=['GET'])
def get_student_report(student_id):
    try:
        st = student.get_student(student_id)
        if not st:
            return error_response('Student not found', 404)
            
        history = attendance.get_student_attendance(student_id)
        total = len(history)
        present = sum(1 for r in history if r.get('status') in ('Present', 'Late'))
        absent = sum(1 for r in history if r.get('status') == 'Absent')
        rate = round((present / max(total, 1)) * 100, 1) if total > 0 else 0
        
        return success_response({
            'student': st,
            'total_sessions': total,
            'present': present,
            'absent': absent,
            'attendance_rate': rate,
            'history': history
        })
    except Exception as e:
        return error_response(str(e))

@reports_bp.route('/export', methods=['GET'])
def export_report():
    try:
        date_str = request.args.get('date')
        if date_str:
            records = attendance.get_attendance_by_date(date_str)
        else:
            hist = attendance.get_attendance_history(page=1, per_page=1000)
            records = hist.get('records', [])
            
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Student ID', 'Student Name', 'Date', 'Status', 'Check In', 'Check Out', 'Confidence'])
        
        for r in records:
            writer.writerow([
                r.get('student_id', ''),
                r.get('student_name', ''),
                r.get('date', ''),
                r.get('status', ''),
                r.get('check_in_time', ''),
                r.get('check_out_time', ''),
                f"{round(r.get('confidence', 0) * 100, 1)}%" if r.get('confidence') else ''
            ])
            
        buffer = io.BytesIO(output.getvalue().encode('utf-8'))
        filename = f"attendance_report_{date_str or 'all'}.csv"
        
        return send_file(
            buffer,
            mimetype="text/csv",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return error_response(str(e))
