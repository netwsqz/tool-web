@echo off
title 万能工具箱 - 开发服务器

cd /d "%~dp0"

REM ---- Check and install dependencies ----
if not exist "node_modules\" (
    echo [1/3] 安装依赖...
    call npm install
    if errorlevel 1 (
        echo npm install 失败
        pause
        exit /b 1
    )
)

REM ---- Start services ----
echo [2/3] 启动服务...
echo   ws-server (WebSocket 游戏)  ^<- 端口 3001
echo   chat-server (WebSocket 聊天) ^<- 端口 3002
echo   next dev (前端)             ^<- 端口 3000

start "ws-server" /B node server/ws-server.mjs
start "chat-server" /B node server/chat-server.mjs

echo [3/3] 启动完毕 (按 Ctrl+C 停止所有服务)
echo.
call npx next dev -H 0.0.0.0

REM ---- Cleanup on exit ----
echo.
echo 正在停止所有服务...
taskkill /F /FI "WINDOWTITLE eq ws-server" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq chat-server" >nul 2>nul