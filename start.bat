@echo off
title Claude Messenger - Server
color 1F
echo.
echo  ============================================
echo   Claude Messenger - Server
echo  ============================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 4F
    echo  ERROR: Node.js is not installed!
    echo  Get it from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  Installing for first time... please wait...
    echo.
    call npm install
    echo.
)

:: Kill anything already running on port 3000
echo  Checking for existing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo  Stopping previous instance (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo  Your network addresses (share one with your friend):
echo.
ipconfig | findstr /i "IPv4"
echo.
echo  Your friend should enter: [YOUR IP]:3000
echo  e.g. 192.168.1.50:3000
echo.
echo  ============================================
echo  Server running! Open "Claude Chat.vbs" to chat.
echo  Keep this window open while chatting!
echo  Press Ctrl+C to stop the server.
echo  ============================================
echo.

node server.js
pause
