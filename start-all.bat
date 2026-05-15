@echo off
REM Double-click entry point for start-all.ps1
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0start-all.ps1"
pause
