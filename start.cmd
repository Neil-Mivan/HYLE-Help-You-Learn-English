@echo off
setlocal
cd /d "%~dp0"

set "PORTABLE_NODE=%~dp0runtime\node.exe"
if exist "%PORTABLE_NODE%" (
  echo Clear Reading is running at http://127.0.0.1:4173
  echo Close the browser tab to stop the portable server.
  "%PORTABLE_NODE%" server.mjs
  exit /b %errorlevel%
)

where node >nul 2>nul
if not errorlevel 1 (
  echo Clear Reading is running at http://127.0.0.1:4173
  echo Close this window to stop the server.
  node server.mjs
  exit /b %errorlevel%
)

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  echo Clear Reading is running at http://127.0.0.1:4173
  echo Close this window to stop the server.
  "%BUNDLED_NODE%" server.mjs
  exit /b %errorlevel%
)

echo Node.js was not found. Install Node.js 18 or newer and try again.
pause
exit /b 1
