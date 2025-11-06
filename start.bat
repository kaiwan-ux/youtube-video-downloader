@echo off
REM Startup script for VidFlow (Windows)

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
)

REM Create necessary directories
if not exist downloads mkdir downloads
if not exist cache mkdir cache

REM Run the application
echo Starting VidFlow...
python app.py

pause

