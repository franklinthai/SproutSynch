"""
First-time setup script for SproutSynch hardware.
1. Install required dependencies
2. Register the device with a user account
3. Configure hardware settings
4. Setup Airflow for scheduling
"""

import os
import sys
import json
import uuid
import subprocess
import argparse
from typing import Dict, Any, Optional
import shutil
import getpass

# Add backend directory to path for imports
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..'))
from hardware.utils import get_hardware_config

# Try importing Firebase modules, install if missing
try:
    from database.firebase.client import get_firestore_client
except ImportError:
    print("Firebase modules not found. Installing dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "../../requirements.txt"])
    from database.firebase.client import get_firestore_client

def create_venv():
    """Create a virtual environment for the project"""
    venv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../venv')
    
    if os.path.exists(venv_path):
        print("Virtual environment already exists.")
        return venv_path
        
    print("Creating virtual environment...")
    subprocess.run([sys.executable, "-m", "venv", venv_path])
    
    # Install dependencies in the venv
    pip_path = os.path.join(venv_path, 'bin', 'pip') if os.name != 'nt' else os.path.join(venv_path, 'Scripts', 'pip')
    
    print("Installing dependencies...")
    requirements_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../requirements.txt')
    subprocess.run([pip_path, "install", "-r", requirements_path])
    
    return venv_path

def test_hardware_connection() -> bool:
    """Test connection to hardware components"""
    try:
        import RPi.GPIO as GPIO

        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)

        config = get_hardware_config()

        for relay_id, relay_data in config.get("relays", {}).items():
            pin = relay_data.get("pin")
            if pin:
                print(f"Testing relay {relay_id} on pin {pin}...")
                GPIO.setup(pin, GPIO.OUT)
                GPIO.output(pin, GPIO.HIGH)
                import time
                time.sleep(1)
                GPIO.output(pin, GPIO.LOW)

        GPIO.cleanup()
        return True

    except ImportError:
        print("RPi.GPIO module not found. Are you running on a Raspberry Pi?")
        return False
    except Exception as e:
        print(f"Error testing hardware: {e}")
        return False

def register_device(user_id: str, device_name: Optional[str] = None) -> str:
    """
    Register the device with a user account
    
    Args:
        user_id: User ID to associate with this device
        device_name: Optional name for this device
        
    Returns:
        Device ID
    """
    if not device_name:
        device_name = "SproutSynch Device"
    
    # Generate a unique device ID
    device_id = str(uuid.uuid4())
    
    # Get Firestore client
    db = get_firestore_client()
    
    # Add device to user's devices collection
    db.collection('users').document(user_id).collection('devices').document(device_id).set({
        'name': device_name,
        'registered_date': datetime.now().isoformat(),
        'last_online': datetime.now().isoformat(),
        'status': 'active'
    })
    
    # Update local config file
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'device_config.json')
    
    # Load existing config if it exists
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
    else:
        # Create default config
        config = {
            "relays": {
                "1": {"pin": 17, "name": "Relay 1"},
                "2": {"pin": 18, "name": "Relay 2"},
                "3": {"pin": 27, "name": "Relay 3"},
                "4": {"pin": 22, "name": "Relay 4"}
            }
        }
    
    # Update with user and device info
    config["user_id"] = user_id
    config["device_id"] = device_id
    config["device_name"] = device_name
    
    # Save updated config
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=4)
        
    print(f"Device registered with ID: {device_id}")
    return device_id

def setup_airflow():
    """Setup Airflow for scheduling"""
    # Create Airflow home directory
    airflow_home = os.path.expanduser("~/airflow")
    os.environ["AIRFLOW_HOME"] = airflow_home
    
    if not os.path.exists(airflow_home):
        os.makedirs(airflow_home)
    
    # Initialize Airflow database
    subprocess.run(["airflow", "db", "init"])
    
    # Create symbolic links to our DAGs
    dags_dir = os.path.join(airflow_home, "dags")
    if not os.path.exists(dags_dir):
        os.makedirs(dags_dir)
    
    # Link all DAGs from our project
    project_dags_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../dags')
    for dag_file in os.listdir(project_dags_dir):
        if dag_file.endswith(".py"):
            src = os.path.join(project_dags_dir, dag_file)
            dst = os.path.join(dags_dir, dag_file)
            if os.path.exists(dst):
                os.remove(dst)
            os.symlink(src, dst)
    
    # Create Airflow service
    service_file = """[Unit]
Description=Airflow scheduler daemon
After=network.target

[Service]
User=pi
Group=pi
Type=simple
ExecStart=/home/pi/venv/bin/airflow scheduler
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
"""
    
    service_path = "/etc/systemd/system/airflow-scheduler.service"
    try:
        with open(service_path, 'w') as f:
            f.write(service_file)
        
        subprocess.run(["sudo", "systemctl", "daemon-reload"])
        subprocess.run(["sudo", "systemctl", "enable", "airflow-scheduler"])
        subprocess.run(["sudo", "systemctl", "start", "airflow-scheduler"])
        print("Airflow service installed and started")
    except PermissionError:
        print(f"Could not create service file at {service_path}. Please run as root or with sudo.")
        print("Manual steps to set up the Airflow service:")
        print(f"1. Create {service_path} with the following content:")
        print(service_file)
        print("2. Run: sudo systemctl daemon-reload")
        print("3. Run: sudo systemctl enable airflow-scheduler")
        print("4. Run: sudo systemctl start airflow-scheduler")

def main():
    parser = argparse.ArgumentParser(description="First-time setup for SproutSynch device")
    parser.add_argument("--user-id", help="User ID to associate with this device")
    parser.add_argument("--device-name", help="Name for this device", default="SproutSynch Device")
    parser.add_argument("--skip-hardware-test", action="store_true", help="Skip hardware connection test")
    parser.add_argument("--skip-airflow", action="store_true", help="Skip Airflow setup")
    args = parser.parse_args()
    
    print("SproutSynch Device Setup")
    print("=======================")
    
    # Create virtual environment
    venv_path = create_venv()
    print(f"Virtual environment created at: {venv_path}")
    
    # Test hardware connection
    if not args.skip_hardware_test:
        if test_hardware_connection():
            print("Hardware connection test successful")
        else:
            print("Hardware connection test failed. Please check your connections.")
            if input("Continue anyway? (y/n): ").lower() != 'y':
                sys.exit(1)
    
    # Register device
    user_id = args.user_id
    if not user_id:
        user_id = input("Enter the user ID to associate with this device: ")
    
    device_name = args.device_name
    if not device_name:
        device_name = input("Enter a name for this device [SproutSynch Device]: ")
        if not device_name:
            device_name = "SproutSynch Device"
    
    register_device(user_id, device_name)
    
    # Setup Airflow
    if not args.skip_airflow:
        setup_airflow()
    
    print("\nSetup complete!")
    print("Your SproutSynch device is now ready to water your plants.")

if __name__ == "__main__":
    try:
        from datetime import datetime
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "datetime"])
        from datetime import datetime
        
    main()