from datetime import datetime, timedelta, timezone
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
import logging
from backend.api_client import display_plant_data, get_plants_needing_water, update_last_watered

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

def simulate_watering_and_update(uid, **kwargs):
    """
    Task function to simulate watering a plant and update the last_watered timestamp
    This is for testing the update_last_watered functionality
    """
    logger = logging.getLogger("airflow.task")
    
    try:
        # Get plant data
        from backend.api_client import get_api_data
        data = get_api_data(uid)
        plants = data.get('plants', [])
        
        if not plants:
            logger.warning("No plants found for simulation")
            return {"status": "failed", "reason": "no plants found"}
        
        # Select the first active plant for simulation
        test_plant = None
        for plant in plants:
            if plant.get('active', True):
                test_plant = plant
                break
        
        if not test_plant:
            logger.warning("No active plants found for simulation")
            return {"status": "failed", "reason": "no active plants"}
        
        plant_name = test_plant.get('name', 'Unknown Plant')
        logger.info(f"Simulating watering for plant: {plant_name}")
        
        # Get current UTC time for the timestamp
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Update the last_watered timestamp
        logger.info(f"Updating last_watered timestamp to: {current_time}")
        success = update_last_watered(uid, plant_name, current_time)
        
        if success:
            logger.info(f"Successfully updated last_watered for {plant_name}")
            return {
                "status": "success",
                "plant_name": plant_name,
                "timestamp": current_time
            }
        else:
            logger.error(f"Failed to update last_watered for {plant_name}")
            return {
                "status": "failed", 
                "reason": "API update failed",
                "plant_name": plant_name
            }
    
    except Exception as e:
        logger.error(f"Error in simulate_watering_and_update: {e}")
        return {"status": "error", "error": str(e)}

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

# Task to test the last_watered update functionality
test_update_task = PythonOperator(
    task_id='test_watering_update',
    python_callable=simulate_watering_and_update,
    op_kwargs={'uid': SAMPLE_USER_ID},
    dag=dag,
)

# Define task dependencies
fetch_plant_data_task >> test_update_task 