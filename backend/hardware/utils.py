import os
import json
from typing import Dict, Any

# Load device configuration (maps user to device and relays)
def get_hardware_config() -> Dict[str, Any]:
    """
    Load the device configuration from the config file
    """
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                              '/setup/hardware_config.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Device configuration not found. Please run setup first.")
        return {"user_id": None, "device_id": None, "relays": {}}
    except json.JSONDecodeError:
        print("Invalid device configuration. Please run setup again.")
        return {"user_id": None, "device_id": None, "relays": {}}