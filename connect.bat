@echo off
title Claude Chat - Connect
color 1F
echo.
echo  ============================================
echo   Claude Chat - Connect to a Friend
echo  ============================================
echo.
echo  Ask your friend to run start.bat and tell you their IP.
echo.
set /p SERVER_IP="  Enter your friend's IP address (e.g. 192.168.1.50): "
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 4F
    echo  ERROR: Node.js is not installed! Get it from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  Installing for first time...
    call npm install
)

echo  Opening Claude Chat...
start "" "http://%SERVER_IP%:3000"
echo.
echo  If the browser didn't open, go to: http://%SERVER_IP%:3000
echo.
pause
