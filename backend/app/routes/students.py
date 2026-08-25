from flask import Blueprint, request
from app.services import student_service
from app.utils.helpers import success_response, error_response

students_bp = Blueprint('students', __name__)

@students_bp.route('', methods=['GET'])
def get_students():
    try:
        status = request.args.get('status')
        class_name = request.args.get('class_name')
        search = request.args.get('search')
        students = student_service.get_all_students(status, class_name, search)
        return success_response(students)
    except Exception as e:
        return error_response(str(e))

@students_bp.route('/<student_id>', methods=['GET'])
def get_student(student_id):
    try:
        student = student_service.get_student(student_id)
        if not student:
            return error_response("Student not found", 404)
        return success_response(student)
    except Exception as e:
        return error_response(str(e))

@students_bp.route('', methods=['POST'])
def create_student():
    try:
        data = request.json
        student = student_service.create_student(data)
        return success_response(student, 201)
    except Exception as e:
        return error_response(str(e))

@students_bp.route('/<student_id>', methods=['PUT'])
def update_student(student_id):
    try:
        data = request.json
        student = student_service.update_student(student_id, data)
        return success_response(student)
    except Exception as e:
        return error_response(str(e))

@students_bp.route('/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        student_service.delete_student(student_id)
        return success_response(message="Student deleted successfully")
    except Exception as e:
        return error_response(str(e))

@students_bp.route('/<student_id>/faces/capture', methods=['POST'])
def capture_face(student_id):
    try:
        result = student_service.capture_face(student_id)
        return success_response(result)
    except Exception as e:
        return error_response(str(e))

@students_bp.route('/<student_id>/train', methods=['POST'])
def train_model(student_id):
    try:
        result = student_service.train_student_model(student_id)
        return success_response(result)
    except Exception as e:
        return error_response(str(e))
