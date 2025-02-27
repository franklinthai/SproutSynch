# backend/database/firebase/client.py
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

_db = None

def get_firestore_client():
    """
    Singleton pattern to initialize Firebase only once and return the client
    """
    global _db
    if _db is None:
        # Check if service account path is set as environment variable
        service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH')
        
        if service_account_path and os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
        else:
            # Fallback to a default location or raise error
            default_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
            if os.path.exists(default_path):
                cred = credentials.Certificate(default_path)
            else:
                raise FileNotFoundError(
                    "Firebase service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_PATH "
                    "environment variable or place serviceAccountKey.json in the firebase directory."
                )
        
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://sproutsynch-default-rtdb.firebaseio.com'
        })
        
        _db = firestore.client()
    
    return _db
