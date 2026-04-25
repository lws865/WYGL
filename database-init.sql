-- ============================================
-- 物业管理系统 SQLite 数据库初始化脚本
-- 数据库文件: data/property_management.db
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);

-- 管理员列表表
CREATE TABLE IF NOT EXISTS adminList (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    createTime TEXT
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    createTime TEXT
);

-- 管理员密码表
CREATE TABLE IF NOT EXISTS adminPassword (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password TEXT NOT NULL
);

-- 楼栋表
CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL,
    floorCount INTEGER NOT NULL
);

-- 楼梯表
CREATE TABLE IF NOT EXISTS stairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buildingId INTEGER NOT NULL,
    number TEXT NOT NULL,
    FOREIGN KEY (buildingId) REFERENCES buildings(id)
);

-- 楼层表
CREATE TABLE IF NOT EXISTS floors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stairId INTEGER NOT NULL,
    buildingId INTEGER,
    floorNumber INTEGER NOT NULL,
    FOREIGN KEY (stairId) REFERENCES stairs(id)
);

-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buildingId INTEGER NOT NULL,
    stairId INTEGER NOT NULL,
    floorNumber INTEGER NOT NULL,
    roomNumber TEXT NOT NULL,
    FOREIGN KEY (buildingId) REFERENCES buildings(id),
    FOREIGN KEY (stairId) REFERENCES stairs(id)
);

-- 住户表
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
);

-- 物业费数据表
CREATE TABLE IF NOT EXISTS property_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
);

-- 卫生费数据表
CREATE TABLE IF NOT EXISTS sanitation_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
);

-- 汽车停车费数据表
CREATE TABLE IF NOT EXISTS car_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
);

-- 摩托车停车费数据表
CREATE TABLE IF NOT EXISTS motorcycle_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
);

-- 其他费用数据表
CREATE TABLE IF NOT EXISTS other_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
);

-- 缴费分类表
CREATE TABLE IF NOT EXISTS feeCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    subItems TEXT
);

-- 缴费记录表
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    residentId INTEGER,
    feeType TEXT,
    feeId INTEGER,
    amount REAL,
    paymentDate TEXT,
    status TEXT,
    FOREIGN KEY (residentId) REFERENCES residents(id)
);

-- ============================================
-- 插入默认数据
-- ============================================

-- 插入默认用户
INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'aa888888', 'admin');

-- 插入默认管理员数据
INSERT OR IGNORE INTO adminList (username, password, role, createTime) VALUES ('admin', 'aa888888', '超级管理员', '2024-01-01');
INSERT OR IGNORE INTO admin (username, password, role, createTime) VALUES ('admin', 'aa888888', '超级管理员', '2024-01-01');
INSERT OR IGNORE INTO adminPassword (id, password) VALUES (1, 'aa888888');

-- 插入缴费分类数据
INSERT OR IGNORE INTO feeCategories (name, value, subItems) VALUES ('物业费', 'property', '[{"id":101,"name":"物业费","value":"property_fee"},{"id":102,"name":"电梯费","value":"elevator_fee"}]');
INSERT OR IGNORE INTO feeCategories (name, value, subItems) VALUES ('卫生费', 'sanitation', '[{"id":201,"name":"卫生费","value":"sanitation_fee"},{"id":202,"name":"垃圾处理费","value":"garbage_fee"}]');
INSERT OR IGNORE INTO feeCategories (name, value, subItems) VALUES ('汽车停车费', 'car', '[{"id":301,"name":"汽车停车费","value":"car_parking"}]');
INSERT OR IGNORE INTO feeCategories (name, value, subItems) VALUES ('摩托车停车费', 'motorcycle', '[{"id":401,"name":"摩托车停车费","value":"motorcycle_parking"}]');
INSERT OR IGNORE INTO feeCategories (name, value, subItems) VALUES ('水电费', 'water', '[{"id":501,"name":"水费","value":"water_fee"},{"id":502,"name":"电费","value":"electricity_fee"}]');
INSERT OR IGNORE INTO feeCategories (name, value, subItems) VALUES ('其他收入', 'other', '[{"id":601,"name":"其他费用","value":"other_fee"}]');
