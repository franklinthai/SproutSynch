# SproutSynch Backend

This directory contains the backend middleware for the SproutSynch automatic plant watering system. It handles communication between the Firebase database and the Raspberry Pi hardware.

## Directory Structure

- `hardware/`: Contains all Raspberry Pi and hardware-related code
  - `dags/`: Airflow DAGs for scheduling watering tasks
  - `scripts/`: Hardware control scripts for interacting with GPIO
  - `setup/`: Setup and installation scripts
- `database/`: Contains all database interactions
  - `firebase/`: Firebase client and services
  - `api/`: API endpoints (for future use)
  - `archives/`: Archive of old implementations (for reference)

## Setup Instructions

### Prerequisites

- Raspberry Pi 4 (or compatible)
- Python 3.8 or higher, 3.11 or lower
- Internet connection
- Firebase account with service account key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/SproutSynch.git
   cd SproutSynch
   ```

2. **Run the installation script:**
   ```bash
   sudo bash backend/hardware/setup/install.sh
   ```

3. **Configure the device:**
   ```bash
   # Replace YOUR_USER_ID with your Firebase user ID
   sudo -u sproutsynch /home/sproutsynch/SproutSynch/venv/bin/python /home/sproutsynch/SproutSynch/backend/hardware/setup/first_time_setup.py --user-id YOUR_USER_ID
   ```

4. **Set up Firebase service account:**
   
   Place your Firebase service account key at:
   ```
   backend/database/firebase/serviceAccountKey.json
   ```
   
   Or set the environment variable:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
   ```

### Manual Installation

If you prefer to install manually:

1. **Create a Python virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install requirements:**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Run the setup script:**
   ```bash
   python backend/hardware/setup/first_time_setup.py
   ```

## Hardware Configuration

The system uses GPIO pins to control relay modules that activate water pumps or valves. Default configuration:

- Relay 1: GPIO 17
- Relay 2: GPIO 18
- Relay 3: GPIO 27
- Relay 4: GPIO 22

You can modify these assignments in `hardware/setup/hardware_config.json`.

## Airflow DAGs

The system uses Apache Airflow to schedule watering tasks:

- `plant_detection_dag.py`: Scans Firebase for new plants and creates individual plant DAGs
- `basic_watering.py`: Simple watering DAG for testing

## Adding Plants

Plants are added through the web frontend and stored in Firebase. The backend periodically checks for new plants and creates appropriate watering schedules.

## Troubleshooting

### Hardware Issues

1. Check GPIO connections
2. Test relays with:
   ```bash
   python -c "import RPi.GPIO as GPIO; GPIO.setmode(GPIO.BCM); GPIO.setup(17, GPIO.OUT); GPIO.output(17, GPIO.HIGH); import time; time.sleep(2); GPIO.output(17, GPIO.LOW); GPIO.cleanup()"
   ```

### Software Issues

1. Check Airflow logs:
   ```bash
   tail -f ~/airflow/logs/plant_detection.log
   ```

2. Check Airflow service status:
   ```bash
   sudo systemctl status airflow-scheduler
   ```

3. Restart Airflow:
   ```bash
   sudo systemctl restart airflow-scheduler
   ```

## Development

### Adding a New Relay

1. Update `hardware_config.json`:
   ```json
   "relays": {
     "5": {"pin": 23, "name": "Relay 5"}
   }
   ```

2. Assign the relay to a plant in Firebase:
   ```python
   from database.firebase.plant_service import assign_relay_to_plant
   assign_relay_to_plant("plant_id", "5", "user_id")
   ```

### Testing

Run tests with:
```bash
pytest backend/tests/
``` 