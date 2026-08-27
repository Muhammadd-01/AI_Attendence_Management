from flask import Blueprint, Response, request
from app.services import recognition_service
from app.utils.helpers import success_response, error_response

recognition_bp = Blueprint('recognition', __name__)

@recognition_bp.route('/start', methods=['POST'])
def start_session():
    try:
        data = request.get_json(silent=True) or {}
        allowed_class = data.get('allowedClass')
        result = recognition_service.start_session(allowed_class=allowed_class)
        return success_response(result)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/stop', methods=['POST'])
def stop_session():
    try:
        result = recognition_service.stop_session()
        return success_response(result)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/status', methods=['GET'])
def get_status():
    try:
        status = recognition_service.get_status()
        return success_response(status)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/latest', methods=['GET'])
def get_latest_results():
    try:
        latest = recognition_service.get_latest_results()
        return success_response(latest)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/scan-frame', methods=['POST'])
def scan_frame():
    try:
        data = request.get_json(silent=True) or {}
        image_data = data.get('image')
        allowed_class = data.get('allowedClass')
        target_role = data.get('targetRole') or data.get('personType')
        res = recognition_service.detect_and_recognize_frame(
            image_data=image_data, 
            allowed_class=allowed_class,
            target_role=target_role
        )
        return success_response(res)
    except Exception as e:
        return error_response(str(e))

@recognition_bp.route('/sync-all', methods=['POST'])
def sync_all_users():
    try:
        res = recognition_service.sync_all()
        return success_response(res, "All user models synchronized successfully")
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
