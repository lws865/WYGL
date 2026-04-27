const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'property_management.db'); // 使用用户指定的数据库

console.log('='*50);
console.log('物业管理系统 - SQLite数据库初始化');
console.log('='*50);
console.log(`\n数据库文件: ${dbPath}`);

async function initDatabase() {
    const SQL = await initSqlJs();

    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        if (fileBuffer.length > 100) {
            try {
                const db = new SQL.Database(fileBuffer);
                console.log('✓ 已加载现有数据库');
                db.close();
            } catch (e) {
                console.log('⚠ 数据库文件无效，将重新创建');
                fs.unlinkSync(dbPath);
            }
        } else {
            console.log('⚠ 数据库文件过小，将重新创建');
            fs.unlinkSync(dbPath);
        }
    }

    const db = new SQL.Database();
    console.log('✓ 创建新数据库');

    console.log('\n正在创建数据表...');

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `);
    console.log('✓ users表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS adminList (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            createTime TEXT
        )
    `);
    console.log('✓ adminList表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            createTime TEXT
        )
    `);
    console.log('✓ admin表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS adminPassword (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password TEXT NOT NULL
        )
    `);
    console.log('✓ adminPassword表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL,
            floorCount INTEGER NOT NULL
        )
    `);
    console.log('✓ buildings表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS stairs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            buildingId INTEGER NOT NULL,
            number TEXT NOT NULL,
            FOREIGN KEY (buildingId) REFERENCES buildings(id)
        )
    `);
    console.log('✓ stairs表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS floors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stairId INTEGER NOT NULL,
            buildingId INTEGER,
            floorNumber INTEGER NOT NULL,
            FOREIGN KEY (stairId) REFERENCES stairs(id)
        )
    `);
    console.log('✓ floors表创建成功');

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
    console.log('✓ rooms表创建成功');

    db.run(`
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
    `);
    console.log('✓ residents表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS property_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);
    console.log('✓ property_fees表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS sanitation_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);
    console.log('✓ sanitation_fees表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS car_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);
    console.log('✓ car_fees表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS motorcycle_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);
    console.log('✓ motorcycle_fees表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS other_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);
    console.log('✓ other_fees表创建成功');

    db.run(`
        CREATE TABLE IF NOT EXISTS feeCategories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            subItems TEXT
        )
    `);
    console.log('✓ feeCategories表创建成功');

    db.run(`
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
    `);
    console.log('✓ payments表创建成功');

    console.log('\n正在插入默认数据...');

    db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'aa888888', 'admin')");
    console.log('✓ 默认用户创建成功');

    db.run("INSERT INTO adminList (username, password, role, createTime) VALUES ('admin', 'aa888888', '超级管理员', '2024-01-01')");
    console.log('✓ adminList默认数据创建成功');

    db.run("INSERT INTO admin (username, password, role, createTime) VALUES ('admin', 'aa888888', '超级管理员', '2024-01-01')");
    console.log('✓ admin默认数据创建成功');

    db.run("INSERT INTO adminPassword (id, password) VALUES (1, 'aa888888')");
    console.log('✓ adminPassword默认数据创建成功');

    db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('物业费', 'property', '[{\"id\":101,\"name\":\"物业费\",\"value\":\"property_fee\"},{\"id\":102,\"name\":\"电梯费\",\"value\":\"elevator_fee\"}]')");
    db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('卫生费', 'sanitation', '[{\"id\":201,\"name\":\"卫生费\",\"value\":\"sanitation_fee\"},{\"id\":202,\"name\":\"垃圾处理费\",\"value\":\"garbage_fee\"}]')");
    db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('汽车停车费', 'car', '[{\"id\":301,\"name\":\"汽车停车费\",\"value\":\"car_parking\"}]')");
    db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('摩托车停车费', 'motorcycle', '[{\"id\":401,\"name\":\"摩托车停车费\",\"value\":\"motorcycle_parking\"}]')");
    db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('水电费', 'water', '[{\"id\":501,\"name\":\"水费\",\"value\":\"water_fee\"},{\"id\":502,\"name\":\"电费\",\"value\":\"electricity_fee\"}]')");
    db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('其他收入', 'other', '[{\"id\":601,\"name\":\"其他费用\",\"value\":\"other_fee\"}]')");
    console.log('✓ 缴费分类数据创建成功');

    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    db.close();

    console.log('\n' + '='*50);
    console.log('✅ SQLite数据库初始化完成！');
    console.log('='*50);
    console.log(`\n数据库文件位置: ${dbPath}`);
    console.log(`数据库大小: ${fs.statSync(dbPath).size} 字节`);
    console.log('\n默认登录账号:');
    console.log('  用户名: admin');
    console.log('  密码: aa888888');
}

initDatabase().catch(err => {
    console.error('初始化失败:', err);
    process.exit(1);
});
