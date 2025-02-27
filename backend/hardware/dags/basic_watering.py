# refactored the old dag into this generalizable structure, will rename once project structure gets approved

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import RPi.GPIO as GPIO
import time
import sys
import os

# Add the backend directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..'))
from database.firebase.plant_service import get_plants_needing_water, update_last_watered

# GPIO setup
RELAY_PIN = 17

def water_plants():
    """
    Check which plants need watering and water them
    """
    plants_to_water = get_plants_needing_water()
    
    if not plants_to_water:
        print("No plants need watering at this time")
        return
    
    print(f"Found {len(plants_to_water)} plants to water")
    
    for plant in plants_to_water:
        water_plant(plant["id"], plant["name"], plant.get("duration", 5))

def water_plant(plant_id, plant_name, duration=5):
    """
    Controls the GPIO to water a specific plant
    """
    print(f"Watering plant: {plant_name} for {duration} seconds")
    
    # Setup GPIO
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(RELAY_PIN, GPIO.OUT)
    
    try:
        # Turn on pump
        GPIO.output(RELAY_PIN, GPIO.HIGH)
        time.sleep(duration)
        
        # Turn off pump
        GPIO.output(RELAY_PIN, GPIO.LOW)
        
        # Update the last_watered timestamp in Firebase
        if update_last_watered(plant_id):
            print(f"Successfully updated watering timestamp for {plant_name}")
        else:
            print(f"Failed to update watering timestamp for {plant_name}")
    
    except Exception as e:
        print(f"Error watering plant {plant_name}: {e}")
    
    finally:
        # Always clean up GPIO to avoid resource leaks
        GPIO.cleanup()

# Define the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 10),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'plant_watering_scheduler',
    default_args=default_args,
    description='Check and water plants based on schedule',
    schedule_interval='0 * * * *',  # Run hourly
    catchup=False,
)

water_task = PythonOperator(
    task_id='water_plants',
    python_callable=water_plants,
    dag=dag,
)
