from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import logging
import os
import json
from pathlib import Path
import dotenv
import sys

# Add the backend directory to the Python path
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

# Load environment variables
dotenv_path = backend_path / ".env"
dotenv.load_dotenv(dotenv_path)
USER_UID = os.getenv("USER_UID")

if not USER_UID:
    raise ValueError("USER_UID not found in environment variables")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(backend_path / "sproutsynch.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("sproutsynch.continuous_sync")

def sync_with_website(**kwargs):
    """Sync with the SproutSynch website to check for plant updates"""
    logger.info(f"Starting sync with website for user {USER_UID}")
    
    try:
        # Import here to avoid circular imports
        from api_client import get_api_data
        from dag_factory import create_dag_files
        
        # Get current plant data
        plant_data = get_api_data(USER_UID)
        plants = plant_data.get('plants', [])
        logger.info(f"Retrieved {len(plants)} plants from API")
        
        # Store current state in a file for comparison
        state_file = backend_path / "current_state.json"
        current_state = {
            "timestamp": datetime.now().isoformat(),
            "plants": plants
        }
        
        # Check if we need to update DAGs
        needs_update = True
        if state_file.exists():
            with open(state_file, 'r') as f:
                previous_state = json.load(f)
                if previous_state.get("plants") == plants:
                    needs_update = False
                    logger.info("No changes detected in plant data")
        
        if needs_update:
            logger.info("Changes detected in plant data, updating DAGs...")
            # Update the state file
            with open(state_file, 'w') as f:
                json.dump(current_state, f, indent=2)
            
            # Regenerate DAGs
            dags_dir = backend_path / "dags"
            success = create_dag_files(dags_dir)
            
            if success:
                logger.info("Successfully updated DAGs")
            else:
                logger.error("Failed to update DAGs")
        
        return {
            "timestamp": datetime.now().isoformat(),
            "plants_count": len(plants),
            "needs_update": needs_update,
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
    'continuous_sync_dag',
    default_args=default_args,
    description='Continuous sync with SproutSynch website for updates',
    schedule_interval='*/10 * * * *',  # Run every 10 minutes
    start_date=datetime(2023, 1, 1),
    catchup=False,
)

sync_task = PythonOperator(
    task_id='sync_with_website',
    python_callable=sync_with_website,
    dag=dag,
) 