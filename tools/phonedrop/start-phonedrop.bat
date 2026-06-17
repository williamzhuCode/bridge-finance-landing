@echo off
title PhoneDrop
cd /d "%~dp0"

REM --- Step 1: get administrator rights (needed once, to open the firewall) ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Windows will ask for permission to open the firewall - click YES.
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

REM --- Step 2: allow phones to reach PhoneDrop through the firewall (port 8780) ---
netsh advfirewall firewall delete rule name="PhoneDrop" >nul 2>&1
netsh advfirewall firewall add rule name="PhoneDrop" dir=in action=allow protocol=TCP localport=8780 profile=any >nul 2>&1
echo Firewall is set up for PhoneDrop.
echo.

REM --- Step 3: start PhoneDrop ---
python phonedrop.py
echo.
echo PhoneDrop has stopped. You can close this window.
pause
