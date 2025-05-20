import requests
import time
from datetime import datetime, timezone

def get_api_data(uid):
    """
    Performs a GET request to the API with a specified UID.
    
    Args:
        uid: The user ID to be sent as a query parameter
        
    Returns:
        dict: The parsed JSON response as a dictionary
    """
    url = "https://sprout-synch.vercel.app/api"
    params = {"uid": uid}
    
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except (requests.exceptions.RequestException, requests.exceptions.HTTPError) as e:
            if attempt < max_retries - 1:
                print(f"Request failed: {e}. Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"All {max_retries} attempts failed.")
                raise

def update_last_watered(uid, plant_name, timestamp=None):
    """
    Performs a PUT request to update the last_watered field for a specific plant.
    
    Args:
        uid: The user ID
        plant_name: The name of the plant that was watered
        timestamp: Optional ISO-formatted timestamp. If None, the current UTC time is used.
        
    Returns:
        bool: True if the update was successful, False otherwise
    """
    # API endpoint
    url = "https://e12f-205-175-106-236.ngrok-free.app/api/water"
    
    # Use current UTC time if no timestamp provided
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()
    
    # Prepare the data for the PUT request
    data = {
        "uid": uid,
        "plant_name": plant_name,
        "last_watered": timestamp
    }
    
    # Configure retry settings
    max_retries = 3
    retry_delay = 2
    
    # Attempt the request with retries
    for attempt in range(max_retries):
        try:
            response = requests.put(url, json=data)
            response.raise_for_status()
            
            # Log the successful update
            print(f"Successfully updated last_watered for plant '{plant_name}' to {timestamp}")
            return True
            
        except (requests.exceptions.RequestException, requests.exceptions.HTTPError) as e:
            if attempt < max_retries - 1:
                print(f"Update failed: {e}. Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"All {max_retries} attempts to update last_watered failed: {e}")
                return False

def display_plant_data(uid):
    """
    Fetches plant data for the given UID and prints it in a formatted way.
    
    Args:
        uid: The user ID to get plant data for
    """
    try:
        data = get_api_data(uid)
        plants = data.get('plants', [])
        
        if not plants:
            print("No plants found for this user.")
            return
        
        print("\n" + "="*50)
        print(f"PLANT DATA FOR USER: {uid}")
        print("="*50)
        
        for i, plant in enumerate(plants, 1):
            name = plant.get('name', 'Unknown')
            species = plant.get('species', 'Unknown')
            description = plant.get('description', '')
            last_watered = plant.get('last_watered', 'Never')
            active = plant.get('active', False)
            pipe_id = plant.get('pipe_id', 'N/A')
            interval = plant.get('interval', 'N/A')
            duration = plant.get('duration', 'N/A')
            
            status = "ACTIVE" if active else "INACTIVE"
            
            print(f"\nPlant #{i}: {name} ({species}) - {status}")
            if description:
                print(f"  Description: {description}")
            print(f"  Last Watered: {last_watered}")
            print(f"  Watering Schedule: {duration} seconds every {interval} hours")
            print(f"  Pipe ID: {pipe_id}")
        
        print("\n" + "="*50 + "\n")
    except Exception as e:
        print(f"Error fetching or displaying plant data: {e}")

def get_plants_needing_water(uid, moisture_threshold=25):
    """
    Returns a list of plants that have moisture levels below the threshold.
    
    Args:
        uid: The user ID to get plant data for
        moisture_threshold: Percentage below which a plant needs watering (default: 25%)
        
    Returns:
        tuple: (list of plants needing water, total plant count)
    """
    try:
        data = get_api_data(uid)
        plants = data.get('plants', [])
        total_plants = len(plants)
        
        plants_needing_water = []
        
        for plant in plants:
            name = plant.get('name', 'Unknown')
            moisture = plant.get('moisture_level')
            
            # Skip plants with no moisture data
            if moisture is None:
                continue
                
            try:
                moisture_value = float(moisture)
                if moisture_value < moisture_threshold:
                    plants_needing_water.append({
                        'name': name,
                        'species': plant.get('species', 'Unknown'),
                        'moisture': moisture_value,
                        'pipe_id': plant.get('pipe_id', 'N/A')
                    })
            except (ValueError, TypeError):
                # Skip plants with invalid moisture values
                continue
                
        return plants_needing_water, total_plants
    except Exception as e:
        print(f"Error checking plants needing water: {e}")
        return [], 0

if __name__ == "__main__":
    print("SproutSynch API Client - Test Script")
    print("=" * 50)
    
    # You can replace this with your actual user ID
    # TEST_UID = "CJYDOOtxeShTEcIUQepJIt5sQa02"
    TEST_UID = "IbRVlsm2dKfP0sR7WrjQKY9IRMC2"
    
    # Test 1: Basic API connection
    print("\n[TEST 1] Basic API Connection")
    try:
        print(f"Fetching data for user: {TEST_UID}")
        data = get_api_data(TEST_UID)
        plants = data.get('plants', [])
        print(f"✓ Connection successful! Found {len(plants)} plants in the response.")
        
        # Print first 100 characters of the raw response for debugging
        print(f"Sample response: {str(data)[:100]}...")
    except Exception as e:
        print(f"✗ Connection failed: {e}")
    
    # Test 2: Display formatted plant data
    print("\n[TEST 2] Display Formatted Plant Data")
    try:
        display_plant_data(TEST_UID)
        print("✓ Plant data displayed successfully.")
    except Exception as e:
        print(f"✗ Display function failed: {e}")
    
    # Test 3: Check plants needing water
    print("\n[TEST 3] Check Plants Needing Water")
    try:
        # Try with different thresholds
        thresholds = [25, 50, 75]
        for threshold in thresholds:
            plants_needing_water, total = get_plants_needing_water(TEST_UID, threshold)
            print(f"With {threshold}% threshold: {len(plants_needing_water)} of {total} plants need water.")
            
            # Show details of plants needing water
            if plants_needing_water:
                print("  Plants needing water:")
                for i, plant in enumerate(plants_needing_water, 1):
                    print(f"  {i}. {plant['name']} - Moisture: {plant['moisture']}%")
        print("✓ Water check successful.")
    except Exception as e:
        print(f"✗ Water check failed: {e}")
    
    # Test 4: Test update last_watered functionality
    print("\n[TEST 4] Update Last Watered")
    try:
        # Get the first plant from the user's plants to test with
        data = get_api_data(TEST_UID)
        plants = data.get('plants', [])
        
        if plants:
            test_plant = plants[0]
            plant_name = test_plant.get('name', 'Test Plant')
            
            print(f"Testing last_watered update for plant: {plant_name}")
            # Use current UTC time for the test
            current_time = datetime.now(timezone.utc).isoformat()
            
            success = update_last_watered(TEST_UID, plant_name, current_time)
            if success:
                print(f"✓ Successfully updated last_watered for {plant_name} to {current_time}")
            else:
                print(f"✗ Failed to update last_watered for {plant_name}")
        else:
            print("Cannot test last_watered update: No plants found for this user.")
    except Exception as e:
        print(f"✗ Update last_watered test failed: {e}")
    
    # Test 5: Test retry mechanism (optional - requires mocking)
    print("\n[TEST 5] Retry Mechanism")
    print("Note: This is a simulated test to demonstrate retry behavior.")
    print("To properly test retries, you would need to use mocking libraries.")
    print("For now, we'll just show how it would work in theory.")
    
    print("\nTest completed! You can use this file as a module or run it directly for testing.")
    print("=" * 50) 