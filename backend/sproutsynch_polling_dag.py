from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
import logging
from backend.api_client import display_plant_data, get_plants_needing_water

# Define default arguments for the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}

# Sample user ID - replace with actual user ID or implement logic to handle multiple users
SAMPLE_USER_ID = "CJYDOOtxeShTEcIUQepJIt5sQa02"
MOISTURE_THRESHOLD = 25  # Percentage threshold for low moisture warning

def fetch_and_display_plants(uid, **kwargs):
    """
    Task function to fetch and display plant data with additional logging
    """
    logger = logging.getLogger("airflow.task")
    run_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info(f"Task running at: {run_time}")
    
    # Call the display function for console output
    display_plant_data(uid)
    
    # Get plants needing water and log warnings
    plants_needing_water, total_plants = get_plants_needing_water(uid, MOISTURE_THRESHOLD)
    
    logger.info(f"Synced {total_plants} plants from API for user {uid}")
    
    # Log warnings for plants that need watering
    if plants_needing_water:
        logger.warning(f"{len(plants_needing_water)} plants need watering (moisture below {MOISTURE_THRESHOLD}%):")
        for plant in plants_needing_water:
            logger.warning(f"  LOW MOISTURE: {plant['name']} (Pipe #{plant['pipe_id']}) - Current moisture: {plant['moisture']}%")
    else:
        logger.info("All plants have adequate moisture levels.")
    
    return {
        "run_time": run_time,
        "total_plants": total_plants,
        "plants_needing_water": len(plants_needing_water)
    }

dag = DAG(
    'sproutsynch_polling_dag',
    default_args=default_args,
    description='Poll SproutSynch API for plant data every 5 minutes',
    schedule_interval=timedelta(minutes=5),
    start_date=days_ago(0),
    catchup=False,
)

# Task to fetch and display plant data with enhanced logging
fetch_plant_data_task = PythonOperator(
    task_id='fetch_plant_data',
    python_callable=fetch_and_display_plants,
    op_kwargs={'uid': SAMPLE_USER_ID},
    dag=dag,
)

# You can add more tasks here as needed and define dependencies
# For example: fetch_plant_data_task >> another_task 