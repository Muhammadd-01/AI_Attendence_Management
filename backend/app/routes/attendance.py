from flask import Blueprint, request
from app.models import attendance as attendance_model
from app.utils.helpers import success_response, error_response, serialize_for_json
from app.database.connection import get_db

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('', methods=['GET'])
def get_history():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        student_id = request.args.get('student_id')
        date = request.args.get('date')
        status = request.args.get('status')
        class_name = request.args.get('class_name')
        person_type = request.args.get('person_type')
        search_query = request.args.get('search')

        result = attendance_model.get_attendance_history(
            page=page,
            per_page=per_page,
            student_id=student_id,
            date=date,
            status=status,
            class_name=class_name,
            person_type=person_type,
            search_query=search_query
        )
        return success_response(serialize_for_json(result))
    except Exception as e:
        return error_response(str(e))

@attendance_bp.route('/today', methods=['GET'])
def get_today_attendance():
    try:
        person_type = request.args.get('person_type')
        records = attendance_model.get_today_attendance(person_type=person_type)
        return success_response(serialize_for_json(records))
    except Exception as e:
        return error_response(str(e))

@attendance_bp.route('/student/<student_id>', methods=['GET'])
def get_student_history(student_id):
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        records = attendance_model.get_student_attendance(student_id, start_date, end_date)
        return success_response(serialize_for_json(records))
    except Exception as e:
        return error_response(str(e))

@attendance_bp.route('/check-in', methods=['POST'])
def manual_check_in():
    try:
        data = request.get_json() or {}
        student_id = data.get('student_id')
        student_name = data.get('student_name') or data.get('name')
        confidence = data.get('confidence', 0.98)
        session_id = data.get('session_id')
        person_type = data.get('person_type')

        if not student_id:
            return error_response('Identifier ID is required', 400)

        # Unified Auto-Detection
        db = get_db()
        if str(student_id).startswith('TCH') or str(student_id).startswith('T-'):
            person_type = 'teacher'
            t_matches = list(db.collection('teachers').where('teacher_id', '==', student_id).limit(1).stream())
            if t_matches:
                t_data = t_matches[0].to_dict()
                if t_data.get('status') == 'inactive':
                    return error_response("This teacher is deactivated and cannot check in.", 403)
                if not student_name or student_name == 'Attendee':
                    student_name = t_data.get('name', 'Faculty Member')
        elif not person_type or person_type == 'auto':
            t_matches = list(db.collection('teachers').where('teacher_id', '==', student_id).limit(1).stream())
            if t_matches:
                person_type = 'teacher'
                t_data = t_matches[0].to_dict()
                if t_data.get('status') == 'inactive':
                    return error_response("This teacher is deactivated and cannot check in.", 403)
                if not student_name:
                    student_name = t_data.get('name', 'Faculty Member')
            else:
                person_type = 'student'
                s_matches = list(db.collection('students').where('student_id', '==', student_id).limit(1).stream())
                if s_matches:
                    s_data = s_matches[0].to_dict()
                    if s_data.get('status') == 'inactive':
                        return error_response("This student is deactivated and cannot check in.", 403)
                    if not student_name:
                        student_name = s_data.get('name', 'Student')

        if not student_name or student_name == 'Unknown':
            return error_response("Unknown face detected.", 400)
            
        method = data.get('method', 'face')

        # Check if already checked in today
        if attendance_model.is_checked_in_today(student_id):
            return success_response({"already_checked_in": True}, f"{person_type.capitalize()} attendance was already recorded today.")

        record = attendance_model.check_in(
            student_id=student_id, 
            student_name=student_name, 
            confidence=confidence, 
            session_id=session_id,
            person_type=person_type,
            method=method
        )
        return success_response(serialize_for_json(record), f"{person_type.capitalize()} attendance recorded successfully")
    except Exception as e:
        return error_response(str(e))

@attendance_bp.route('/check-out', methods=['POST'])
def manual_check_out():
    try:
        data = request.get_json() or {}
        student_id = data.get('student_id')
        date = data.get('date')

        if not student_id:
            return error_response('Identifier ID is required', 400)

        # Unified Auto-Detection
        person_type = data.get('person_type')
        db = get_db()
        if str(student_id).startswith('TCH') or str(student_id).startswith('T-'):
            person_type = 'teacher'
        elif not person_type or person_type == 'auto':
            t_matches = list(db.collection('teachers').where('teacher_id', '==', student_id).limit(1).stream())
            person_type = 'teacher' if t_matches else 'student'

        record = attendance_model.check_out(student_id=student_id, date=date)
        if not record:
            record = attendance_model.check_in(
                student_id=student_id,
                student_name=data.get('student_name', 'Attendee'),
                confidence=0.98,
                person_type=person_type
            )
            record = attendance_model.check_out(student_id=student_id, date=date)

        if record and record.get('already_checked_out'):
            return success_response(serialize_for_json(record), f"{person_type.capitalize()} has already checked out today.")

        return success_response(serialize_for_json(record), f"{person_type.capitalize()} check-out duration calculated successfully")
    except Exception as e:
        return error_response(str(e))

@attendance_bp.route('/finalize', methods=['POST'])
def finalize_session():
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id')
        result = attendance_model.finalize_session(session_id)
        return success_response(serialize_for_json(result), "Session finalized successfully")
    except Exception as e:
        return error_response(str(e))
