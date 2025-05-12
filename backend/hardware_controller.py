import time
import logging
import threading
from pathlib import Path
import platform
import time
import RPi.GPIO as GPIO

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
    Controller for water pumps and continuous rotation servo for pipe routing.
    Handles activation and deactivation of pumps and controls servo rotation.
    """
    
    def __init__(self):
        """Initialize the pump controller and set up GPIO connections if needed."""
        self.is_initialized = False
        self.servo_initialized = False
        self.servo_pin = 18  # BCM 18 (GPIO 12)
        self.pwm_frequency = 50  # 50Hz for SG90 servo
        self.current_pipe_id = 0  # Track current pipe position
        
        try:
            # Check if running on actual hardware (Raspberry Pi)
            if platform.system() == 'Linux':
                # import RPi.GPIO as GPIO
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
    
    def _spin_servo(self, direction: str, speed: float, duration: float):
        """
        Spin the continuous rotation servo in the specified direction.
        
        Args:
            direction: "cw" for clockwise, "ccw" for counter-clockwise
            speed: Speed factor from 0 to 1
            duration: How long to spin in seconds
        """
        if not self.servo_initialized:
            logger.warning("Servo motor not initialized, skipping rotation")
            return
        
        try:
            # Calculate duty cycle based on direction and speed
            if direction.lower() == "cw":
                duty = 7.5 - (1.5 * speed)
            else:  # ccw
                duty = 7.5 + (1.5 * speed)
            
            # Set the rotation
            self.pwm.ChangeDutyCycle(duty)
            
            # Hold for specified duration
            time.sleep(duration)
            
            # Reset duty cycle to stop rotation
            self.pwm.ChangeDutyCycle(0)
            
            logger.info(f"Servo rotated {direction} at speed {speed} for {duration}s")
        except Exception as e:
            logger.error(f"Error rotating servo: {e}")
    
    def select_pipe(self, pipe_id: int):
        """
        Rotate the servo to select a specific pipe using timed rotation.
        
        Args:
            pipe_id: Target pipe ID (0-3)
        """
        if pipe_id not in range(4):
            logger.warning(f"Invalid pipe ID: {pipe_id}, ignoring")
            return
        
        # Calculate number of steps needed
        steps = (pipe_id - self.current_pipe_id) % 4
        
        if steps == 0:
            logger.info(f"Already at pipe {pipe_id}")
            return
        
        # Determine direction (cw if target > current, else ccw)
        direction = "cw" if steps <= 2 else "ccw"
        if direction == "ccw":
            steps = 4 - steps
        
        logger.info(f"Moving from pipe {self.current_pipe_id} to {pipe_id} ({steps} steps {direction})")
        
        # Move one step at a time
        for _ in range(steps):
            self._spin_servo(
                direction=direction,
                speed=3,  # Low speed for precise movement
                duration=1  # Short duration per step
            )
            time.sleep(0.5)  # Brief pause between steps
        
        # Update current position
        self.current_pipe_id = pipe_id
        logger.info(f"Now at pipe {pipe_id}")
    
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
    print("SproutSynch Servo Direct Spin Test")
    print("=" * 50)

    if controller.servo_initialized:
        print("Spinning servo (CW) at duty cycle 6 for 10 seconds...")

        controller.pwm.ChangeDutyCycle(6)  # Slightly CW
        time.sleep(10)
        controller.pwm.ChangeDutyCycle(0)  # Stop
        controller.cleanup()
        print("Done.")
    else:
        print("Servo not initialized. Skipping.")
    
    print("SproutSynch Hardware Controller - Test Script")
    print("=" * 50)
    
    # # Test 1: Test servo movement without pump
    # print("\n[TEST 1] Test Servo Movement (No Pump)")
    # print("Testing servo movement for each pipe position...")
    # print("Note: Movement is timing-based, not angle-based")
    # print("Duration and speed per step may need tuning based on hardware")
    
    # for pipe_id in range(4):
    #     print(f"\nMoving to pipe {pipe_id} position...")
    #     controller.select_pipe(pipe_id)
    #     time.sleep(2)  # Wait to observe movement
    
    # # Test 2: Sequential pipe activation with pump
    # print("\n[TEST 2] Sequential Pipe Activation")
    # print("Testing each pipe with pump activation...")
    # print("Note: Servo will rotate to each position before pump activation")
    
    # for pipe_id in range(4):
    #     print(f"\nActivating pipe {pipe_id}:")
    #     print("1. Moving servo to position...")
    #     controller.select_pipe(pipe_id)
    #     time.sleep(1)  # Wait for servo to settle
        
    #     print("2. Activating pump for 3 seconds...")
    #     result = activate_pump(pipe_id, 3)
    #     print(f"   Pump activation {'successful' if result else 'failed'}")
        
    #     print("3. Waiting for pump to complete...")
    #     time.sleep(3.5)  # Wait for pump duration plus a small buffer
        
    #     active = get_active_pumps()
    #     print(f"   Active pumps: {active}")
    #     time.sleep(1)  # Brief pause between pipes
    
    # # Test 3: Emergency stop
    # print("\n[TEST 3] Emergency Stop Test")
    # print("Activating multiple pipes...")
    
    # # Activate pipes 0 and 2
    # activate_pump(0, 10)
    # activate_pump(2, 10)
    
    # print("Waiting 2 seconds...")
    # time.sleep(2)
    
    # print("Performing emergency stop...")
    # emergency_stop()
    
    # active = get_active_pumps()
    # print(f"Active pumps after emergency stop: {active}")
    
    # # Clean up
    # print("\nCleaning up resources...")
    # controller.cleanup()
    
    # print("\nTest completed!")
    # print("=" * 50) 

    SERVO_PIN = 18  # BCM numbering (pin 12)
    FREQ = 50       # 50Hz for SG90
    DUTY_CYCLE = 6  # Slightly clockwise (7.5 is stop)

    GPIO.setmode(GPIO.BCM)
    GPIO.setup(SERVO_PIN, GPIO.OUT)

    pwm = GPIO.PWM(SERVO_PIN, FREQ)
    pwm.start(DUTY_CYCLE)

    print("Spinning servo for 10 seconds...")
    time.sleep(10)

    pwm.ChangeDutyCycle(0)  # Stop rotation
    pwm.stop()
    GPIO.cleanup()
    print("Done.")