import os
import warnings

# Suppress Python 3.9 deprecation / OpenSSL notice spam
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*urllib3.*")
warnings.filterwarnings("ignore", message=".*Google will update google-auth.*")

from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"\n🚀 AI Attendance Backend Server Running on http://localhost:{port}\n")
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)
