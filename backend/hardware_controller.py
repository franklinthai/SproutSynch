import time
import logging
import threading
from pathlib import Path

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
    Controller for water pumps. Handles activation and deactivation of pumps.
    In a real system, this would interface with GPIO pins on a Raspberry Pi
    or similar hardware to control actual pumps.
    """
    
    def __init__(self):
        """Initialize the pump controller and set up GPIO connections if needed."""
        self.is_initialized = False
        try:
            # This is where you would initialize hardware connections
            # For example:
            # import RPi.GPIO as GPIO
            # GPIO.setmode(GPIO.BCM)
            # self.setup_pins()
            
            # For simulation, we just log
            logger.info("Initializing pump controller")
            self.is_initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize pump controller: {e}")
    
    def setup_pins(self):
        """Set up GPIO pins for pump control."""
        # This would configure GPIO pins on actual hardware
        # For example:
        # GPIO.setup(pin, GPIO.OUT)
        pass
    
    def get_pin_for_pipe(self, pipe_id):
        """
        Map pipe_id to a physical GPIO pin.
        
        Args:
            pipe_id: The ID of the pipe/plant
            
        Returns:
            int: GPIO pin number
        """
        # This is a simplified mapping. In a real system, you'd have a proper
        # configuration mapping pipe_ids to physical pins.
        pipe_id_to_pin = {
            1: 17,
            2: 18,
            3: 27,
            4: 22
        }
        return pipe_id_to_pin.get(pipe_id, 17)  # Default to pin 17 if not found
    
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
        
        pin = self.get_pin_for_pipe(pipe_id)
        
        try:
            logger.info(f"Activating pump for pipe ID {pipe_id} (PIN: {pin}) for {duration_seconds} seconds")
            
            # In a real system, you'd activate GPIO here
            # For example:
            # GPIO.output(pin, GPIO.HIGH)
            
            # Create a timer thread to deactivate after duration
            timer = threading.Timer(duration_seconds, self.deactivate_pump, args=[pipe_id])
            
            # Store the active pump thread
            with pump_lock:
                active_pumps[pipe_id] = {
                    'pin': pin,
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
            pin = pump_info['pin']
        
        try:
            logger.info(f"Deactivating pump for pipe ID {pipe_id} (PIN: {pin})")
            
            # In a real system, you'd deactivate GPIO here
            # For example:
            # GPIO.output(pin, GPIO.LOW)
            
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
                'pin': info['pin'],
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
        """Clean up GPIO resources when done."""
        # Stop all active pumps first
        self.emergency_stop()
        
        # Then release GPIO resources in a real system
        # For example:
        # GPIO.cleanup()
        logger.info("Pump controller resources cleaned up")


# Create a singleton instance to be used by other modules
controller = PumpController()

def activate_pump(pipe_id, duration_seconds):
    """
    Convenience function to activate a pump.
    
    Args:
        pipe_id: The ID of the pipe to activate
        duration_seconds: How long to run the pump in seconds
        
    Returns:
        bool: True if successful, False otherwise
    """
    return controller.activate_pump(pipe_id, duration_seconds)

def deactivate_pump(pipe_id):
    """
    Convenience function to deactivate a pump.
    
    Args:
        pipe_id: The ID of the pipe to deactivate
        
    Returns:
        bool: True if successful, False otherwise
    """
    return controller.deactivate_pump(pipe_id)

def emergency_stop():
    """
    Convenience function to perform an emergency stop of all pumps.
    
    Returns:
        bool: True if successful, False otherwise
    """
    return controller.emergency_stop()

def get_active_pumps():
    """
    Convenience function to get all active pumps.
    
    Returns:
        dict: Dictionary of active pumps
    """
    return controller.get_active_pumps()

if __name__ == "__main__":
    # Simple test script for hardware controller
    
    print("SproutSynch Hardware Controller - Test Script")
    print("=" * 50)
    
    # Test 1: Activate a pump
    print("\n[TEST 1] Activate Pump")
    pipe_id = 1
    duration = 5  # 5 seconds
    
    print(f"Activating pump for pipe {pipe_id} for {duration} seconds...")
    result = activate_pump(pipe_id, duration)
    print(f"Activation {'successful' if result else 'failed'}")
    
    # Test 2: Get active pumps
    print("\n[TEST 2] Get Active Pumps")
    print("Waiting 2 seconds...")
    time.sleep(2)
    
    active = get_active_pumps()
    print(f"Active pumps: {active}")
    
    # Test 3: Wait for deactivation
    print("\n[TEST 3] Wait for Auto-Deactivation")
    print(f"Waiting for pump to deactivate (remaining {duration - 2} seconds)...")
    time.sleep(duration - 1)  # Allow a little extra time for the pump to deactivate
    
    active = get_active_pumps()
    print(f"Active pumps after waiting: {active}")
    
    # Test 4: Manual deactivation (for another pump)
    print("\n[TEST 4] Manual Deactivation")
    pipe_id = 2
    print(f"Activating pump for pipe {pipe_id} for 10 seconds...")
    activate_pump(pipe_id, 10)
    
    print("Waiting 2 seconds...")
    time.sleep(2)
    
    print(f"Manually deactivating pump for pipe {pipe_id}...")
    deactivate_pump(pipe_id)
    
    active = get_active_pumps()
    print(f"Active pumps after manual deactivation: {active}")
    
    # Test 5: Emergency stop (with multiple pumps)
    print("\n[TEST 5] Emergency Stop")
    print("Activating multiple pumps...")
    activate_pump(1, 30)
    activate_pump(3, 30)
    
    print("Waiting 2 seconds...")
    time.sleep(2)
    
    print("Performing emergency stop...")
    emergency_stop()
    
    active = get_active_pumps()
    print(f"Active pumps after emergency stop: {active}")
    
    print("\nTest completed!")
    print("=" * 50) 