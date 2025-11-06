#!/bin/bash
# Startup script for VidFlow

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Create necessary directories
mkdir -p downloads cache

# Run the application
echo "Starting VidFlow..."
python app.py

