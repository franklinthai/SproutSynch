"""
Procedural DAG Factory to dynamically generate Airflow DAGs for each plant.
Handles creation of individual watering DAGs for each plant based on their configs.
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
import os
import json
from typing import Dict, Any, Optional

# Add backend directory to path for imports
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..'))
from database.firebase.plant_service import get_plant_by_id, update_last_watered
from hardware.scripts.watering_control import water_plant_by_relay
from hardware.utils import get_hardware_config

def water_plant_task(plant_id: str, **kwargs) -> None:
    """
    Task function for watering a specific plant
    """
    # Get the plant data
    plant = get_plant_by_id(plant_id)
    if not plant:
        print(f"Plant {plant_id} not found")
        return
    
    hardware_config = get_hardware_config()
    user_id = hardware_config.get("user_id")
    
    # First check if plant belongs to the USER_ID
    if user_id != plant.get("user_id"):
        print(f"Plant {plant_id} does not belong to this device's user")
        return
    
    # Get the relay mapping for this plant
    relay_id = plant.get("relay_id")
    if not relay_id:
        print(f"Plant {plant_id} does not have a relay assigned")
        return
    
    # Get plant watering params
    duration = plant.get("duration", 5)
    name = plant.get("name", "Unknown Plant")

    try:
        print(f"Watering plant: {name} for {duration} seconds on relay {relay_id}")
        water_plant_by_relay(relay_id, duration)
        
        # Update the last_watered timestamp
        if update_last_watered(plant_id):
            print(f"Successfully updated watering timestamp for {name}")
        else:
            print(f"Failed to update watering timestamp for {name}")
    
    except Exception as e:
        print(f"Error watering plant {name}: {e}")

def parse_watering_time(time_str: str) -> tuple:
    """
    Parse the watering time string to hour and minute
    Format can be "HH:MM" in 24-hour format
    """
    try:
        hour, minute = time_str.split(":")
        return int(hour), int(minute)
    except ValueError:
        # Default to midnight if parsing fails
        return 0, 0

def create_plant_dag(
    plant_id: str, 
    plant_name: str, 
    watering_interval: int, 
    watering_time: str, 
    duration: int,
    user_id: str,
    active: bool = True,
    start_date: Optional[datetime] = None
) -> Optional[DAG]:

    """
    Creates a DAG specific to a plant
    """
    if not active:
        print(f"Skipping inactive plant: {plant_id}")
        return None

    dag_id = f"plant_{plant_id}_watering"
    
    if start_date is None:
        start_date = datetime.now()
    
    default_args = {
        'owner': 'airflow',
        'depends_on_past': False,
        'start_date': start_date,
        'email_on_failure': False,
        'email_on_retry': False,
        'retries': 1,
        'retry_delay': timedelta(minutes=5),
    }
    
    # Find cron expression based on the plant's watering time
    hour, minute = parse_watering_time(watering_time)
    schedule = f"{minute} {hour} */{watering_interval} * *"
    
    dag = DAG(
        dag_id,
        default_args=default_args,
        description=f'Water {plant_name}',
        schedule_interval=schedule,
        catchup=False,
    )
    
    # Define water task
    PythonOperator(
        task_id=f'water_{plant_id}',
        python_callable=water_plant_task,
        op_kwargs={'plant_id': plant_id},
        dag=dag,
    )
    
    return dag 