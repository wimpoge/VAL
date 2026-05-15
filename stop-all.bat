@echo off
REM Double-click entry point for stop-all.ps1
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0stop-all.ps1"
pause
