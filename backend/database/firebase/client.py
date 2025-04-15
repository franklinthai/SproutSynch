import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app only once
if not firebase_admin._apps:
    cred = credentials.Certificate("sproutsynch-firebase-adminsdk-r63he-86c0522367.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Firestore client
def get_firestore_client():
    """
    Returns the Firestore client
    """
    return db
    
