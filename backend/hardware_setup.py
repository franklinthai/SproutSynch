import os
import requests
import dotenv
import getpass
import re
from pathlib import Path

def login_and_get_uid():
    """
    Simple login process to get user's UID from the SproutSynch API.
    """
    print("\n=== SproutSynch Hardware Setup ===")
    print("Please login with your SproutSynch account credentials.")
    
    email = input("Email: ").strip()
    password = getpass.getpass("Password: ")
    
    # This is a placeholder. In a real implementation, you'd use a proper authentication endpoint
    login_url = "https://e12f-205-175-106-236.ngrok-free.app/api/auth/login"
    try:
        response = requests.post(login_url, json={
            "email": email,
            "password": password
        })
        response.raise_for_status()
        
        # Extract the UID from the response
        auth_data = response.json()
        uid = auth_data.get("uid")
        
        if not uid:
            print("Error: Could not retrieve user ID from login response.")
            return None
            
        return uid
    except requests.exceptions.RequestException as e:
        print(f"Login failed: {e}")
        return None

def update_env_file(uid):
    """
    Updates or creates the .env file with the user's UID.
    """
    env_path = Path(__file__).parent / ".env"
    
    if env_path.exists():
        # Load existing .env file
        dotenv.load_dotenv(env_path)
        
        # Update UID value
        os.environ["USER_UID"] = uid
        
        # Read all lines from the file
        with open(env_path, 'r') as file:
            lines = file.readlines()
        
        # Check if USER_UID already exists and update it
        uid_exists = False
        for i, line in enumerate(lines):
            if line.strip().startswith('USER_UID='):
                lines[i] = f'USER_UID={uid}\n'
                uid_exists = True
                break
        
        # If USER_UID doesn't exist, add it
        if not uid_exists:
            lines.append(f'USER_UID={uid}\n')
        
        # Write back to the file
        with open(env_path, 'w') as file:
            file.writelines(lines)
    else:
        # Create new .env file with UID
        with open(env_path, 'w') as file:
            file.write(f'USER_UID={uid}\n')
    
    print(f"UID has been saved to {env_path}")
    return True

def test_connection(uid):
    """
    Test if we can connect to the API with the given UID.
    """
    from api_client import get_api_data
    
    try:
        data = get_api_data(uid)
        plants = data.get('plants', [])
        print(f"Connection successful! Found {len(plants)} plants for your account.")
        return True
    except Exception as e:
        print(f"Connection test failed: {e}")
        return False

def main():
    """
    Main function to run the setup process.
    """
    print("\nWelcome to SproutSynch Hardware Setup!")
    print("This script will connect your hardware to your SproutSynch account.")
    print("Follow the steps below to complete the setup.\n")
    
    # Step 1: Login to get UID
    uid = login_and_get_uid()
    if not uid:
        print("Setup failed: Could not retrieve user ID.")
        return False
    
    print(f"\nSuccessfully authenticated! Your User ID is: {uid}")
    
    # Step 2: Update .env file
    if not update_env_file(uid):
        print("Setup failed: Could not update environment file.")
        return False
    
    # Step 3: Test connection
    print("\nTesting connection to SproutSynch API...")
    if not test_connection(uid):
        print("Warning: Connection test failed, but setup is complete.")
        print("You may need to check your network connection or contact support.")
    
    print("\nSetup complete! Your SproutSynch hardware is now linked to your account.")
    print("The system will automatically start monitoring and watering your plants.")
    
    return True

if __name__ == "__main__":
    main() 