@echo off
chcp 65001 >nul
title Kawish System Setup
color 1F
cls

echo.
echo ========================================
echo    Kawish Academic System - Setup
echo ========================================
echo.
echo  This program should run only ONCE.
echo  Please wait...
echo.

REM ===== تغییر به مسیر پروژه =====
cd /d "C:\Users\HCS\kawish-system"

echo Current directory: %CD%
echo.

echo ----------------------------------------
echo [1/5] Checking Node.js...
echo ----------------------------------------
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js is installed.
echo.

echo ----------------------------------------
echo [2/5] Installing packages (2-5 min)...
echo ----------------------------------------
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install packages!
    pause
    exit /b 1
)
echo [OK] Packages installed.
echo.

echo ----------------------------------------
echo [3/5] Setting up database...
echo ----------------------------------------
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Database setup failed!
    pause
    exit /b 1
)
echo [OK] Database ready.
echo.

echo ----------------------------------------
echo [4/5] Generating Prisma Client...
echo ----------------------------------------
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Generation failed!
    pause
    exit /b 1
)
echo [OK] Generated.
echo.

echo ----------------------------------------
echo [5/5] Building production version...
echo ----------------------------------------
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Build complete.
echo.

echo.
echo ========================================
echo    SETUP COMPLETED SUCCESSFULLY
echo ========================================
echo.
echo  To run the app from now on:
echo    Double-click "Kawish System" icon
echo    on the Desktop.
echo.
echo  Login credentials:
echo    Email: admin@kawish.edu
echo    Password: admin123
echo.
echo.
pause