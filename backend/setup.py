"""
Setup script for packaging and installing the backend as a Python module (dev-side, placeholder for now).

NOT TO BE CONFUSED WITH THE FIRST-TIME SETUP SCRIPT FOR THE HARDWARE (user-side).
"""

from setuptools import setup, find_packages

setup(
    name="sproutsynch-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "apache-airflow",
        "firebase-admin",
        "RPi.GPIO",
        "python-dotenv",
        "requests",
        "pydantic",
        "flask",
        "flask-cors",
        "redis",
        "schedule",
    ],
    python_requires=">=3.8, <=3.11",
    author="SproutSynch Team",
    description="Backend middleware for SproutSynch automatic plant watering system",
)