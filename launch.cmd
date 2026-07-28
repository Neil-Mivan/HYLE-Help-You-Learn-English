@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:4173/api/status' -UseBasicParsing -TimeoutSec 1 | Out-Null; Start-Process 'http://127.0.0.1:4173/'; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 exit /b 0

if not defined CLEAR_READING_AUTO_STOP set "CLEAR_READING_AUTO_STOP=1"
if not defined CLEAR_READING_AUTO_OPEN set "CLEAR_READING_AUTO_OPEN=1"
call start.cmd
