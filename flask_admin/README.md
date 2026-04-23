# Flask 后台管理系统

基于 Python Flask 和 SQLite3 的后台管理系统。

## 功能特性

- ✅ 用户登录/登出
- ✅ 用户管理（增删改查）
- ✅ 角色权限控制（admin/user）
- ✅ RESTful API 接口
- ✅ 响应式后台界面

## 技术栈

- **后端**: Python Flask
- **数据库**: SQLite3
- **前端**: HTML5 + CSS3 + JavaScript

## 项目结构

```
flask_admin/
├── app.py              # 主应用文件
├── requirements.txt    # Python依赖
├── flask_admin.db      # SQLite数据库文件（自动创建）
├── start.bat           # Windows启动脚本
├── templates/          # HTML模板
│   ├── login.html      # 登录页面
│   ├── dashboard.html  # 控制台页面
│   └── users.html      # 用户管理页面
└── static/            # 静态文件（备用）
```

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动服务

```bash
# Windows
start.bat

# 或手动启动
python app.py
```

### 3. 访问系统

打开浏览器访问: http://localhost:5000

**默认账号**: admin / admin123

## API 接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /login | 用户登录 | 公开 |
| POST | /logout | 用户登出 | 需要登录 |
| GET | /api/users | 获取用户列表 | 需要登录 |
| GET | /api/users/<id> | 获取单个用户 | 需要登录 |
| POST | /api/users | 创建用户 | 管理员 |
| PUT | /api/users/<id> | 更新用户 | 管理员/自己 |
| DELETE | /api/users/<id> | 删除用户 | 管理员 |

## 数据库表

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 用户名，唯一 |
| password | TEXT | 密码（SHA256加密） |
| email | TEXT | 邮箱 |
| role | TEXT | 角色（admin/user） |
| created_at | TIMESTAMP | 创建时间 |
