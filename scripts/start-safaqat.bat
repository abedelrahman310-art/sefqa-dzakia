@echo off
chcp 65001 > nul
title Safaqat Platform
color 0B
cls
echo.
echo ==========================================
echo    Safaqat Platform - Starting...
echo ==========================================
echo.

echo [1/3] Cleaning old processes...
taskkill /F /IM python.exe /T > nul 2>&1
taskkill /F /IM node.exe /T > nul 2>&1
timeout /t 1 /nobreak > nul
echo       Done.
echo.

echo [2/3] Starting Backend (Django)...
start "Safaqat Backend" cmd /k "cd /d D:\dev\safaqat\backend && set DB_ENGINE=sqlite && color 0A && python manage.py runserver 8000"
timeout /t 5 /nobreak > nul
echo       Backend started.
echo.

echo [3/3] Starting Frontend (Vite)...
start "Safaqat Frontend" cmd /k "cd /d D:\dev\safaqat && set VITE_ENABLE_DEMO_LOGIN=true && color 0E && pnpm --filter client dev"
timeout /t 15 /nobreak > nul
echo       Frontend started.
echo.

echo Opening browser...
start http://localhost:5173
echo.

echo ==========================================
echo    SAFQAAT IS RUNNING!
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/api/docs/
echo ==========================================
echo.
echo Close this window anytime.
timeout /t 10 /nobreak > nul
