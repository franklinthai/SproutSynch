import time
import logging
import threading
from pathlib import Path
import platform
import serial
import serial.tools.list_ports
import os
import dotenv

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

class PumpController:
    """
    Controller for water pumps and servo motor through Arduino serial commands.
    Handles activation and deactivation of pumps and controls servo rotation.
    """
    
    def __init__(self):
        """Initialize the pump controller and set up serial connection."""
        self.is_initialized = False
        self.serial_initialized = False
        self.current_pipe_id = 0  # Track current pipe position
        self.ser = None
        
        try:
            # Find Arduino port
            arduino_ports = [p for p in serial.tools.list_ports.comports() if 'Arduino' in p.description]
            if not arduino_ports:
                # Try fallback method
                for p in serial.tools.list_ports.comports():
                    if p.vid and p.pid:  # If it has vendor and product IDs
                        arduino_ports = [p]
                        break
            
            if arduino_ports:
                self.arduino_port = arduino_ports[0].device
                self.ser = serial.Serial(self.arduino_port, 9600, timeout=1)
                time.sleep(2)  # Wait for Arduino to reset
                self.serial_initialized = True
                logger.info(f"Serial connection initialized on port {self.arduino_port}")
            
            self.is_initialized = True
            logger.info("Pump controller initialized")
        except Exception as e:
            logger.error(f"Failed to initialize pump controller: {e}")
    
    def select_pipe(self, pipe_id: int):
        """
        Send command to Arduino to select a specific pipe.
        
        Args:
            pipe_id: Target pipe ID (0-3)
        """
        if pipe_id not in range(4):
            logger.warning(f"Invalid pipe ID: {pipe_id}, ignoring")
            return False
        
        if not self.serial_initialized:
            logger.error("Serial connection not initialized")
            return False
        
        try:
            # Send command to Arduino
            self.ser.write(f"{pipe_id}\n".encode())
            time.sleep(0.5)  # Wait for Arduino to process
            
            # Update current position
            self.current_pipe_id = pipe_id
            logger.info(f"Now at pipe {pipe_id}")
            return True
        except Exception as e:
            logger.error(f"Error selecting pipe {pipe_id}: {e}")
            return False
    
    def activate_pump(self, pipe_id, duration_seconds):
        """
        Activate the water pump for a specific pipe.
        
        Args:
            pipe_id: The ID of the pipe to activate
            duration_seconds: How long to run the pump in seconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.is_initialized:
            logger.error("Cannot activate pump: Controller not initialized")
            return False
        
        try:
            logger.info(f"Activating pump for pipe ID {pipe_id} for {duration_seconds} seconds")
            
            # First select the correct pipe
            if not self.select_pipe(pipe_id):
                return False
            
            # Create a timer thread to deactivate after duration
            timer = threading.Timer(duration_seconds, self.deactivate_pump, args=[pipe_id])
            
            # Store the active pump thread
            with pump_lock:
                active_pumps[pipe_id] = {
                    'start_time': time.time(),
                    'duration': duration_seconds,
                    'timer': timer
                }
            
            # Start the timer thread
            timer.start()
            
            return True
        except Exception as e:
            logger.error(f"Error activating pump for pipe {pipe_id}: {e}")
            return False
    
    def deactivate_pump(self, pipe_id):
        """
        Deactivate the water pump for a specific pipe.
        
        Args:
            pipe_id: The ID of the pipe to deactivate
            
        Returns:
            bool: True if successful, False otherwise
        """
        with pump_lock:
            if pipe_id not in active_pumps:
                logger.warning(f"Pump for pipe {pipe_id} is not active")
                return False
            
            pump_info = active_pumps.pop(pipe_id)
        
        try:
            logger.info(f"Deactivating pump for pipe ID {pipe_id}")
            
            active_duration = time.time() - pump_info['start_time']
            logger.info(f"Pump for pipe {pipe_id} was active for {active_duration:.2f} seconds")
            
            return True
        except Exception as e:
            logger.error(f"Error deactivating pump for pipe {pipe_id}: {e}")
            return False
    
    def get_active_pumps(self):
        """Get a list of currently active pumps."""
        with pump_lock:
            return {pid: {
                'duration': info['duration'],
                'elapsed': time.time() - info['start_time']
            } for pid, info in active_pumps.items()}
    
    def emergency_stop(self):
        """
        Emergency stop all pumps.
        
        Returns:
            bool: True if successful, False otherwise
        """
        logger.warning("EMERGENCY STOP: Deactivating all pumps")
        
        with pump_lock:
            active_pipe_ids = list(active_pumps.keys())
        
        success = True
        for pipe_id in active_pipe_ids:
            if not self.deactivate_pump(pipe_id):
                success = False
        
        return success
    
    def cleanup(self):
        """Clean up resources when done."""
        # Stop all active pumps first
        self.emergency_stop()
        
        # Close serial connection
        if self.serial_initialized and self.ser:
            try:
                self.ser.close()
                logger.info("Serial connection closed")
            except Exception as e:
                logger.error(f"Error closing serial connection: {e}")

# Create a singleton instance to be used by other modules
controller = PumpController()

def water_plant(pipe_id, duration_seconds):
    """
    Water a specific plant using its pipe_id.
    
    Args:
        pipe_id: The ID of the pipe/plant to water
        duration_seconds: How long to run the pump in seconds
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # First select the correct pipe using the servo
        if not controller.select_pipe(pipe_id):
            return False
        
        # Then activate the pump for the specified duration
        success = controller.activate_pump(pipe_id, duration_seconds)
        
        if success:
            logger.info(f"Successfully watered plant at pipe {pipe_id} for {duration_seconds} seconds")
            return True
        else:
            logger.error(f"Failed to water plant at pipe {pipe_id}")
            return False
            
    except Exception as e:
        logger.error(f"Error watering plant at pipe {pipe_id}: {e}")
        return False

