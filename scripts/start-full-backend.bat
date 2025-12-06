@echo off
echo ============================================================
echo FoodShare MERN App - Full Backend Startup
echo ============================================================
echo.
echo Starting both Node.js backend and Enhanced AI service...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Node.js and Python found. Starting services...
echo.

REM Change to project root directory
cd /d "%~dp0.."

REM Start AI service in background
echo Starting Enhanced AI Service...
start "AI Service" cmd /k "python scripts/start_ai_service.py"

REM Wait a moment for AI service to start
timeout /t 5 /nobreak >nul

REM Start Node.js backend
echo Starting Node.js Backend...
echo.
npm run server

echo.
echo ============================================================
echo Backend services have stopped
echo ============================================================
pause