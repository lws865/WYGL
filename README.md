# 物业管理系统 - SQLite实体数据库版

## 项目简介

这是一个基于SQLite实体数据库的物业管理系统，提供完整的物业管理功能。

## 系统架构

- **前端**: HTML/CSS/JavaScript
- **后端**: Node.js + Express
- **数据库**: SQLite3
- **数据库文件位置**: `data/property_management.db`

## 安装步骤

### 1. 安装Node.js

确保你的电脑已安装Node.js（建议版本14或更高）。

### 2. 安装依赖

在项目根目录下执行：

```bash
npm install
```

### 3. 初始化数据库

执行以下命令创建数据库并插入默认数据：

```bash
npm run init-db
```

这将在 `data/` 文件夹下创建 `property_management.db` 数据库文件。

### 4. 启动服务器

执行以下命令启动服务器：

```bash
npm start
```

或者使用开发模式（自动重启）：

```bash
npm run dev
```

### 5. 访问系统

在浏览器中打开：`http://localhost:3000`

## 默认登录账号

- **用户名**: `admin`
- **密码**: `aa888888`

## 数据库结构

系统包含以下数据表：

### 用户相关
- `users` - 用户表
- `adminList` - 管理员列表表
- `admin` - 管理员表
- `adminPassword` - 管理员密码表

### 楼房相关
- `buildings` - 楼栋表
- `stairs` - 楼梯表
- `floors` - 楼层表
- `rooms` - 房间表

### 住户相关
- `residents` - 住户表

### 费用相关
- `property_fees` - 物业费数据表
- `sanitation_fees` - 卫生费数据表
- `car_fees` - 汽车停车费数据表
- `motorcycle_fees` - 摩托车停车费数据表
- `other_fees` - 其他费用数据表
- `feeCategories` - 缴费分类表

### 缴费相关
- `payments` - 缴费记录表

## API接口文档

### 基础URL
`http://localhost:3000/api`

### 楼栋管理
- `GET /api/buildings` - 获取所有楼栋
- `POST /api/buildings` - 添加楼栋
- `PUT /api/buildings/:id` - 更新楼栋
- `DELETE /api/buildings/:id` - 删除楼栋

### 梯号管理
- `GET /api/stairs` - 获取所有梯号
- `POST /api/stairs` - 添加梯号
- `PUT /api/stairs/:id` - 更新梯号
- `DELETE /api/stairs/:id` - 删除梯号

### 层号管理
- `GET /api/floors` - 获取所有层号
- `POST /api/floors` - 添加层号
- `DELETE /api/floors/:id` - 删除层号

### 房号管理
- `GET /api/rooms` - 获取所有房号
- `POST /api/rooms` - 添加房号
- `DELETE /api/rooms/:id` - 删除房号

### 住户管理
- `GET /api/residents` - 获取所有住户
- `POST /api/residents` - 添加住户
- `PUT /api/residents/:id` - 更新住户
- `DELETE /api/residents/:id` - 删除住户

### 费用管理
- `GET /api/fees/:type` - 获取费用数据
- `POST /api/fees/:type` - 添加费用
- `DELETE /api/fees/:type/:id` - 删除费用

## 数据库备份

数据库文件位于 `data/property_management.db`，你可以直接复制该文件进行备份。

## 注意事项

1. 确保3000端口未被占用
2. 首次使用前必须初始化数据库
3. 数据库文件会自动保存在data文件夹下
4. 建议定期备份数据库文件

## 技术支持

如有问题，请检查：
1. Node.js版本是否正确
2. 依赖是否完整安装
3. 数据库是否正确初始化
4. 端口是否被占用
