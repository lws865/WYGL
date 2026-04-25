# 物业管理系统 - 快速启动脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   物业管理系统 - 快速启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Node.js是否安装
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[1/4] 检测Node.js... 完成" -ForegroundColor Green
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "[错误] 未检测到Node.js，请先安装Node.js!" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""

# 检查node_modules是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "[2/4] 正在安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 依赖安装失败!" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
    Write-Host "[2/4] 依赖安装完成!" -ForegroundColor Green
} else {
    Write-Host "[2/4] 依赖已安装，跳过" -ForegroundColor Gray
}

Write-Host ""

# 检查数据库是否存在
if (-not (Test-Path "data\property_management.db")) {
    Write-Host "[3/4] 正在初始化数据库..." -ForegroundColor Yellow
    npm run init-db
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 数据库初始化失败!" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
    Write-Host "[3/4] 数据库初始化完成!" -ForegroundColor Green
} else {
    Write-Host "[3/4] 数据库已存在，跳过" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[4/4] 正在启动服务器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   服务器启动中..." -ForegroundColor Green
Write-Host ""
Write-Host "   访问地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "   默认账号: admin" -ForegroundColor Yellow
Write-Host "   默认密码: aa888888" -ForegroundColor Yellow
Write-Host ""
Write-Host "   按 Ctrl+C 停止服务器" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm start
