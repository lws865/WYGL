@echo off
chcp 65001 > nul
echo ========================================
echo    物业管理系统 - 数据库初始化
echo ========================================
echo.

cd /d "%~dp0"

echo 正在检查Node.js环境...
node --version > nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo [OK] Node.js已安装
echo.

echo 正在安装依赖（如果尚未安装）...
call npm install --silent > nul 2>&1
if errorlevel 1 (
    echo [警告] npm install可能有问题，继续尝试...
)

echo.
echo 正在初始化SQLite数据库...
node backend\init-database.js

if errorlevel 1 (
    echo.
    echo [错误] 数据库初始化失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✅ 数据库初始化完成！
echo ========================================
echo.
echo 数据库文件位置: %~dp0data\property_management.db
echo.
echo 默认登录账号:
echo    用户名: admin
echo    密码: aa888888
echo.
pause
