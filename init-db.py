import sqlite3
import os
import json
from datetime import datetime

# 数据库文件路径
db_dir = r'E:\Trae lws\LWS_web_sqlite\data'
db_path = os.path.join(db_dir, 'property_management.db')

# 确保data目录存在
os.makedirs(db_dir, exist_ok=True)

print('='*50)
print('物业管理系统 - SQLite数据库初始化')
print('='*50)
print(f'\n数据库文件: {db_path}')

# 连接数据库（如果不存在会自动创建）
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print('\n正在创建数据表...')

# 用户表
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)
''')
print('✓ users表创建成功')

# 管理员列表表
cursor.execute('''
CREATE TABLE IF NOT EXISTS adminList (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    createTime TEXT
)
''')
print('✓ adminList表创建成功')

# 管理员表
cursor.execute('''
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    createTime TEXT
)
''')
print('✓ admin表创建成功')

# 管理员密码表
cursor.execute('''
CREATE TABLE IF NOT EXISTS adminPassword (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password TEXT NOT NULL
)
''')
print('✓ adminPassword表创建成功')

# 楼栋表
cursor.execute('''
CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL,
    floorCount INTEGER NOT NULL
)
''')
print('✓ buildings表创建成功')

# 楼梯表
cursor.execute('''
CREATE TABLE IF NOT EXISTS stairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buildingId INTEGER NOT NULL,
    number TEXT NOT NULL,
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
)
''')
print('✓ stairs表创建成功')

# 楼层表
cursor.execute('''
CREATE TABLE IF NOT EXISTS floors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stairId INTEGER NOT NULL,
    buildingId INTEGER,
    floorNumber INTEGER NOT NULL,
    FOREIGN KEY (stairId) REFERENCES stairs(id)
)
''')
print('✓ floors表创建成功')

# 房间表
cursor.execute('''
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buildingId INTEGER NOT NULL,
    stairId INTEGER NOT NULL,
    floorNumber INTEGER NOT NULL,
    roomNumber TEXT NOT NULL,
    FOREIGN KEY (buildingId) REFERENCES buildings(id),
    FOREIGN KEY (stairId) REFERENCES stairs(id)
)
''')
print('✓ rooms表创建成功')

# 住户表
cursor.execute('''
CREATE TABLE IF NOT EXISTS residents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    buildingId INTEGER,
    stairId INTEGER,
    floorId INTEGER,
    roomId INTEGER,
    area REAL,
    floorNumber INTEGER,
    roomNumber TEXT,
    createdAt TEXT,
    FOREIGN KEY (buildingId) REFERENCES buildings(id),
    FOREIGN KEY (stairId) REFERENCES stairs(id),
    FOREIGN KEY (floorId) REFERENCES floors(id),
    FOREIGN KEY (roomId) REFERENCES rooms(id)
)
''')
print('✓ residents表创建成功')

# 物业费数据表
cursor.execute('''
CREATE TABLE IF NOT EXISTS property_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
)
''')
print('✓ property_fees表创建成功')

# 卫生费数据表
cursor.execute('''
CREATE TABLE IF NOT EXISTS sanitation_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
)
''')
print('✓ sanitation_fees表创建成功')

# 汽车停车费数据表
cursor.execute('''
CREATE TABLE IF NOT EXISTS car_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
)
''')
print('✓ car_fees表创建成功')

# 摩托车停车费数据表
cursor.execute('''
CREATE TABLE IF NOT EXISTS motorcycle_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
)
''')
print('✓ motorcycle_fees表创建成功')

# 其他费用数据表
cursor.execute('''
CREATE TABLE IF NOT EXISTS other_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
)
''')
print('✓ other_fees表创建成功')

# 缴费分类表
cursor.execute('''
CREATE TABLE IF NOT EXISTS feeCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    subItems TEXT
)
''')
print('✓ feeCategories表创建成功')

# 缴费记录表
cursor.execute('''
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    residentId INTEGER,
    feeType TEXT,
    feeId INTEGER,
    amount REAL,
    paymentDate TEXT,
    status TEXT,
    FOREIGN KEY (residentId) REFERENCES residents(id)
)
''')
print('✓ payments表创建成功')

# 插入默认数据
print('\n正在插入默认数据...')

# 检查用户表是否为空
cursor.execute("SELECT COUNT(*) FROM users")
if cursor.fetchone()[0] == 0:
    # 插入默认用户
    cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                   ('admin', 'aa888888', 'admin'))
    print('✓ 默认用户创建成功')

    cursor.execute("INSERT INTO adminList (username, password, role, createTime) VALUES (?, ?, ?, ?)",
                   ('admin', 'aa888888', '超级管理员', '2024-01-01'))
    print('✓ adminList默认数据创建成功')

    cursor.execute("INSERT INTO admin (username, password, role, createTime) VALUES (?, ?, ?, ?)",
                   ('admin', 'aa888888', '超级管理员', '2024-01-01'))
    print('✓ admin默认数据创建成功')

    cursor.execute("INSERT INTO adminPassword (id, password) VALUES (?, ?)",
                   (1, 'aa888888'))
    print('✓ adminPassword默认数据创建成功')
else:
    print('ℹ 用户数据已存在，跳过')

# 检查缴费分类表是否为空
cursor.execute("SELECT COUNT(*) FROM feeCategories")
if cursor.fetchone()[0] == 0:
    # 插入缴费分类数据
    categories = [
        ('物业费', 'property', json.dumps([
            {'id': 101, 'name': '物业费', 'value': 'property_fee'},
            {'id': 102, 'name': '电梯费', 'value': 'elevator_fee'}
        ])),
        ('卫生费', 'sanitation', json.dumps([
            {'id': 201, 'name': '卫生费', 'value': 'sanitation_fee'},
            {'id': 202, 'name': '垃圾处理费', 'value': 'garbage_fee'}
        ])),
        ('汽车停车费', 'car', json.dumps([
            {'id': 301, 'name': '汽车停车费', 'value': 'car_parking'}
        ])),
        ('摩托车停车费', 'motorcycle', json.dumps([
            {'id': 401, 'name': '摩托车停车费', 'value': 'motorcycle_parking'}
        ])),
        ('水电费', 'water', json.dumps([
            {'id': 501, 'name': '水费', 'value': 'water_fee'},
            {'id': 502, 'name': '电费', 'value': 'electricity_fee'}
        ])),
        ('其他收入', 'other', json.dumps([
            {'id': 601, 'name': '其他费用', 'value': 'other_fee'}
        ]))
    ]

    for cat in categories:
        cursor.execute("INSERT INTO feeCategories (name, value, subItems) VALUES (?, ?, ?)", cat)

    print('✓ 缴费分类数据创建成功')
else:
    print('ℹ 缴费分类数据已存在，跳过')

# 提交事务
conn.commit()

# 关闭连接
conn.close()

print('\n' + '='*50)
print('✅ SQLite数据库初始化完成！')
print('='*50)
print(f'\n数据库文件位置: {db_path}')
print(f'数据库大小: {os.path.getsize(db_path)} 字节')
print('\n默认登录账号:')
print('  用户名: admin')
print('  密码: aa888888')
print('\n现在可以启动后端服务器了！')
