@echo off
chcp 65001 >nul
title سیستم مدیریت کاوش
cd /d "%~dp0"

echo ========================================
echo    سیستم مدیریت کاوش - در حال اجرا
echo ========================================
echo.
echo   آدرس: http://localhost:3000
echo.
echo   برای بستن: Ctrl + C
echo.
echo ========================================
echo.

REM باز کردن مرورگر بعد از ۶ ثانیه (در پس‌زمینه)
start "" cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3000"

REM اجرای سرور
npm run dev

pause