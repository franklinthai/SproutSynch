#!/bin/bash
# install.sh, naive bash script for setting up airflow, redis, and firestore connections

# Install system dependencies
echo "Installing system dependencies..."
sudo apt update
sudo apt install -y python3-pip redis-server apache-airflow

# Create directories
echo "Setting up directories..."
sudo mkdir -p /opt/sproutsynch/backend/hardware/dags
sudo chown -R $USER:$USER /opt/sproutsynch

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r backend/requirements.txt

# Copy Airflow DAGs
echo "Setting up Airflow..."
cp backend/hardware/dags/* /opt/airflow/dags/

# Configure Redis
echo "Setting up Redis..."
sudo cp backend/database/redis/redis.conf /etc/redis/redis.conf
sudo systemctl restart redis

# Setup Airflow connections
echo "Configuring Airflow connections..."
python3 backend/setup.py

echo "SproutSynch backend setup complete!"
