from flask import Blueprint, request
from app.utils.helpers import success_response, error_response
from app.models import settings

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('', methods=['GET'])
def get_settings():
    try:
        data = settings.get_settings()
        return success_response(data)
    except Exception as e:
        return error_response(str(e))

@settings_bp.route('', methods=['PUT'])
def update_settings():
    try:
        data = request.json or {}
        updated = settings.update_settings(data)
        return success_response(updated)
    except Exception as e:
        return error_response(str(e))

@settings_bp.route('/reset', methods=['POST'])
def reset_settings():
    try:
        data = settings.reset_settings()
        return success_response(data)
    except Exception as e:
        return error_response(str(e))
