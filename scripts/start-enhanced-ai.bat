@echo off
echo ============================================================
echo Enhanced FoodShare AI Service Launcher
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Python found. Starting AI service...
echo.

REM Change to project root directory
cd /d "%~dp0.."

REM Run the enhanced startup script
python scripts/start_ai_service.py

echo.
echo ============================================================
echo AI Service has stopped
echo ============================================================
pause