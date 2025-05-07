#!/usr/bin/env python3
"""
Utility script to manually update the last_watered timestamp for a plant.
This is useful for testing the API update functionality or for manual overrides.

Usage:
  python update_last_watered.py --uid USER_ID --plant-name "Plant Name"
  
Options:
  --uid UID             User ID (required)
  --plant-name NAME     Plant name (required)
  --timestamp TIME      Timestamp in ISO format (optional, defaults to current UTC time)
"""

import argparse
from datetime import datetime, timezone
import sys
import os

# Add the current directory to the Python path if needed
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

# Import the API client
from api_client import update_last_watered, get_api_data, display_plant_data

def parse_args():
    parser = argparse.ArgumentParser(description='Update last_watered timestamp for a plant')
    parser.add_argument('--uid', required=True, help='User ID')
    parser.add_argument('--plant-name', required=True, help='Plant name')
    parser.add_argument('--timestamp', help='Timestamp in ISO format (defaults to current UTC time)')
    
    return parser.parse_args()

def main():
    # Parse command line arguments
    args = parse_args()
    
    # Get timestamp (use current UTC time if not provided)
    timestamp = args.timestamp
    if not timestamp:
        timestamp = datetime.now(timezone.utc).isoformat()
    
    print(f"==== SproutSynch Last Watered Update Utility ====")
    print(f"User ID: {args.uid}")
    print(f"Plant Name: {args.plant_name}")
    print(f"Timestamp: {timestamp}")
    print("=" * 48)
    
    # Show current plant data
    print("\nCurrent Plant Data:")
    display_plant_data(args.uid)
    
    # Confirm before proceeding
    confirmation = input("\nUpdate last_watered timestamp? (y/n): ")
    if confirmation.lower() != 'y':
        print("Update cancelled.")
        return
    
    # Perform the update
    print(f"\nUpdating last_watered timestamp to {timestamp}...")
    success = update_last_watered(args.uid, args.plant_name, timestamp)
    
    if success:
        print("Update successful!")
        
        # Show updated plant data
        print("\nUpdated Plant Data:")
        display_plant_data(args.uid)
    else:
        print("Update failed. Please check the logs for more information.")

if __name__ == "__main__":
    main() 