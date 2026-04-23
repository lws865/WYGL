@echo off
chcp 65001 >nul
echo ========================================
echo   Flask 后台管理系统启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python已找到
echo.

echo 检查依赖包...
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo 正在安装Flask...
    pip install -r requirements.txt
)

echo.
echo ========================================
echo   启动服务器...
echo ========================================
echo.
echo 访问地址: http://localhost:5000
echo 默认账号: admin / admin123
echo.
echo 按Ctrl+C停止服务器
echo ========================================

python app.py

pause
