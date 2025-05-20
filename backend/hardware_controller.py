# import time
# import logging
# import threading
# from pathlib import Path
# import platform
# import time
# import RPi.GPIO as GPIO

# # Configure logging
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#     handlers=[
#         logging.FileHandler(Path(__file__).parent / "hardware.log"),
#         logging.StreamHandler()
#     ]
# )
# logger = logging.getLogger("sproutsynch.hardware")

# # Global dictionary to track active pumps and their threads
# active_pumps = {}
# pump_lock = threading.Lock()

# class PumpController:
#     """
#     Controller for water pumps and continuous rotation servo for pipe routing.
#     Handles activation and deactivation of pumps and controls servo rotation.
#     """
    
#     def __init__(self):
#         """Initialize the pump controller and set up GPIO connections if needed."""
#         self.is_initialized = False
#         self.servo_initialized = False
#         self.servo_pin = 18  # BCM 18 (GPIO 12)
#         self.pwm_frequency = 50  # 50Hz for SG90 servo
#         self.current_pipe_id = 0  # Track current pipe position
        
#         try:
#             # Check if running on actual hardware (Raspberry Pi)
#             if platform.system() == 'Linux':
#                 # import RPi.GPIO as GPIO
#                 GPIO.setmode(GPIO.BCM)
                
#                 # Set up pump pin
#                 GPIO.setup(17, GPIO.OUT)  # Main pump control pin
                
#                 # Set up servo PWM
#                 GPIO.setup(self.servo_pin, GPIO.OUT)
#                 self.pwm = GPIO.PWM(self.servo_pin, self.pwm_frequency)
#                 self.pwm.start(0)  # Start with 0 duty cycle
#                 self.servo_initialized = True
#                 logger.info("Servo motor initialized on GPIO 18")
            
#             self.is_initialized = True
#             logger.info("Pump controller initialized")
#         except Exception as e:
#             logger.error(f"Failed to initialize pump controller: {e}")
    
#     def _spin_servo(self, direction: str, speed: float, duration: float):
#         """
#         Spin the continuous rotation servo in the specified direction.
        
#         Args:
#             direction: "cw" for clockwise, "ccw" for counter-clockwise
#             speed: Speed factor from 0 to 1
#             duration: How long to spin in seconds
#         """
#         if not self.servo_initialized:
#             logger.warning("Servo motor not initialized, skipping rotation")
#             return
        
#         try:
#             # Calculate duty cycle based on direction and speed
#             if direction.lower() == "cw":
#                 duty = 7.5 - (1.5 * speed)
#             else:  # ccw
#                 duty = 7.5 + (1.5 * speed)
            
#             # Set the rotation
#             self.pwm.ChangeDutyCycle(duty)
            
#             # Hold for specified duration
#             time.sleep(duration)
            
#             # Reset duty cycle to stop rotation
#             self.pwm.ChangeDutyCycle(0)
            
#             logger.info(f"Servo rotated {direction} at speed {speed} for {duration}s")
#         except Exception as e:
#             logger.error(f"Error rotating servo: {e}")
    
#     def select_pipe(self, pipe_id: int):
#         """
#         Rotate the servo to select a specific pipe using timed rotation.
        
#         Args:
#             pipe_id: Target pipe ID (0-3)
#         """
#         if pipe_id not in range(4):
#             logger.warning(f"Invalid pipe ID: {pipe_id}, ignoring")
#             return
        
#         # Calculate number of steps needed
#         steps = (pipe_id - self.current_pipe_id) % 4
        
#         if steps == 0:
#             logger.info(f"Already at pipe {pipe_id}")
#             return
        
#         # Determine direction (cw if target > current, else ccw)
#         direction = "cw" if steps <= 2 else "ccw"
#         if direction == "ccw":
#             steps = 4 - steps
        
#         logger.info(f"Moving from pipe {self.current_pipe_id} to {pipe_id} ({steps} steps {direction})")
        
