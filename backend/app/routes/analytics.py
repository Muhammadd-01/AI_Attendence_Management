from flask import Blueprint
from app.services import analytics_service
from app.utils.helpers import success_response, error_response
from app.models import student, attendance

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('', methods=['GET'])
def get_analytics():
    try:
        data = analytics_service.get_full_analytics()
        return success_response(data)
    except Exception as e:
        return error_response(str(e))

@analytics_bp.route('/anomalies', methods=['GET'])
def get_anomalies():
    try:
        anomalies = analytics_service.get_anomalies()
        return success_response(anomalies)
    except Exception as e:
        return error_response(str(e))

@analytics_bp.route('/classes', methods=['GET'])
def get_classes_analytics():
    try:
        class_stats = analytics_service.get_class_statistics()
        return success_response(class_stats)
    except Exception as e:
        return error_response(str(e))

@analytics_bp.route('/distribution', methods=['GET'])
def get_distribution():
    try:
        dist = analytics_service.get_attendance_distribution()
        return success_response(dist)
    except Exception as e:
        return error_response(str(e))
