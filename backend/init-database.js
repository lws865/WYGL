const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据库目录存在
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// 数据库文件路径
const dbPath = path.join(dbDir, 'property_management.db');

console.log('开始初始化SQLite数据库...');
console.log('数据库文件:', dbPath);

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
        process.exit(1);
    }
    console.log('数据库连接成功');
});

// 开始事务
db.serialize(() => {
    console.log('开始创建数据表...');

    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )`, (err) => {
        if (err) console.error('创建users表失败:', err.message);
        else console.log('✓ users表创建成功');
    });

    // 管理员列表表
    db.run(`CREATE TABLE IF NOT EXISTS adminList (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        createTime TEXT
    )`, (err) => {
        if (err) console.error('创建adminList表失败:', err.message);
        else console.log('✓ adminList表创建成功');
    });

    // 管理员表
    db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        createTime TEXT
    )`, (err) => {
        if (err) console.error('创建admin表失败:', err.message);
        else console.log('✓ admin表创建成功');
    });

    // 管理员密码表
    db.run(`CREATE TABLE IF NOT EXISTS adminPassword (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        password TEXT NOT NULL
    )`, (err) => {
        if (err) console.error('创建adminPassword表失败:', err.message);
        else console.log('✓ adminPassword表创建成功');
    });

    // 楼栋表
    db.run(`CREATE TABLE IF NOT EXISTS buildings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL,
        floorCount INTEGER NOT NULL
    )`, (err) => {
        if (err) console.error('创建buildings表失败:', err.message);
        else console.log('✓ buildings表创建成功');
    });

    // 楼梯表
    db.run(`CREATE TABLE IF NOT EXISTS stairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buildingId INTEGER NOT NULL,
        number TEXT NOT NULL,
        FOREIGN KEY (buildingId) REFERENCES buildings(id)
    )`, (err) => {
        if (err) console.error('创建stairs表失败:', err.message);
        else console.log('✓ stairs表创建成功');
    });

    // 楼层表
    db.run(`CREATE TABLE IF NOT EXISTS floors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stairId INTEGER NOT NULL,
        buildingId INTEGER,
        floorNumber INTEGER NOT NULL,
        FOREIGN KEY (stairId) REFERENCES stairs(id)
    )`, (err) => {
        if (err) console.error('创建floors表失败:', err.message);
        else console.log('✓ floors表创建成功');
    });

    // 房间表
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buildingId INTEGER NOT NULL,
        stairId INTEGER NOT NULL,
        floorNumber INTEGER NOT NULL,
        roomNumber TEXT NOT NULL,
        FOREIGN KEY (buildingId) REFERENCES buildings(id),
        FOREIGN KEY (stairId) REFERENCES stairs(id)
    )`, (err) => {
        if (err) console.error('创建rooms表失败:', err.message);
        else console.log('✓ rooms表创建成功');
    });

    // 住户表
    db.run(`CREATE TABLE IF NOT EXISTS residents (
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
    )`, (err) => {
        if (err) console.error('创建residents表失败:', err.message);
        else console.log('✓ residents表创建成功');
    });

    // 物业费数据表
    db.run(`CREATE TABLE IF NOT EXISTS property_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL
    )`, (err) => {
        if (err) console.error('创建property_fees表失败:', err.message);
        else console.log('✓ property_fees表创建成功');
    });

    // 卫生费数据表
    db.run(`CREATE TABLE IF NOT EXISTS sanitation_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL
    )`, (err) => {
        if (err) console.error('创建sanitation_fees表失败:', err.message);
        else console.log('✓ sanitation_fees表创建成功');
    });

    // 汽车停车费数据表
    db.run(`CREATE TABLE IF NOT EXISTS car_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL
    )`, (err) => {
        if (err) console.error('创建car_fees表失败:', err.message);
        else console.log('✓ car_fees表创建成功');
    });

    // 摩托车停车费数据表
    db.run(`CREATE TABLE IF NOT EXISTS motorcycle_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL
    )`, (err) => {
        if (err) console.error('创建motorcycle_fees表失败:', err.message);
        else console.log('✓ motorcycle_fees表创建成功');
    });

    // 其他费用数据表
    db.run(`CREATE TABLE IF NOT EXISTS other_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL
    )`, (err) => {
        if (err) console.error('创建other_fees表失败:', err.message);
        else console.log('✓ other_fees表创建成功');
    });

    // 缴费分类表
    db.run(`CREATE TABLE IF NOT EXISTS feeCategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        subItems TEXT
    )`, (err) => {
        if (err) console.error('创建feeCategories表失败:', err.message);
        else console.log('✓ feeCategories表创建成功');
    });

    // 缴费记录表
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        residentId INTEGER,
        feeType TEXT,
        feeId INTEGER,
        amount REAL,
        paymentDate TEXT,
        status TEXT,
        FOREIGN KEY (residentId) REFERENCES residents(id)
    )`, (err) => {
        if (err) console.error('创建payments表失败:', err.message);
        else console.log('✓ payments表创建成功');
    });

    // 插入默认数据
    console.log('开始插入默认数据...');

    // 检查用户表是否为空
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
            console.error('查询users表失败:', err.message);
            return;
        }
        if (row.count === 0) {
            db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                ['admin', 'aa888888', 'admin'], (err) => {
                if (err) console.error('插入默认用户失败:', err.message);
                else console.log('✓ 默认用户创建成功');
            });
            
            db.run("INSERT INTO adminList (username, password, role, createTime) VALUES (?, ?, ?, ?)", 
                ['admin', 'aa888888', '超级管理员', '2024-01-01'], (err) => {
                if (err) console.error('插入adminList数据失败:', err.message);
                else console.log('✓ adminList默认数据创建成功');
            });
            
            db.run("INSERT INTO admin (username, password, role, createTime) VALUES (?, ?, ?, ?)", 
                ['admin', 'aa888888', '超级管理员', '2024-01-01'], (err) => {
                if (err) console.error('插入admin数据失败:', err.message);
                else console.log('✓ admin默认数据创建成功');
            });
            
            db.run("INSERT INTO adminPassword (id, password) VALUES (?, ?)", 
                [1, 'aa888888'], (err) => {
                if (err) console.error('插入adminPassword数据失败:', err.message);
                else console.log('✓ adminPassword默认数据创建成功');
            });
        }
    });

    // 检查缴费分类表是否为空
    db.get("SELECT COUNT(*) as count FROM feeCategories", (err, row) => {
        if (err) {
            console.error('查询feeCategories表失败:', err.message);
            return;
        }
        if (row.count === 0) {
            const propertySubItems = JSON.stringify([
                { id: 101, name: '物业费', value: 'property_fee' },
                { id: 102, name: '电梯费', value: 'elevator_fee' }
            ]);
            
            const sanitationSubItems = JSON.stringify([
                { id: 201, name: '卫生费', value: 'sanitation_fee' },
                { id: 202, name: '垃圾处理费', value: 'garbage_fee' }
            ]);
            
            const carSubItems = JSON.stringify([
                { id: 301, name: '汽车停车费', value: 'car_parking' }
            ]);
            
            const motorcycleSubItems = JSON.stringify([
                { id: 401, name: '摩托车停车费', value: 'motorcycle_parking' }
            ]);
            
            const waterSubItems = JSON.stringify([
                { id: 501, name: '水费', value: 'water_fee' },
                { id: 502, name: '电费', value: 'electricity_fee' }
            ]);
            
            const otherSubItems = JSON.stringify([
                { id: 601, name: '其他费用', value: 'other_fee' }
            ]);

            const categories = [
                ['物业费', 'property', propertySubItems],
                ['卫生费', 'sanitation', sanitationSubItems],
                ['汽车停车费', 'car', carSubItems],
                ['摩托车停车费', 'motorcycle', motorcycleSubItems],
                ['水电费', 'water', waterSubItems],
                ['其他收入', 'other', otherSubItems]
            ];

            categories.forEach(cat => {
                db.run("INSERT INTO feeCategories (name, value, subItems) VALUES (?, ?, ?)", 
                    cat, (err) => {
                    if (err) console.error('插入缴费分类失败:', err.message);
                });
            });
            
            console.log('✓ 缴费分类数据创建成功');
        }
    });

    setTimeout(() => {
        console.log('\n✅ SQLite数据库初始化完成！');
        console.log('数据库文件位置:', dbPath);
        db.close();
    }, 1000);
});
