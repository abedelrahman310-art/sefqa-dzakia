@echo off
chcp 65001 >nul
title Safaqat - Sefaqat Dakiya
color 0A

echo.
echo  ========================================
echo   Sefaqat Dakiya - Safaqat Platform
echo  ========================================
echo.

cd /d D:\dev\safaqat

echo [1/4] Starting database...
docker compose up -d db
if errorlevel 1 (
    echo  ERROR: Docker Desktop is not running.
    echo  Please start Docker Desktop and try again.
    pause
    exit /b 1
)
timeout /t 5 /nobreak >nul

echo [2/4] Starting backend (Django)...
start "Safaqat Backend" cmd /k "docker compose up backend"

echo [3/4] Waiting for backend...
timeout /t 8 /nobreak >nul

echo [4/4] Starting frontend (Vite)...
start "Safaqat Frontend" cmd /k "cd /d D:\dev\safaqat\client && pnpm dev"

echo.
echo  Waiting 10 seconds before opening browser...
timeout /t 10 /nobreak >nul

echo Opening: http://localhost:5173
start http://localhost:5173

echo.
echo  Platform is running
echo  To stop: close the windows
echo.
pause