#         # Move one step at a time
#         for _ in range(steps):
#             self._spin_servo(
#                 direction=direction,
#                 speed=3,  # Low speed for precise movement
#                 duration=1  # Short duration per step
#             )
#             time.sleep(0.5)  # Brief pause between steps
        
#         # Update current position
#         self.current_pipe_id = pipe_id
#         logger.info(f"Now at pipe {pipe_id}")
    
#     def activate_pump(self, pipe_id, duration_seconds):
#         """
#         Activate the water pump for a specific pipe.
        
#         Args:
#             pipe_id: The ID of the pipe to activate
#             duration_seconds: How long to run the pump in seconds
            
#         Returns:
#             bool: True if successful, False otherwise
#         """
#         if not self.is_initialized:
#             logger.error("Cannot activate pump: Controller not initialized")
#             return False
        
#         try:
#             logger.info(f"Activating pump for pipe ID {pipe_id} for {duration_seconds} seconds")
            
#             # First select the correct pipe using the servo
#             self.select_pipe(pipe_id)
            
#             # Then activate the main pump
#             # In a real system, you'd activate GPIO here
#             # For example:
#             # GPIO.output(17, GPIO.HIGH)
            
#             # Create a timer thread to deactivate after duration
#             timer = threading.Timer(duration_seconds, self.deactivate_pump, args=[pipe_id])
            
#             # Store the active pump thread
#             with pump_lock:
#                 active_pumps[pipe_id] = {
#                     'start_time': time.time(),
#                     'duration': duration_seconds,
#                     'timer': timer
#                 }
            
#             # Start the timer thread
#             timer.start()
            
#             return True
#         except Exception as e:
#             logger.error(f"Error activating pump for pipe {pipe_id}: {e}")
#             return False
    
#     def deactivate_pump(self, pipe_id):
#         """
#         Deactivate the water pump for a specific pipe.
        
#         Args:
#             pipe_id: The ID of the pipe to deactivate
            
#         Returns:
#             bool: True if successful, False otherwise
#         """
#         with pump_lock:
#             if pipe_id not in active_pumps:
#                 logger.warning(f"Pump for pipe {pipe_id} is not active")
#                 return False
            
#             pump_info = active_pumps.pop(pipe_id)
        
#         try:
#             logger.info(f"Deactivating pump for pipe ID {pipe_id}")
            
#             # In a real system, you'd deactivate GPIO here
#             # For example:
#             # GPIO.output(17, GPIO.LOW)
            
#             active_duration = time.time() - pump_info['start_time']
#             logger.info(f"Pump for pipe {pipe_id} was active for {active_duration:.2f} seconds")
            
#             return True
#         except Exception as e:
#             logger.error(f"Error deactivating pump for pipe {pipe_id}: {e}")
#             return False
    
#     def get_active_pumps(self):
#         """Get a list of currently active pumps."""
#         with pump_lock:
#             return {pid: {
#                 'duration': info['duration'],
#                 'elapsed': time.time() - info['start_time']
#             } for pid, info in active_pumps.items()}
    
#     def emergency_stop(self):
#         """
#         Emergency stop all pumps.
        
#         Returns:
#             bool: True if successful, False otherwise
#         """
#         logger.warning("EMERGENCY STOP: Deactivating all pumps")
        
#         with pump_lock:
#             active_pipe_ids = list(active_pumps.keys())
        
#         success = True
#         for pipe_id in active_pipe_ids:
#             if not self.deactivate_pump(pipe_id):
#                 success = False
        
#         return success
    
#     def cleanup(self):
#         """Clean up GPIO resources when done."""
#         # Stop all active pumps first
#         self.emergency_stop()
        
#         # Clean up servo PWM
#         if self.servo_initialized:
#             try:
#                 self.pwm.stop()
#                 logger.info("Servo PWM stopped")
#             except Exception as e:
#                 logger.error(f"Error stopping servo PWM: {e}")
        
