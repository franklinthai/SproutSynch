import time
import logging
import threading
from pathlib import Path
import platform
import serial
import serial.tools.list_ports
import os
import dotenv
from api_client import *
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path(__file__).parent / "hardware.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("sproutsynch.hardware")

# Global dictionary to track active pumps and their threads
active_pumps = {}
pump_lock = threading.Lock()

class HardwareController:
    def __init__(self, port='/dev/ttyACM0', baud_rate=9600):
        self.port = port
        self.baud_rate = baud_rate
        self.serial = None
        self.connected = False
        
    def connect(self):
        """Establish connection with Arduino"""
        try:
            self.serial = serial.Serial(self.port, self.baud_rate, timeout=1)
            time.sleep(2)  # Wait for Arduino to reset
            self.connected = True
            logger.info(f"Successfully connected to Arduino on {self.port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Arduino: {e}")
            self.connected = False
            return False
            
    def disconnect(self):
        """Close the serial connection"""
        if self.serial and self.serial.is_open:
            self.serial.close()
            self.connected = False
            logger.info("Disconnected from Arduino")
            
    def send_command(self, command):
        """Send a command to Arduino and wait for response"""
        if not self.connected:
            logger.error("Not connected to Arduino")
            return None
            
        try:
            self.serial.write(f"{command}\n".encode())
            response = self.serial.readline().decode().strip()
            logger.debug(f"Sent: {command}, Received: {response}")
            return response
        except Exception as e:
            logger.error(f"Error sending command to Arduino: {e}")
            return None
            
    def test_connection(self):
        """Test the connection with Arduino"""
        if not self.connected:
            return False
            
        response = self.send_command("TEST")
        return response == "OK"
        
    def water_plant(self, pipe_id, duration, uid, plant_name):
        """
        Water a specific plant and update the last_watered timestamp
        
        Args:
            pipe_id: The ID of the pipe to activate
            duration: Duration in seconds to water the plant
            uid: User ID for API update
            plant_name: Name of the plant being watered
            
        Returns:
            bool: True if watering was successful, False otherwise
        """
        if not self.connected:
            logger.error("Not connected to Arduino")
            return False
            
        try:
            # Send watering command to Arduino
            command = f"WATER {pipe_id} {duration}"
            response = self.send_command(command)
            
            if response != "OK":
                logger.error(f"Arduino rejected watering command: {response}")
                return False
                
            # Wait for watering to complete
            time.sleep(duration)
            
            # Update last_watered timestamp
            success = update_last_watered(uid, plant_name)
            if not success:
                logger.error("Failed to update last_watered timestamp")
                return False
                
            logger.info(f"Successfully watered plant {plant_name} for {duration} seconds")
            return True
            
        except Exception as e:
            logger.error(f"Error during watering process: {e}")
            return False
            
    def get_moisture(self, pipe_id):
        """Get moisture reading for a specific pipe"""
        if not self.connected:
            return None
            
        response = self.send_command(f"MOISTURE {pipe_id}")
        try:
            return float(response)
        except (ValueError, TypeError):
            logger.error(f"Invalid moisture reading: {response}")
            return None

def test_hardware_controller():
    """Run a comprehensive test of the hardware controller"""
    controller = HardwareController()
    
    print("\n=== SproutSynch Hardware Controller Test ===")
    
    # Test 1: Connection
    print("\n1. Testing Arduino Connection...")
    if not controller.connect():
        print("❌ Failed to connect to Arduino")
        return
    print("✅ Connected to Arduino")
    
    # Test 2: Basic Communication
    print("\n2. Testing Basic Communication...")
    if not controller.test_connection():
        print("❌ Failed to communicate with Arduino")
        controller.disconnect()
        return
    print("✅ Basic communication successful")
    
    # Test 3: Servo Control
    print("\n3. Testing Servo Control...")
    test_pipe = 1
    test_duration = 2
    
    print(f"Testing pipe {test_pipe} for {test_duration} seconds...")
    if not controller.water_plant(test_pipe, test_duration, "TEST_UID", "Test Plant"):
        print("❌ Failed to control servo")
        controller.disconnect()
        return
    print("✅ Servo control successful")
    
    # Test 4: Moisture Sensor
    print("\n4. Testing Moisture Sensor...")
    moisture = controller.get_moisture(test_pipe)
    if moisture is None:
        print("❌ Failed to read moisture")
        controller.disconnect()
        return
    print(f"✅ Moisture reading: {moisture}%")
    
    # Cleanup
    controller.disconnect()
    print("\n✅ All tests completed successfully!")

if __name__ == "__main__":
    test_hardware_controller()