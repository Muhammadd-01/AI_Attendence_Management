import os
import warnings

# Suppress deprecation notices from older google auth libraries on python 3.9
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*urllib3.*")
warnings.filterwarnings("ignore", message=".*Google will update google-auth.*")

from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)
    
    # Initialize Database (Firebase)
    from app.database.connection import get_db
    get_db()
    
    # Register Blueprints
    from app.routes.dashboard import dashboard_bp
    from app.routes.students import students_bp
    from app.routes.teachers import teachers_bp
    from app.routes.attendance import attendance_bp
    from app.routes.recognition import recognition_bp
    from app.routes.reports import reports_bp
    from app.routes.analytics import analytics_bp
    from app.routes.settings import settings_bp
    
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(teachers_bp, url_prefix='/api/teachers')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(recognition_bp, url_prefix='/api/recognition')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'AI Attendance API is running'}
        
    return app
