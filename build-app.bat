@echo off
title Building Enhanced Roblox Multi-Instance Manager
echo ===============================================
echo  Building Enhanced Desktop Application
echo ===============================================
echo.

echo [INFO] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [INFO] Building desktop application...
npm run electron:build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Build completed!
echo [INFO] Check the 'dist' folder for your application
echo.
pause
