import datetime
import numpy as np
from flask import jsonify

def serialize_for_json(obj):
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [serialize_for_json(v) for v in obj]
    return obj

def success_response(data=None, message=None, status_code=200):
    response = {"status": "success", "success": True}
    if message is not None:
        response["message"] = message
    if data is not None:
        response["data"] = serialize_for_json(data)
    return jsonify(response), status_code

def error_response(message, status_code=400):
    response = {
        "status": "error",
        "success": False,
        "message": str(message),
        "error": str(message)
    }
    return jsonify(response), status_code

def format_datetime(dt):
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%d %H:%M:%S")
