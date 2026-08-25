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
        data = request.json
        teacher = teacher_service.create_teacher(data)
        return success_response(teacher, 201)
    except Exception as e:
        return error_response(str(e))

@teachers_bp.route('/<teacher_id>', methods=['PUT'])
def update_teacher(teacher_id):
    try:
        data = request.json
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
