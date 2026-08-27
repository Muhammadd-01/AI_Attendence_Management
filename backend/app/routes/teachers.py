from flask import Blueprint, request
from app.services import teacher_service
from app.utils.helpers import success_response, error_response

teachers_bp = Blueprint('teachers', __name__)

@teachers_bp.route('', methods=['GET'])
def get_teachers():
    try:
        teachers = teacher_service.get_all_teachers()
        return success_response(teachers)
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/payroll', methods=['GET'])
def get_all_payroll():
    try:
        month = request.args.get('month')
        payroll = teacher_service.calculate_teacher_payroll(month=month)
        return success_response(payroll)
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/<teacher_id>/payroll', methods=['GET'])
def get_teacher_payroll(teacher_id):
    try:
        month = request.args.get('month')
        payroll = teacher_service.calculate_teacher_payroll(teacher_id=teacher_id, month=month)
        return success_response(payroll[0] if payroll else {})
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/<teacher_id>/salary', methods=['PUT', 'POST'])
def update_teacher_salary(teacher_id):
    try:
        data = request.json or {}
        updated = teacher_service.update_teacher_salary(teacher_id, data)
        return success_response(updated, "Salary settings updated successfully")
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/<teacher_id>', methods=['GET'])
def get_teacher(teacher_id):
    try:
        teacher = teacher_service.get_teacher(teacher_id)
        if not teacher:
            return error_response("Teacher not found", 404)
        return success_response(teacher)
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('', methods=['POST'])
def create_teacher():
    try:
        data = request.json or {}
        teacher = teacher_service.create_teacher(data)
        return success_response(teacher, 201)
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/<teacher_id>', methods=['PUT'])
def update_teacher(teacher_id):
    try:
        data = request.json or {}
        teacher = teacher_service.update_teacher(teacher_id, data)
        return success_response(teacher)
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/<teacher_id>', methods=['DELETE'])
def delete_teacher(teacher_id):
    try:
        teacher_service.delete_teacher(teacher_id)
        return success_response(message="Teacher deleted successfully")
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/<teacher_id>/faces/capture', methods=['POST'])
def capture_teacher_face(teacher_id):
    try:
        data = request.get_json(silent=True) or {}
        image_data = data.get('image') or data.get('image_data')
        result = teacher_service.capture_teacher_face(teacher_id, image_data=image_data)
        if not result.get('success'):
            return error_response(result.get('error', 'Capture failed'), 400)
        return success_response(result, result.get('message', 'Face sample captured'))
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/<teacher_id>/train', methods=['POST'])
def train_teacher_model(teacher_id):
    try:
        data = request.get_json(silent=True) or {}
        image_urls = data.get('image_urls') or []
        result = teacher_service.train_teacher_model(teacher_id, image_urls=image_urls)
        if not result.get('success'):
            return error_response(result.get('error', 'Training failed'), 400)
        return success_response(result, result.get('message', 'Model trained successfully'))
    except Exception as e:
        return error_response(str(e))
