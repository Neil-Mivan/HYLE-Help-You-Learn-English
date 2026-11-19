@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0runtime\node.exe" if not exist "%~dp0pom.xml" if not exist "%~dp0hyle.jar" goto legacy_portable
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
if errorlevel 1 pause
exit /b %errorlevel%

:legacy_portable
"%~dp0runtime\node.exe" server.mjs
exit /b %errorlevel%
