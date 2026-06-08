@echo off
title WanNeng ToolBox

cd /d "%~dp0"

REM ---- Check and install dependencies ----
if not exist "node_modules\" (
    echo [1/2] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo npm install failed
        pause
        exit /b 1
    )
)

REM ---- Start unified server ----
echo [2/2] Starting server on port 3000...
echo.
call node server/dev.mjs
