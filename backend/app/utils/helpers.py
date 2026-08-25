from flask import jsonify

def success_response(data=None, message=None, status_code=200):
    response = {"status": "success", "success": True}
    if message is not None:
        response["message"] = message
    if data is not None:
        response["data"] = data
    return jsonify(response), status_code

def error_response(message, status_code=400):
    response = {
        "status": "error",
        "success": False,
        "message": message,
        "error": message
    }
    return jsonify(response), status_code

def format_datetime(dt):
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%d %H:%M:%S")
