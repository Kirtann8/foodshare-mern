#!/usr/bin/env python3
import subprocess
import sys
import os
import time
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)
    print(f"Python version: {sys.version}")

def install_requirements():
    """Install Python dependencies with better error handling"""
    print("Installing Python dependencies...")
    requirements_path = Path("backend/requirements.txt")
    
    if not requirements_path.exists():
        print(f"Error: {requirements_path} not found")
        sys.exit(1)
    
    try:
        # Upgrade pip first
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        
        # Install requirements
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_path),
            "--timeout", "300"  # 5 minute timeout
        ])
        print("Dependencies installed successfully!")
        
    except subprocess.CalledProcessError as e:
        print(f"Failed to install dependencies: {e}")
        print("Trying with --user flag...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-r", str(requirements_path),
                "--user", "--timeout", "300"
            ])
            print("Dependencies installed with --user flag!")
        except subprocess.CalledProcessError:
            print("Failed to install dependencies. Please install manually:")
            print(f"pip install -r {requirements_path}")
            sys.exit(1)

def check_service_file():
    """Check if the service file exists"""
    service_path = Path("backend/services/foodCV.py")
    if not service_path.exists():
        print(f"Error: {service_path} not found")
        sys.exit(1)
    return service_path

def start_service():
    """Start the AI service with proper error handling"""
    print("Starting Enhanced AI Food Quality Assessment Service...")
    print("Features: Multi-model ensemble, Advanced freshness analysis, Smart detection")
    print("-" * 60)
    
    service_path = check_service_file()
    
    try:
        # Change to service directory
        os.chdir('backend/services')
        
        # Start the service
        print(f"Starting service at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("Service will be available at: http://localhost:5001")
        print("Press Ctrl+C to stop the service")
        print("-" * 60)
        
        subprocess.run([sys.executable, "foodCV.py"])
        
    except FileNotFoundError:
        print("Error: Could not find the service directory")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting service: {e}")
        sys.exit(1)

def main():
    """Main function with comprehensive setup"""
    print("=" * 60)
    print("Enhanced FoodShare AI Service Startup")
    print("=" * 60)
    
    try:
        # Check Python version
        check_python_version()
        
        # Install dependencies
        install_requirements()
        
        # Wait a moment for installations to complete
        time.sleep(2)
        
        # Start the service
        start_service()
        
    except KeyboardInterrupt:
        print("\n" + "=" * 60)
        print("AI service stopped by user.")
        print("=" * 60)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        print("Please check the error message above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()