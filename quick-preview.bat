@echo off
chcp 65001 >nul
echo ======================================
echo  时差修复局 - 快速预览启动脚本
echo ======================================
echo.

REM --- 步骤 1：启动后端 ---
echo [1/3] 启动后端服务 (端口 3000)...
cd /d "%~dp0jetlag-backend"
start "JetLag Backend" cmd /c "node src/server.js"
timeout /t 3 /nobreak >nul

REM --- 步骤 2：检查后端是否启动成功 ---
echo [2/3] 检查后端状态...
curl /s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo [警告] 后端启动可能失败，请检查 node 是否安装
) else (
    echo [OK] 后端已启动: http://localhost:3000
)

REM --- 步骤 3：提示前端启动方式 ---
echo.
echo [3/3] 后端已运行！
echo.
echo ======================================
echo  请在新终端执行以下命令启动前端：
echo.
echo  cd D:\毕业设计\jetlag-frontend
echo  flutter-sdk\bin\flutter.bat run -d chrome
echo.
echo  或者使用快速隧道模式（需要 cloudflared）:
echo  1. 全局安装 cloudflared:
echo     npm install -g cloudflared
echo  2. 隧道到后端端口:
echo     cloudflared tunnel --url http://localhost:3000
echo.
echo  将生成的公网 URL 分享即可临时预览！
echo ======================================
pause
