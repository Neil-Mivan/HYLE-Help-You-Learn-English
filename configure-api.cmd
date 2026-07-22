@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if not errorlevel 1 (
  node configure-api.mjs
  pause
  exit /b %errorlevel%
)

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" configure-api.mjs
  pause
  exit /b %errorlevel%
)

echo Node.js was not found. Install Node.js 18 or newer and try again.
pause
exit /b 1