#         # Then release GPIO resources in a real system
#         if platform.system() == 'Linux':
#             try:
#                 import RPi.GPIO as GPIO
#                 GPIO.cleanup()
#                 logger.info("GPIO resources cleaned up")
#             except Exception as e:
#                 logger.error(f"Error cleaning up GPIO: {e}")

# # Create a singleton instance to be used by other modules
# controller = PumpController()

# def activate_pump(pipe_id, duration_seconds):
#     """
#     Convenience function to activate a pump.
    
#     Args:
#         pipe_id: The ID of the pipe to activate
#         duration_seconds: How long to run the pump in seconds
        
#     Returns:
#         bool: True if successful, False otherwise
#     """
#     return controller.activate_pump(pipe_id, duration_seconds)

# def deactivate_pump(pipe_id):
#     """
#     Convenience function to deactivate a pump.
    
#     Args:
#         pipe_id: The ID of the pipe to deactivate
        
#     Returns:
#         bool: True if successful, False otherwise
#     """
#     return controller.deactivate_pump(pipe_id)

# def emergency_stop():
#     """
#     Convenience function to perform an emergency stop of all pumps.
    
#     Returns:
#         bool: True if successful, False otherwise
#     """
#     return controller.emergency_stop()

# def get_active_pumps():
#     """
#     Convenience function to get all active pumps.
    
#     Returns:
#         dict: Dictionary of active pumps
#     """
#     return controller.get_active_pumps()

import time
import RPi.GPIO as GPIO

def test_gpio_pin(pin):
    """Test a single GPIO pin by setting it as output and toggling it."""
    try:
        print(f"Testing GPIO {pin}...")
        GPIO.setup(pin, GPIO.OUT)
        
        # Test HIGH
        GPIO.output(pin, GPIO.HIGH)
        time.sleep(0.5)
        
        # Test LOW
        GPIO.output(pin, GPIO.LOW)
        time.sleep(0.5)
        
        print(f"GPIO {pin} test completed successfully")
        return True
    except Exception as e:
        print(f"Error testing GPIO {pin}: {e}")
        return False

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
        controller.select_pipe(pipe_id)
        
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
    import serial
    import serial.tools.list_ports
    import time
    import os
    from pathlib import Path
    import dotenv

    print("Hardware Controller Test")
    print("=" * 50)

    # Load environment variables
    dotenv_path = Path(__file__).parent / ".env"
    dotenv.load_dotenv(dotenv_path)
    USER_UID = os.getenv("USER_UID")

    if not USER_UID:
        print("Error: USER_UID not found in .env file")
        exit(1)

    # Step 1: Check for Arduino connection
    print("\n1. Checking for Arduino connection...")
    arduino_ports = [p for p in serial.tools.list_ports.comports() if 'Arduino' in p.description]

    arduino_port = ""
    
    if not arduino_ports:
        print("No Arduino found! Testing fallback.")
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
    
    # arduino_port = arduino_ports[0].device
    print(f"Found Arduino on port: {arduino_port}")

    # Step 2: Test communication
    print("\n2. Testing communication with Arduino...")
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
            

    # # Step 3: Test servo movement
    # print("\n3. Testing servo movement...")
    # try:
    #     # Test position 1 (60 degrees)
    #     print("Moving to position 1 (60 degrees)...")
    #     ser.write(b'1\n')
    #     time.sleep(2)
        
        # # Test position 2 (160 degrees)
        # print("Moving to position 2 (160 degrees)...")
        # ser.write(b'2\n')
        # time.sleep(5)
        
        # # Return to position 0
        # print("Returning to position 0...")
        # ser.write(b'0\n')
        # time.sleep(5)
        
    #     print("Servo movement test completed!")
        
    # except Exception as e:
    #     print(f"Error controlling servo: {e}")
    #     exit(1)

    # Step 4: Test water_plant function
    print("\n4. Testing water_plant function...")
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
        ser.close()
        print("\nAll tests completed!")