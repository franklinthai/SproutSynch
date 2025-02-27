# backend/database/firebase/plant_service.py
from datetime import datetime
from .client import get_firestore_client

def get_plants_needing_water():
    """
    Retrieves plants that need watering based on their watering interval
    """
    db = get_firestore_client()
    plants_ref = db.collection('plants')
    plants = plants_ref.get()
    
    plants_to_water = []
    current_time = datetime.now()
    
    for plant in plants:
        plant_data = plant.to_dict()
        
        # Handle various date formats or missing dates
        try:
            if 'last_watered' in plant_data and plant_data['last_watered']:
                last_watered = datetime.fromisoformat(plant_data['last_watered'])
            else:
                # If plant has never been watered, assume it needs water
                plants_to_water.append({
                    "id": plant.id,
                    "name": plant_data.get('name', 'Unknown'),
                    "duration": plant_data.get('duration', 5)
                })
                continue
        except ValueError:
            # Handle date parsing errors
            print(f"Error parsing date for plant {plant_data.get('name', 'Unknown')}")
            continue
            
        interval = plant_data.get('interval', 1)  # Default to 1 day if not specified
        
        if (current_time - last_watered).days >= interval:
            plants_to_water.append({
                "id": plant.id,
                "name": plant_data.get('name', 'Unknown'),
                "duration": plant_data.get('duration', 5)
            })
    
    return plants_to_water

def update_last_watered(plant_id):
    """
    Updates the last_watered timestamp for a plant
    """
    db = get_firestore_client()
    plants_ref = db.collection('plants')
    
    try:
        plants_ref.document(plant_id).update({
            'last_watered': datetime.now().isoformat()
        })
        return True
    except Exception as e:
        print(f"Error updating plant {plant_id}: {e}")
        return False