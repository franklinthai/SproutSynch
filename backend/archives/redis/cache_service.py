# very naive structure of the cache service, will test these later

# backend/database/redis/cache_service.py
import redis
import json
import os
from datetime import datetime, timedelta

# Initialize Redis connection as a singleton
_redis_client = None

def get_redis_client():
    """
    Returns a singleton Redis client instance
    """
    global _redis_client
    if _redis_client is None:
        host = os.environ.get('REDIS_HOST', '127.0.0.1')
        port = int(os.environ.get('REDIS_PORT', 6379))
        db = int(os.environ.get('REDIS_DB', 0))
        
        _redis_client = redis.Redis(
            host=host,
            port=port,
            db=db,
            decode_responses=True  # Automatically decode response to str instead of bytes
        )
        
    return _redis_client

def cache_plants(plants_data):
    """
    Store plants data in Redis
    
    Args:
        plants_data (list): List of plant dictionaries
    """
    r = get_redis_client()
    pipe = r.pipeline()
    
    # Store plant data with 1 hour expiration
    for plant in plants_data:
        plant_id = plant.get('id')
        if plant_id:
            pipe.setex(
                f"plant:{plant_id}", 
                timedelta(hours=1),  # Cache expiration
                json.dumps(plant)
            )
    
    # Store the list of all plant IDs
    all_ids = [plant.get('id') for plant in plants_data if plant.get('id')]
    pipe.setex("plants:all", timedelta(hours=1), json.dumps(all_ids))
    
    # Execute all commands in a single transaction
    pipe.execute()

def get_cached_plant(plant_id):
    """
    Retrieve a plant from Redis cache
    
    Args:
        plant_id (str): The plant ID
        
    Returns:
        dict: Plant data or None if not in cache
    """
    r = get_redis_client()
    data = r.get(f"plant:{plant_id}")
    
    if data:
        return json.loads(data)
    return None

def get_all_cached_plants():
    """
    Retrieve all plant IDs from cache
    
    Returns:
        list: List of plant dictionaries or empty list if none in cache
    """
    r = get_redis_client()
    plant_ids = r.get("plants:all")
    
    if not plant_ids:
        return []
    
    plant_ids = json.loads(plant_ids)
    result = []
    
    pipe = r.pipeline()
    for plant_id in plant_ids:
        pipe.get(f"plant:{plant_id}")
    
    plants_data = pipe.execute()
    
    for data in plants_data:
        if data:
            result.append(json.loads(data))
    
    return result

def cache_watering_event(plant_id, timestamp=None):
    """
    Store watering event in Redis
    
    Args:
        plant_id (str): The plant ID
        timestamp (str, optional): ISO format timestamp. Defaults to current time.
    """
    if timestamp is None:
        timestamp = datetime.now().isoformat()
    
    r = get_redis_client()
    
    # Store last watering time
    r.set(f"plant:{plant_id}:last_watered", timestamp)
    
    # Add to watering history (keeping last 10 events)
    r.lpush(f"plant:{plant_id}:watering_history", timestamp)
    r.ltrim(f"plant:{plant_id}:watering_history", 0, 9)  # Keep only most recent 10

def get_last_watered(plant_id):
    """
    Get the last time a plant was watered
    
    Args:
        plant_id (str): The plant ID
        
    Returns:
        str: ISO format timestamp or None
    """
    r = get_redis_client()
    return r.get(f"plant:{plant_id}:last_watered")

def invalidate_plant_cache(plant_id=None):
    """
    Clear cache for a specific plant or all plants
    
    Args:
        plant_id (str, optional): The plant ID. If None, clear all plant caches.
    """
    r = get_redis_client()
    
    if plant_id:
        r.delete(f"plant:{plant_id}")
        return
    
    # Clear all plants
    plant_ids = r.get("plants:all")
    if plant_ids:
        plant_ids = json.loads(plant_ids)
        pipe = r.pipeline()
        
        for pid in plant_ids:
            pipe.delete(f"plant:{pid}")
        
        pipe.delete("plants:all")
        pipe.execute()
