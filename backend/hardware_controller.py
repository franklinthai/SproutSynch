import time
import logging
import threading
from pathlib import Path
import platform

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
    Controller for water pumps and servo motor for pipe routing.
    Handles activation and deactivation of pumps and controls servo position.
    """
    
    def __init__(self):
        """Initialize the pump controller and set up GPIO connections if needed."""
        self.is_initialized = False
        self.servo_initialized = False
        self.servo_pin = 18  # BCM 18 (GPIO 12)
        self.pwm_frequency = 50  # 50Hz for SG90 servo
        
        try:
            # Check if running on actual hardware (Raspberry Pi)
            if platform.system() == 'Linux':
                import RPi.GPIO as GPIO
                GPIO.setmode(GPIO.BCM)
                
                # Set up pump pin
                GPIO.setup(17, GPIO.OUT)  # Main pump control pin
                
                # Set up servo PWM
                GPIO.setup(self.servo_pin, GPIO.OUT)
                self.pwm = GPIO.PWM(self.servo_pin, self.pwm_frequency)
                self.pwm.start(0)  # Start with 0 duty cycle
                self.servo_initialized = True
                logger.info("Servo motor initialized on GPIO 18")
            
            self.is_initialized = True
            logger.info("Pump controller initialized")
        except Exception as e:
            logger.error(f"Failed to initialize pump controller: {e}")
    
    def _set_servo_angle(self, angle: int):
        """
        Set the servo motor to a specific angle.
        
        Args:
            angle: Target angle (0-180 degrees)
        """
        if not self.servo_initialized:
            logger.warning("Servo motor not initialized, skipping angle setting")
            return
        
        try:
            # Calculate duty cycle (2-12% for 0-180 degrees)
            duty = 2 + (angle / 18)
            
            # Set the angle
            self.pwm.ChangeDutyCycle(duty)
            
            # Hold position for 0.5 seconds
            time.sleep(0.5)
            
            # Reset duty cycle to avoid jitter
            self.pwm.ChangeDutyCycle(0)
            
            logger.info(f"Servo motor set to {angle} degrees")
        except Exception as e:
            logger.error(f"Error setting servo angle: {e}")
    
    def select_pipe(self, pipe_id: int):
        """
        Rotate the servo to select a specific pipe.
        
        Args:
            pipe_id: Pipe ID (0-3)
        """
        # Map pipe IDs to angles
        pipe_angles = {
            0: 0,    # Pipe 0 at 0 degrees
            1: 45,   # Pipe 1 at 45 degrees
            2: 90,   # Pipe 2 at 90 degrees
            3: 135   # Pipe 3 at 135 degrees
        }
        
        if pipe_id not in pipe_angles:
            logger.warning(f"Unknown pipe ID: {pipe_id}, ignoring")
            return
        
        angle = pipe_angles[pipe_id]
        self._set_servo_angle(angle)
    
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
            
            # First select the correct pipe using the servo
            self.select_pipe(pipe_id)
            
            # Then activate the main pump
            # In a real system, you'd activate GPIO here
            # For example:
            # GPIO.output(17, GPIO.HIGH)
            
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
            
            # In a real system, you'd deactivate GPIO here
            # For example:
            # GPIO.output(17, GPIO.LOW)
            
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
        """Clean up GPIO resources when done."""
        # Stop all active pumps first
        self.emergency_stop()
        
        # Clean up servo PWM
        if self.servo_initialized:
            try:
                self.pwm.stop()
                logger.info("Servo PWM stopped")
            except Exception as e:
                logger.error(f"Error stopping servo PWM: {e}")
        
        # Then release GPIO resources in a real system
        if platform.system() == 'Linux':
            try:
                import RPi.GPIO as GPIO
                GPIO.cleanup()
                logger.info("GPIO resources cleaned up")
            except Exception as e:
                logger.error(f"Error cleaning up GPIO: {e}")

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
    
    # Test 1: Test servo movement without pump
    print("\n[TEST 1] Test Servo Movement (No Pump)")
    print("Testing servo movement for each pipe position...")
    for pipe_id in range(4):
        print(f"\nMoving to pipe {pipe_id} position...")
        controller.select_pipe(pipe_id)
        time.sleep(2)  # Longer delay to observe movement
    
    # Test 2: Sequential pipe activation with pump
    print("\n[TEST 2] Sequential Pipe Activation")
    print("Testing each pipe with pump activation...")
    
    for pipe_id in range(4):
        print(f"\nActivating pipe {pipe_id}:")
        print("1. Moving servo to position...")
        controller.select_pipe(pipe_id)
        time.sleep(1)  # Wait for servo to settle
        
        print("2. Activating pump for 3 seconds...")
        result = activate_pump(pipe_id, 3)
        print(f"   Pump activation {'successful' if result else 'failed'}")
        
        print("3. Waiting for pump to complete...")
        time.sleep(3.5)  # Wait for pump duration plus a small buffer
        
        active = get_active_pumps()
        print(f"   Active pumps: {active}")
        time.sleep(1)  # Brief pause between pipes
    
    # Test 3: Emergency stop
    print("\n[TEST 3] Emergency Stop Test")
    print("Activating multiple pipes...")
    
    # Activate pipes 0 and 2
    activate_pump(0, 10)
    activate_pump(2, 10)
    
    print("Waiting 2 seconds...")
    time.sleep(2)
    
    print("Performing emergency stop...")
    emergency_stop()
    
    active = get_active_pumps()
    print(f"Active pumps after emergency stop: {active}")
    
    # Clean up
    print("\nCleaning up resources...")
    controller.cleanup()
    
    print("\nTest completed!")
    print("=" * 50) 