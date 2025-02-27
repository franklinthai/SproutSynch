# example naive util script that can be reused to test general hardware components' functionalities and correctness


# backend/hardware/scripts/relay_control.py

import RPi.GPIO as GPIO
import time
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('relay_control')

class RelayController:
    """
    Controls a relay connected to Raspberry Pi GPIO for watering plants
    """
    def __init__(self, pin=17, active_high=True):
        """
        Initialize the relay controller
        
        Args:
            pin (int): GPIO pin number (BCM numbering)
            active_high (bool): If True, GPIO.HIGH turns on the relay
        """
        self.pin = pin
        self.active_high = active_high
        self.on_value = GPIO.HIGH if active_high else GPIO.LOW
        self.off_value = GPIO.LOW if active_high else GPIO.HIGH
        self.is_setup = False
        
    def setup(self):
        """Set up GPIO pin for relay control"""
        if not self.is_setup:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.pin, GPIO.OUT)
            # Ensure relay starts in OFF state
            GPIO.output(self.pin, self.off_value)
            self.is_setup = True
            logger.info(f"Relay on pin {self.pin} initialized")
    
    def turn_on(self):
        """Turn on the relay"""
        self.setup()
        GPIO.output(self.pin, self.on_value)
        logger.info(f"Relay on pin {self.pin} turned ON")
    
    def turn_off(self):
        """Turn off the relay"""
        self.setup()
        GPIO.output(self.pin, self.off_value)
        logger.info(f"Relay on pin {self.pin} turned OFF")
    
    def pulse(self, duration_seconds):
        """
        Turn relay on for specified duration then off
        
        Args:
            duration_seconds (float): Time in seconds to keep relay on
        """
        try:
            self.turn_on()
            time.sleep(duration_seconds)
        finally:
            self.turn_off()
        logger.info(f"Completed {duration_seconds}s pulse on pin {self.pin}")
    
    def cleanup(self):
        """Release GPIO resources"""
        if self.is_setup:
            # Make sure relay is off before cleanup
            GPIO.output(self.pin, self.off_value)
            GPIO.cleanup(self.pin)
            self.is_setup = False
            logger.info(f"Cleaned up relay on pin {self.pin}")


# Utility functions for direct script usage
def water_plant(pin=17, duration=5):
    """
    Turn on water pump relay for specified duration
    
    Args:
        pin (int): GPIO pin number
        duration (float): Time in seconds to run pump
    """
    relay = RelayController(pin)
    try:
        logger.info(f"Watering plant for {duration} seconds")
        relay.pulse(duration)
        return True
    except Exception as e:
        logger.error(f"Error watering plant: {e}")
        return False
    finally:
        relay.cleanup()


# Test function when script is run directly
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Control relay for plant watering')
    parser.add_argument('--pin', type=int, default=17, help='GPIO pin number (BCM)')
    parser.add_argument('--duration', type=float, default=5, help='Duration in seconds')
    parser.add_argument('--action', choices=['on', 'off', 'pulse'], default='pulse', 
                        help='Action to perform')
    
    args = parser.parse_args()
    
    relay = RelayController(args.pin)
    try:
        if args.action == 'on':
            relay.turn_on()
            input("Press Enter to turn off...")
        elif args.action == 'off':
            relay.turn_off()
        elif args.action == 'pulse':
            relay.pulse(args.duration)
    finally:
        relay.cleanup()