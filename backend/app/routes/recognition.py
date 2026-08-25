from flask import Blueprint, Response
from app.services import recognition_service
from app.utils.helpers import success_response, error_response

recognition_bp = Blueprint('recognition', __name__)

@recognition_bp.route('/api/recognition/start', methods=['POST'])
def start_session():
    try:
        result = recognition_service.start_session()
        return success_response(result)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/api/recognition/stop', methods=['POST'])
def stop_session():
    try:
        result = recognition_service.stop_session()
        return success_response(result)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/api/recognition/status', methods=['GET'])
def get_status():
    try:
        status = recognition_service.get_status()
        return success_response(status)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/api/recognition/latest', methods=['GET'])
def get_latest_results():
    try:
        latest = recognition_service.get_latest_results()
        return success_response(latest)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/video_feed')
def video_feed():
    try:
        return Response(
            recognition_service.get_camera_stream(),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )
    except Exception as e:
        return error_response(str(e))
