from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python_operator import PythonOperator

# Define default arguments
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Define the DAG
dag = DAG(
    'iot_watering_pipeline',
    default_args=default_args,
    description='IoT Watering App Pipeline',
    schedule_interval=timedelta(hours=1),
    start_date=datetime(2025, 1, 22),
    catchup=False,
)

# Define Python functions for tasks
def fetch_sensor_data():
    # Simulate reading moisture level from a sensor
    print("Fetching moisture sensor data...")
    moisture_level = 40  # Simulated value
    return moisture_level

def decide_watering(moisture_level):
    # Simulate a decision
    if moisture_level < 50:
        print("Moisture low: Watering required.")
        return True
    print("Moisture sufficient: No watering needed.")
    return False

def trigger_watering(decision):
    if decision:
        print("Activating water pump...")
        # Code to trigger GPIO pins for water pump
    else:
        print("Skipping watering cycle.")

# Define tasks
fetch_data = PythonOperator(
    task_id='fetch_sensor_data',
    python_callable=fetch_sensor_data,
    dag=dag,
)

make_decision = PythonOperator(
    task_id='make_decision',
    python_callable=decide_watering,
    op_kwargs={'moisture_level': '{{ ti.xcom_pull(task_ids="fetch_sensor_data") }}'},
    dag=dag,
)

execute_watering = PythonOperator(
    task_id='execute_watering',
    python_callable=trigger_watering,
    op_kwargs={'decision': '{{ ti.xcom_pull(task_ids="make_decision") }}'},
    dag=dag,
)

# Define task dependencies
fetch_data >> make_decision >> execute_watering
