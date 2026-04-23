@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%sync-client-api-env.ps1"

powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -PauseOnExit
exit /b %ERRORLEVEL%
