@echo off
chcp 65001 >nul
title Safaqat - Production Environment (Docker Stack)
color 0B

echo.
echo  ======================================================
echo   منصة صفقات ذكية — تشغيل حزم الإنتاج المعتمدة
echo   Safaqat Production Stack (PostgreSQL + Django + Nginx)
echo  ======================================================
echo.

cd /d D:\dev\safaqat

echo [1/3] Building frontend assets...
call pnpm --filter client build

echo [2/3] Starting Docker services (PostgreSQL 16, Django Gunicorn, Nginx)...
docker compose up -d --build

if errorlevel 1 (
    echo.
    echo  ERROR: Failed to start Docker Compose stack.
    echo  Please ensure Docker Desktop is running and try again.
    pause
    exit /b 1
)

echo.
echo [3/3] Waiting for Nginx and Django to initialize...
timeout /t 5 /nobreak >nul

echo.
echo  ======================================================
echo   المنصة تعمل بنجاح في بيئة الإنتاج الكاملة:
echo   - البوابة الرئيسية وواجهة المستخدم: http://localhost
echo   - واجهة برمجة التطبيقات (API): http://localhost/api/
echo   - لوحة الإدارة الفنية (Admin): http://localhost/admin/
echo  ======================================================
echo.

echo Opening: http://localhost
start http://localhost

pause
