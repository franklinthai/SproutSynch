# backend/database/firebase/plant_service.py
from datetime import datetime
from client import get_firestore_client
from firebase_admin import firestore
from datetime import datetime

def get_plants_needing_water(uid):
    """
    Retrieves plants that need watering based on their watering interval and pipe ID
    """
    db = get_firestore_client()
    plants_ref = db.collection("users").document(uid).collection("plants")
    query = plants_ref.where("pipe_id", "!=", None)
    docs = query.stream()

    for doc in docs:
        doc_ref = plants_ref.document(doc.id)
        current_date = datetime.now().isoformat()
        doc_ref.update({"last_watered": current_date})
    
    return docs

def update_plant_last_watered(uid: str, plant_name: str):
    db = get_firestore_client()
    plants_ref = db.collection("users").document(uid).collection("plants")
    
    query = plants_ref.where("name", "==", plant_name)
    docs = query.stream()

    for doc in docs:
        doc_ref = plants_ref.document(doc.id)
        current_date = datetime.now().isoformat()
        doc_ref.update({"last_watered": current_date})
        print(f"Updated {doc.id} with last_watered = {current_date}")

   
    