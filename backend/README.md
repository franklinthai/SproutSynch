# SproutSynch Backend

This directory contains the backend components for the SproutSynch plant watering system.

## Overview

SproutSynch backend is responsible for:

1. Communicating with the SproutSynch web app to get plant configurations
2. Controlling the watering hardware based on plant schedules
3. Managing the automatic watering schedules through Airflow DAGs

## Components

- **api_client.py**: Handles communication with the SproutSynch web API
- **hardware_controller.py**: Controls the watering hardware (pumps)
- **hardware_setup.py**: First-time setup script to configure the hardware with your account
- **dag_factory.py**: Generates Airflow DAGs based on plant configurations
- **sproutsynch_polling_dag.py**: Example polling DAG that checks plant data periodically

## Setup Instructions

### 1. First-time Setup

Run the hardware setup script to connect your SproutSynch hardware to your account:

```bash
python hardware_setup.py
```

This will:
- Prompt you to log in with your SproutSynch account credentials
- Save your user ID to the .env file
- Test the connection to the API

### 2. Generate DAGs

After setup, generate the Airflow DAGs based on your plants:

```bash
python dag_factory.py
```

This will:
- Fetch your plant configurations from the API
- Generate watering DAGs for each active plant
- Create a daily sync DAG to check for plant configuration updates

### 3. Test Hardware Controller

To test that the hardware controller is working correctly:

```bash
python hardware_controller.py
```

This runs a series of tests to verify that the pump activation and deactivation works.

## Integration with Airflow

The SproutSynch backend is designed to work with Apache Airflow. After generating the DAGs, you should:

1. Make sure Airflow is installed: `pip install apache-airflow`
2. Configure your Airflow home directory
3. Copy or symlink the generated DAGs to your Airflow DAGs folder
4. Start the Airflow scheduler: `airflow scheduler`

## Development Notes

- The hardware controller has placeholders for actual GPIO control - replace these with your actual hardware integration code.
- The login process in hardware_setup.py is a simplified example - adjust it to match your actual authentication flow.
- For testing and development, you can run each component individually before integrating with Airflow.

## Troubleshooting

- Check the log files (sproutsynch.log and hardware.log) for detailed error information
- Verify that your .env file contains the correct USER_UID
- Test the API connection using the test function in api_client.py
- Make sure your hardware is properly connected and configured 