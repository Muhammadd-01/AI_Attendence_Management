import firebase_admin
from firebase_admin import credentials, firestore
from app.config import Config
import os

_db = None

def get_db():
    """Get Firestore client. Initializes Firebase app on first call."""
    global _db
    if _db is None:
        cred_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            Config.FIREBASE_CREDENTIALS_PATH
        )
        if not os.path.exists(cred_path):
            raise FileNotFoundError(
                f"Firebase credentials not found at {cred_path}. "
                "Download serviceAccountKey.json from Firebase Console."
            )
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _db = firestore.client()
    return _db
