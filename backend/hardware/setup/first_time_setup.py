#!/usr/bin/env python3
# backend/hardware/setup/first_time_setup.py


# VERY ROUGH general outline of the user's init first time config, should ideally streamline all abstractions and
# allow users to set up their software-defined watering with a single button or a one-liner (target for now)


import os
import sys
import subprocess
import argparse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger('setup')

def check_dependencies():
    """Check if required system packages are installed"""
    required_packages = ['python3-pip', 'redis-server', 'apache-airflow']
    missing_packages = []
    
    logger.info("Checking system dependencies...")
    for package in required_packages:
        result = subprocess.run(['dpkg', '-s', package], 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE)
        if result.returncode != 0:
            missing_packages.append(package)
    
    return missing_packages

def install_dependencies(missing_packages):
    """Install missing system dependencies"""
    logger.info(f"Installing missing packages: {', '.join(missing_packages)}")
    subprocess.run(['sudo', 'apt', 'update'])
    subprocess.run(['sudo', 'apt', 'install', '-y'] + missing_packages)

def setup_gpio_permissions():
    """Configure GPIO permissions for the current user"""
    logger.info("Setting up GPIO permissions...")
    # Add current user to gpio group if it exists
    subprocess.run(['sudo', 'usermod', '-a', '-G', 'gpio', os.environ.get('USER')])
    return True

def configure_airflow():
    """Set up Airflow configuration and copy DAGs"""
    logger.info("Configuring Airflow...")
    # Create Airflow directories if they don't exist
    os.makedirs('/opt/airflow/dags', exist_ok=True)
    
    # Copy DAG files
    dags_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dags')
    subprocess.run(['cp', '-r', f"{dags_dir}/*", '/opt/airflow/dags/'])
    
    # Initialize the database
    subprocess.run(['airflow', 'db', 'init'])
    
    # Create admin user (optional)
    subprocess.run(['airflow', 'users', 'create',
                   '--username', 'admin',
                   '--password', 'admin',
                   '--firstname', 'Admin',
                   '--lastname', 'User',
                   '--role', 'Admin',
                   '--email', 'admin@example.com'])
    
    return True

def configure_redis():
    """Set up Redis configuration"""
    logger.info("Configuring Redis...")
    redis_conf = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                             'database/redis/redis.conf')
    
    if os.path.exists(redis_conf):
        subprocess.run(['sudo', 'cp', redis_conf, '/etc/redis/redis.conf'])
        subprocess.run(['sudo', 'systemctl', 'restart', 'redis'])
    
    return True

def setup_autostart():
    """Configure services to start automatically on boot"""
    logger.info("Setting up autostart...")
    services = ['redis-server', 'airflow-webserver', 'airflow-scheduler']
    
    for service in services:
        subprocess.run(['sudo', 'systemctl', 'enable', service])
    
    return True

def main():
    parser = argparse.ArgumentParser(description='First-time setup for SproutSynch')
    parser.add_argument('--skip-deps', action='store_true', 
                        help='Skip system dependency installation')
    parser.add_argument('--skip-gpio', action='store_true',
                        help='Skip GPIO permission setup')
    args = parser.parse_args()
    
    logger.info("Starting SproutSynch first-time setup...")
    
    # Install dependencies
    if not args.skip_deps:
        missing = check_dependencies()
        if missing:
            install_dependencies(missing)
    
    # Setup GPIO
    if not args.skip_gpio:
        setup_gpio_permissions()
    
    # Configure services
    configure_airflow()
    configure_redis()
    setup_autostart()
    
    logger.info("Setup complete! SproutSynch is ready to use.")
    logger.info("Access the Airflow dashboard at http://localhost:8080")

if __name__ == "__main__":
    main()