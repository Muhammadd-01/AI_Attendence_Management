import os
import warnings

# Essential macOS POSIX & CoreFoundation safety flags for OpenCV, dlib, and gRPC
os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'
os.environ['GRPC_PYTHON_LOG_LEVEL'] = 'ERROR'
os.environ['GRPC_VERBOSITY'] = 'NONE'
os.environ['GLOG_minloglevel'] = '3'

warnings.filterwarnings("ignore")

from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"\n🚀 AI Attendance Backend Server Running on http://localhost:{port}\n")
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
