const fs = require('fs');
const path = require('path');

// 数据库文件路径
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'property_management.db');

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ data目录创建成功');
}

// 恢复数据库结构和默认数据
async function restoreDatabase() {
    try {
        const initSqlJs = require('sql.js');
        const SQL = await initSqlJs();
        
        // 创建新的数据库
        const db = new SQL.Database();
        
        // 创建用户表
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user'
            )
        `);
        
        // 创建默认管理员账户
        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            ['admin', 'aa888888', 'admin']);
        
        // 创建水费表
        db.run(`
            CREATE TABLE IF NOT EXISTS water_fees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL
            )
        `);
        
        // 创建其他必要的表
        db.run(`
            CREATE TABLE IF NOT EXISTS buildings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number TEXT NOT NULL,
                floorCount INTEGER NOT NULL
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS stairs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                buildingId INTEGER NOT NULL,
                number TEXT NOT NULL,
                FOREIGN KEY (buildingId) REFERENCES buildings(id)
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS floors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                buildingId INTEGER NOT NULL,
                stairId INTEGER NOT NULL,
                floorNumber INTEGER NOT NULL,
                FOREIGN KEY (buildingId) REFERENCES buildings(id),
                FOREIGN KEY (stairId) REFERENCES stairs(id)
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                buildingId INTEGER NOT NULL,
                stairId INTEGER NOT NULL,
                floorNumber INTEGER NOT NULL,
                roomNumber TEXT NOT NULL,
                FOREIGN KEY (buildingId) REFERENCES buildings(id),
                FOREIGN KEY (stairId) REFERENCES stairs(id)
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS residents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                buildingId INTEGER NOT NULL,
                stairId INTEGER NOT NULL,
                floorNumber INTEGER NOT NULL,
                roomNumber TEXT NOT NULL,
                phone TEXT NOT NULL,
                FOREIGN KEY (buildingId) REFERENCES buildings(id),
                FOREIGN KEY (stairId) REFERENCES stairs(id)
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS property_fees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS sanitation_fees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS car_fees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS motorcycle_fees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS other_fees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL
            )
        `);
        
        // 保存数据库到文件
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
        
        console.log('✅ 数据库恢复成功');
        console.log('✅ 默认管理员账户已创建：admin / aa888888');
        
    } catch (error) {
        console.error('❌ 数据库恢复失败:', error);
    }
}

// 执行恢复
restoreDatabase();