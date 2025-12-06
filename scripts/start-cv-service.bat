@echo off
echo ========================================
echo    FoodShare CV Integration Setup
echo ========================================
echo.

echo [1/3] Starting Python CV Service...
cd backend
start "Python CV Service" cmd /k "python services/foodCV.py"
echo     ✅ Python CV Service starting on http://localhost:5001
echo.

echo [2/3] Waiting for service to initialize...
timeout /t 5 /nobreak >nul
echo     ⏳ Service should be ready now
echo.

echo [3/3] Testing integration...
cd ..
node test-cv-integration.js
echo.

echo ========================================
echo           SETUP COMPLETE!
echo ========================================
echo.
echo 🚀 Your CV Integration is ready!
echo.
echo Next steps:
echo 1. Start Node.js backend: npm run dev (in backend folder)
echo 2. Start React frontend: npm start (in frontend folder)
echo 3. Go to Share Food page and test AI Scanner
echo.
echo 📱 Features available:
echo   • Real-time food quality scanning
echo   • Freshness assessment (0-100%%)
echo   • Quality grading (Excellent/Good/Fair/Poor)
echo   • Smart shelf life prediction
echo   • Auto-populate expiry dates
echo   • Portion size estimation
echo.
pause