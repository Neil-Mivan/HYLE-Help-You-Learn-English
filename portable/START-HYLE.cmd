@echo off
setlocal
cd /d "%~dp0"
if not exist "runtime\bin\java.exe" goto missing
if not exist "hyle.jar" goto missing
if not defined PORT set "PORT=4173"
if not defined CLEAR_READING_AUTO_OPEN set "CLEAR_READING_AUTO_OPEN=1"
if not defined CLEAR_READING_AUTO_STOP set "CLEAR_READING_AUTO_STOP=1"
if not "%CLEAR_READING_AUTO_OPEN%"=="1" goto run
powershell.exe -NoProfile -Command "try { $u='http://127.0.0.1:'+([int]$env:PORT); $s=Invoke-RestMethod ($u+'/api/status') -TimeoutSec 1; if ($null -eq $s.credentialSource) {exit 1}; Start-Process ($u+'/'); exit 0 } catch {exit 1}" >nul 2>nul
if not errorlevel 1 exit /b 0
:run
"runtime\bin\java.exe" -jar "hyle.jar"
if not errorlevel 1 exit /b 0
echo HYLE could not start. Close other HYLE windows and try again.
pause
exit /b 1
:missing
echo Right-click the ZIP, choose Extract All, then run START-HYLE.cmd in the extracted folder.
pause
exit /b 2
