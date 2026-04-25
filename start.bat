@echo off
chcp 65001 >nul
echo ========================================
echo    物业管理系统 - 快速启动
echo ========================================
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js!
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] 检测Node.js... 完成
node --version
echo.

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo [2/4] 正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败!
        pause
        exit /b 1
    )
    echo [2/4] 依赖安装完成!
) else (
    echo [2/4] 依赖已安装，跳过
)

echo.

REM 检查数据库是否存在
if not exist "data\property_management.db" (
    echo [3/4] 正在初始化数据库...
    call npm run init-db
    if %errorlevel% neq 0 (
        echo [错误] 数据库初始化失败!
        pause
        exit /b 1
    )
    echo [3/4] 数据库初始化完成!
) else (
    echo [3/4] 数据库已存在，跳过
)

echo.
echo [4/4] 正在启动服务器...
echo.
echo ========================================
echo    服务器启动中...
echo.
echo    访问地址: http://localhost:3000
echo.
echo    默认账号: admin
echo    默认密码: aa888888
echo.
echo    按 Ctrl+C 停止服务器
echo ========================================
echo.

call npm start

pause
