import os
import json
from datetime import datetime, timedelta
from pathlib import Path
import logging
import dotenv

# Load environment variables
dotenv_path = Path(__file__).parent / ".env"
dotenv.load_dotenv(dotenv_path)

# Get the user ID from the environment
USER_UID = os.getenv("USER_UID")
if not USER_UID:
    raise ValueError("USER_UID not found in environment variables. Run hardware_setup.py first.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path(__file__).parent / "sproutsynch.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("sproutsynch.dag_factory")

# Airflow DAG default arguments
default_args = {
    'owner': 'sproutsynch',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}

def generate_plant_watering_dag(plant_id, plant_name, interval_hours, duration_seconds):
    """
    Generate an Airflow DAG for a specific plant's watering schedule.
    
    Args:
        plant_id: The plant's unique identifier (pipe_id)
        plant_name: The plant's name for display
        interval_hours: Hours between watering
        duration_seconds: Duration of watering in seconds
    
    Returns:
        str: DAG Python code as a string
    """
    dag_id = f"water_plant_{plant_id}"
    description = f"Water plant: {plant_name} (every {interval_hours} hours for {duration_seconds} seconds)"
    
    # Convert interval hours to a cron expression (e.g., 5 hours = */5 * * * *)
    if interval_hours < 24:
        schedule = f"0 */{interval_hours} * * *"
    else:
        # For intervals >= 24 hours, run at a specific time each day
        days = interval_hours // 24
        hour = 8  # Default to 8 AM
        if days == 1:
            schedule = f"0 {hour} * * *"  # Every day at 8 AM
        else:
            schedule = f"0 {hour} */{days} * *"  # Every N days at 8 AM
    
    # Generate DAG code as a string
    dag_code = f'''
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import logging

def water_plant_{plant_id}(**kwargs):
    """Water plant {plant_name} for {duration_seconds} seconds"""
    logger = logging.getLogger("airflow.task")
    logger.info(f"Watering plant {plant_name} (ID: {plant_id}) for {duration_seconds} seconds")
    
    # TODO: Add actual hardware control code here
    # Example: 
    # from hardware.controller import activate_pump
    # activate_pump(pipe_id={plant_id}, duration_seconds={duration_seconds})
    
    return {{"plant_id": {plant_id}, "duration": {duration_seconds}, "timestamp": datetime.now().isoformat()}}

default_args = {{
    'owner': 'sproutsynch',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}}

dag = DAG(
    '{dag_id}',
    default_args=default_args,
    description='{description}',
    schedule_interval='{schedule}',
    start_date=datetime(2023, 1, 1),
    catchup=False,
)

water_task = PythonOperator(
    task_id='water_plant',
    python_callable=water_plant_{plant_id},
    dag=dag,
)
'''
    return dag_code

def generate_daily_sync_dag():
    """
    Generate a DAG that runs once every 24 hours to sync with the website for updates.
    
    Returns:
        str: DAG Python code as a string
    """
    dag_code = '''
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import logging
import os
import json
from pathlib import Path
import dotenv

# Get the user ID from the environment
dotenv_path = Path(__file__).parent.parent / ".env"
dotenv.load_dotenv(dotenv_path)
USER_UID = os.getenv("USER_UID")

def sync_with_website(**kwargs):
    """Sync with the SproutSynch website to check for plant updates"""
    logger = logging.getLogger("airflow.task")
    logger.info(f"Starting daily sync with website for user {USER_UID}")
    
    # Import here to avoid circular imports
    from backend.api_client import get_api_data
    
    try:
        # Get current plant data
        plant_data = get_api_data(USER_UID)
        plants = plant_data.get('plants', [])
        logger.info(f"Retrieved {len(plants)} plants from API")
        
        # TODO: Compare with previous state and update DAGs if needed
        # For example:
        # 1. Store the current state in a local database or file
        # 2. Compare with previous state to detect changes
        # 3. If changes found, regenerate DAGs
        
        # For demo, just log the plants
        for plant in plants:
            plant_id = plant.get('pipe_id')
            name = plant.get('name')
            active = plant.get('active', False)
            logger.info(f"Plant {name} (ID: {plant_id}) - Active: {active}")
        
        return {
            "timestamp": datetime.now().isoformat(),
            "plants_count": len(plants),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error syncing with website: {e}")
        raise

default_args = {
    'owner': 'sproutsynch',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}

dag = DAG(
    'daily_sync_dag',
    default_args=default_args,
    description='Daily sync with SproutSynch website for updates',
    schedule_interval='0 0 * * *',  # Run at midnight every day
    start_date=datetime(2023, 1, 1),
    catchup=False,
)

sync_task = PythonOperator(
    task_id='sync_with_website',
    python_callable=sync_with_website,
    dag=dag,
)
'''
    return dag_code

def create_dag_files(output_dir):
    """
    Create DAG files based on user's plants from the API.
    
    Args:
        output_dir: Directory to store the generated DAG files
    """
    # Import here to avoid circular imports
    from api_client import get_api_data
    
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Get user's plants from the API
        plant_data = get_api_data(USER_UID)
        plants = plant_data.get('plants', [])
        
        logger.info(f"Retrieved {len(plants)} plants from API")
        
        # Generate plant-specific DAGs for active plants
        for plant in plants:
            plant_id = plant.get('pipe_id')
            name = plant.get('name', f"Plant {plant_id}")
            active = plant.get('active', False)
            interval = plant.get('interval', 24)  # Default to 24 hours if not specified
            duration = plant.get('duration', 5)   # Default to 5 seconds if not specified
            
            # Only create DAGs for active plants
            if active and plant_id is not None:
                logger.info(f"Generating DAG for plant: {name} (ID: {plant_id})")
                
                # Generate DAG code
                dag_code = generate_plant_watering_dag(plant_id, name, interval, duration)
                
                # Write DAG file
                dag_file_path = os.path.join(output_dir, f"water_plant_{plant_id}_dag.py")
                with open(dag_file_path, 'w') as f:
                    f.write(dag_code)
                
                logger.info(f"Created DAG file: {dag_file_path}")
            else:
                logger.info(f"Skipping inactive plant: {name}")
        
        # Generate daily sync DAG
        logger.info("Generating daily sync DAG")
        sync_dag_code = generate_daily_sync_dag()
        sync_dag_path = os.path.join(output_dir, "daily_sync_dag.py")
        with open(sync_dag_path, 'w') as f:
            f.write(sync_dag_code)
        logger.info(f"Created daily sync DAG file: {sync_dag_path}")
        
        return True
    except Exception as e:
        logger.error(f"Error creating DAG files: {e}")
        return False

if __name__ == "__main__":
    # Directory to store the generated DAG files
    # In a real setup, this would be Airflow's DAGs directory
    dags_dir = Path(__file__).parent / "dags"
    
    logger.info(f"Starting DAG generation for user: {USER_UID}")
    success = create_dag_files(dags_dir)
    
    if success:
        logger.info("DAG generation completed successfully!")
        print(f"Generated DAGs in: {dags_dir}")
    else:
        logger.error("DAG generation failed.")
        print("Error: Failed to generate DAGs. Check the logs for details.") 