if __name__ == "__main__":
    print("Hardware Controller Test")
    print("=" * 50)

    # Load environment variables
    dotenv_path = Path(__file__).parent / ".env"
    dotenv.load_dotenv(dotenv_path)
    USER_UID = os.getenv("USER_UID")

    if not USER_UID:
        print("Error: USER_UID not found in .env file")
        exit(1)

    # Step 1: Test Arduino connection
    print("\n1. Testing Arduino connection...")
    arduino_ports = [p for p in serial.tools.list_ports.comports() if 'Arduino' in p.description]

    arduino_port = ""
    
    if not arduino_ports:
        # print("No Arduino found! Testing fallback.")
        if not arduino_ports:
            # Try matching by vendor ID or product ID if needed
            flag = False
            for p in serial.tools.list_ports.comports():
                flag = True
                arduino_port = p.device
                print(p.device, p.description, p.vid, p.pid)
            if not flag:
                print("Still error")
                exit(1)

    # Step 2: Test servo movement
    print("\n2. Testing servo movement...")
    try:
        # Test position 1 (60 degrees)
        print("Moving to position 1 (60 degrees)...")
        controller.ser.write(b'1\n')
        time.sleep(2)
        
        # Test position 2 (160 degrees)
        print("Moving to position 2 (160 degrees)...")
        controller.ser.write(b'2\n')
        time.sleep(2)
        
        # Return to position 0
        print("Returning to position 0...")
        controller.ser.write(b'0\n')
        time.sleep(2)
        
        print("Servo movement test completed!")
        
    except Exception as e:
        print(f"Error controlling servo: {e}")
        exit(1)

    # Step 3: Test water_plant function
    print("\n3. Testing water_plant function...")
    try:
        # Test watering pipe 0 for 3 seconds
        print("Testing watering for pipe 0 (3 seconds)...")
        success = water_plant(pipe_id=0, duration_seconds=3)
        
        if success:
            print("Watering test successful!")
        else:
            print("Watering test failed!")
            
    except Exception as e:
        print(f"Error during watering test: {e}")
        exit(1)
    finally:
        controller.ser.close()
        print("\nAll tests completed!")