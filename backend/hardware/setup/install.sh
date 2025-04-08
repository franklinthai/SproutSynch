#!/bin/bash
# SproutSynch Installation Script for Raspberry Pi (for pre-MVP beta testers)
# This script automates the installation and setup process for the SproutSynch system

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  SproutSynch Installation Script       ${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}This script should be run as root. Please run with sudo.${NC}"
  exit 1
fi

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for Python
if ! command_exists python3; then
  echo -e "${YELLOW}Python 3 not found. Installing...${NC}"
  apt-get update && apt-get install -y python3 python3-pip python3-venv
else
  echo -e "${GREEN}Python 3 is installed.${NC}"
fi

# Check for git
if ! command_exists git; then
  echo -e "${YELLOW}Git not found. Installing...${NC}"
  apt-get update && apt-get install -y git
else
  echo -e "${GREEN}Git is installed.${NC}"
fi

# Install required system packages
echo -e "${GREEN}Installing required system packages...${NC}"
apt-get update && apt-get install -y \
  python3-dev \
  libffi-dev \
  build-essential \
  libssl-dev \
  zlib1g-dev \
  libbz2-dev \
  libreadline-dev \
  libsqlite3-dev \
  wget \
  curl \
  llvm \
  libncurses5-dev \
  libncursesw5-dev \
  xz-utils \
  tk-dev \
  libffi-dev \
  liblzma-dev \
  redis-server

# Create a user for SproutSynch if it doesn't exist
if ! id -u sproutsynch >/dev/null 2>&1; then
  echo -e "${GREEN}Creating sproutsynch user...${NC}"
  useradd -m -s /bin/bash sproutsynch
  usermod -aG gpio sproutsynch
else
  echo -e "${GREEN}User sproutsynch already exists.${NC}"
fi

# Clone the repository (if not already done)
REPO_DIR="/home/sproutsynch/SproutSynch"
if [ ! -d "$REPO_DIR" ]; then
  echo -e "${GREEN}Cloning SproutSynch repository...${NC}"
  mkdir -p "$REPO_DIR"
  git clone https://github.com/yourusername/SproutSynch.git "$REPO_DIR"
  chown -R sproutsynch:sproutsynch "$REPO_DIR"
else
  echo -e "${GREEN}Repository already exists at $REPO_DIR.${NC}"
  
  # Update the repository
  echo -e "${GREEN}Updating repository...${NC}"
  cd "$REPO_DIR"
  git pull
  chown -R sproutsynch:sproutsynch "$REPO_DIR"
fi

# Setup python environment
echo -e "${GREEN}Setting up Python environment...${NC}"
cd "$REPO_DIR"
sudo -u sproutsynch python3 -m venv venv
sudo -u sproutsynch venv/bin/pip install --upgrade pip
sudo -u sproutsynch venv/bin/pip install -r backend/requirements.txt

# Run the first-time setup script
echo -e "${GREEN}Running first-time setup script...${NC}"
cd "$REPO_DIR/backend/hardware/setup"
sudo -u sproutsynch ../../venv/bin/python first_time_setup.py

# Enable and start services
echo -e "${GREEN}Enabling and starting services...${NC}"
systemctl enable redis-server
systemctl start redis-server

# Create services for Airflow
# Create Airflow service file
cat > /etc/systemd/system/airflow-scheduler.service << EOL
[Unit]
Description=Airflow scheduler daemon
After=network.target redis-server.service

[Service]
User=sproutsynch
Group=sproutsynch
Type=simple
Environment="PATH=/home/sproutsynch/SproutSynch/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="AIRFLOW_HOME=/home/sproutsynch/airflow"
ExecStart=/home/sproutsynch/SproutSynch/venv/bin/airflow scheduler
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd and enable the services
systemctl daemon-reload
systemctl enable airflow-scheduler
systemctl start airflow-scheduler

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  SproutSynch Installation Complete!    ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "${YELLOW}You can now configure your device by running:${NC}"
echo -e "${YELLOW}sudo -u sproutsynch /home/sproutsynch/SproutSynch/venv/bin/python /home/sproutsynch/SproutSynch/backend/hardware/setup/first_time_setup.py --user-id YOUR_USER_ID${NC}"
echo -e "${GREEN}=========================================${NC}" 