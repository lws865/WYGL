// SQLite 数据库模块
let db = null;

// 初始化 SQLite 数据库
async function initSQLiteDB() {
    return new Promise((resolve, reject) => {
        // 加载 sql.js
        const sqlPromise = initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });

        sqlPromise.then(SQL => {
            // 检查是否有保存的数据库
            const savedDB = localStorage.getItem('sqliteDB');
            if (savedDB) {
                const uint8Array = new Uint8Array(JSON.parse(savedDB));
                db = new SQL.Database(uint8Array);
                console.log('SQLite数据库加载成功');
            } else {
                db = new SQL.Database();
                console.log('SQLite数据库创建成功');
            }

            // 创建所有表
            createTables();

            resolve(db);
        }).catch(err => {
            console.error('SQLite初始化失败:', err);
            reject(err);
        });
    });
}

// 创建所有数据表
function createTables() {
    // 用户表
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `);

    // 管理员列表表
    db.run(`
        CREATE TABLE IF NOT EXISTS adminList (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            createTime TEXT
        )
    `);

    // 管理员密码表
    db.run(`
        CREATE TABLE IF NOT EXISTS adminPassword (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password TEXT NOT NULL
        )
    `);

    // 楼栋表
    db.run(`
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL,
            floorCount INTEGER NOT NULL
        )
    `);

    // 楼梯表
    db.run(`
        CREATE TABLE IF NOT EXISTS stairs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            buildingId INTEGER NOT NULL,
            number TEXT NOT NULL,
            FOREIGN KEY (buildingId) REFERENCES buildings(id)
        )
    `);

    // 楼层表
    db.run(`
        CREATE TABLE IF NOT EXISTS floors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stairId INTEGER NOT NULL,
            floorNumber INTEGER NOT NULL,
            FOREIGN KEY (stairId) REFERENCES stairs(id)
        )
    `);

    // 房间表
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

    // 住户表
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

    // 物业费数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS propertyFees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 卫生费数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS sanitationFees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 汽车停车费数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS carFees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 摩托车停车费数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS motorcycleFees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 其他费用数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS otherFees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 缴费分类表
    db.run(`
        CREATE TABLE IF NOT EXISTS feeCategories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            subItems TEXT
        )
    `);

    // 缴费记录表
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            residentName TEXT,
            feeType TEXT,
            feeTypeName TEXT,
            feeMode TEXT,
            feeSubType TEXT,
            feeUnitPrice TEXT,
            feeQuantity TEXT,
            feeUnit TEXT,
            amount REAL,
            year TEXT,
            date TEXT,
            status TEXT,
            createdAt TEXT,
            FOREIGN KEY (residentId) REFERENCES residents(id)
        )
    `);

    // 初始化默认数据
    initDefaultData();

    // 保存数据库
    saveDatabase();

    console.log('所有数据表创建完成');
}

// 初始化默认数据
function initDefaultData() {
    // 检查用户表是否为空
    const usersCount = db.exec("SELECT COUNT(*) as count FROM users")[0];
    if (usersCount && usersCount.values[0][0] === 0) {
        // 初始化默认管理员用户
        db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'aa888888', 'admin')");
        db.run("INSERT INTO adminList (username, password, role, createTime) VALUES ('admin', 'aa888888', '超级管理员', '2024-01-01')");
        db.run("INSERT INTO adminPassword (id, password) VALUES (1, 'aa888888')");
        console.log('默认用户数据初始化完成');
    }

    // 检查楼栋表是否为空
    const buildingsCount = db.exec("SELECT COUNT(*) as count FROM buildings")[0];
    if (buildingsCount && buildingsCount.values[0][0] === 0) {
        // 初始化默认楼栋数据
        db.run("INSERT INTO buildings (number, floorCount) VALUES ('A栋', 18)");
        db.run("INSERT INTO buildings (number, floorCount) VALUES ('B栋', 24)");
        db.run("INSERT INTO buildings (number, floorCount) VALUES ('C栋', 30)");
        console.log('默认楼栋数据初始化完成');
    }

    // 检查楼梯表是否为空
    const stairsCount = db.exec("SELECT COUNT(*) as count FROM stairs")[0];
    if (stairsCount && stairsCount.values[0][0] === 0) {
        // 初始化默认楼梯数据
        db.run("INSERT INTO stairs (buildingId, number) VALUES (1, '1号楼梯')");
        db.run("INSERT INTO stairs (buildingId, number) VALUES (2, '1号楼梯')");
        db.run("INSERT INTO stairs (buildingId, number) VALUES (3, '1号楼梯')");
        console.log('默认楼梯数据初始化完成');
    }

    // 检查楼层表是否为空
    const floorsCount = db.exec("SELECT COUNT(*) as count FROM floors")[0];
    if (floorsCount && floorsCount.values[0][0] === 0) {
        // 初始化楼层数据 (为A栋创建18层)
        for (let i = 1; i <= 18; i++) {
            db.run(`INSERT INTO floors (stairId, floorNumber) VALUES (1, ${i})`);
        }
        // 为B栋创建24层
        for (let i = 1; i <= 24; i++) {
            db.run(`INSERT INTO floors (stairId, floorNumber) VALUES (2, ${i})`);
        }
        // 为C栋创建30层
        for (let i = 1; i <= 30; i++) {
            db.run(`INSERT INTO floors (stairId, floorNumber) VALUES (3, ${i})`);
        }
        console.log('默认楼层数据初始化完成');
    }

    // 检查房间表是否为空
    const roomsCount = db.exec("SELECT COUNT(*) as count FROM rooms")[0];
    if (roomsCount && roomsCount.values[0][0] === 0) {
        // 初始化房间数据 (只创建3个房间作为示例)
        db.run("INSERT INTO rooms (buildingId, stairId, floorNumber, roomNumber) VALUES (1, 1, 8, '801')");
        db.run("INSERT INTO rooms (buildingId, stairId, floorNumber, roomNumber) VALUES (1, 1, 8, '802')");
        db.run("INSERT INTO rooms (buildingId, stairId, floorNumber, roomNumber) VALUES (1, 1, 8, '803')");
        console.log('默认房间数据初始化完成');
    }

    // 检查住户表是否为空
    const residentsCount = db.exec("SELECT COUNT(*) as count FROM residents")[0];
    if (residentsCount && residentsCount.values[0][0] === 0) {
        // 初始化默认住户数据
        const stmt = db.prepare("INSERT INTO residents (name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run(['林伟升', '13800138000', 1, 1, 8, 1, 120.5, 8, '801', '2024-01-01']);
        stmt.run(['张三', '13800138001', 1, 1, 8, 2, 100.0, 8, '802', '2024-01-02']);
        stmt.run(['李四', '13800138002', 1, 1, 8, 3, 90.0, 8, '803', '2024-01-03']);
        stmt.free();
        console.log('默认住户数据初始化完成');
    }

    // 检查物业费表是否为空
    const propertyFeesCount = db.exec("SELECT COUNT(*) as count FROM propertyFees")[0];
    if (propertyFeesCount && propertyFeesCount.values[0][0] === 0) {
        db.run("INSERT INTO propertyFees (description, amount) VALUES ('1至3层', 1)");
        db.run("INSERT INTO propertyFees (description, amount) VALUES ('4至6层', 1.5)");
        db.run("INSERT INTO propertyFees (description, amount) VALUES ('7层及以上', 2)");
        console.log('默认物业费数据初始化完成');
    }

    // 检查卫生费表是否为空
    const sanitationFeesCount = db.exec("SELECT COUNT(*) as count FROM sanitationFees")[0];
    if (sanitationFeesCount && sanitationFeesCount.values[0][0] === 0) {
        db.run("INSERT INTO sanitationFees (description, amount) VALUES ('生活垃圾费', 30)");
        db.run("INSERT INTO sanitationFees (description, amount) VALUES ('公共区域清洁费', 20)");
        db.run("INSERT INTO sanitationFees (description, amount) VALUES ('化粪池清理费', 50)");
        console.log('默认卫生费数据初始化完成');
    }

    // 检查汽车停车费表是否为空
    const carFeesCount = db.exec("SELECT COUNT(*) as count FROM carFees")[0];
    if (carFeesCount && carFeesCount.values[0][0] === 0) {
        db.run("INSERT INTO carFees (description, amount) VALUES ('年费', 2500)");
        db.run("INSERT INTO carFees (description, amount) VALUES ('月费', 250)");
        db.run("INSERT INTO carFees (description, amount) VALUES ('临时', 5)");
        console.log('默认汽车停车费数据初始化完成');
    }

    // 检查摩托车停车费表是否为空
    const motorcycleFeesCount = db.exec("SELECT COUNT(*) as count FROM motorcycleFees")[0];
    if (motorcycleFeesCount && motorcycleFeesCount.values[0][0] === 0) {
        db.run("INSERT INTO motorcycleFees (description, amount) VALUES ('年费', 500)");
        db.run("INSERT INTO motorcycleFees (description, amount) VALUES ('月费', 50)");
        db.run("INSERT INTO motorcycleFees (description, amount) VALUES ('临时', 2)");
        console.log('默认摩托车停车费数据初始化完成');
    }

    // 检查其他费用表是否为空
    const otherFeesCount = db.exec("SELECT COUNT(*) as count FROM otherFees")[0];
    if (otherFeesCount && otherFeesCount.values[0][0] === 0) {
        db.run("INSERT INTO otherFees (description, amount) VALUES ('垃圾处理费', 50)");
        db.run("INSERT INTO otherFees (description, amount) VALUES ('公共设施维修费', 100)");
        db.run("INSERT INTO otherFees (description, amount) VALUES ('广告费', 200)");
        console.log('默认其他费用数据初始化完成');
    }

    // 检查缴费分类表是否为空
    const feeCategoriesCount = db.exec("SELECT COUNT(*) as count FROM feeCategories")[0];
    if (feeCategoriesCount && feeCategoriesCount.values[0][0] === 0) {
        const defaultCategories = [
            { name: '物业费', value: 'property' },
            { name: '卫生费', value: 'sanitation' },
            { name: '汽车停车费', value: 'car' },
            { name: '摩托停车费', value: 'motorcycle' },
            { name: '水费', value: 'water' },
            { name: '其他收入', value: 'other' }
        ];
        const stmt = db.prepare("INSERT INTO feeCategories (name, value, subItems) VALUES (?, ?, ?)");
        defaultCategories.forEach(cat => {
            stmt.run([cat.name, cat.value, '']);
        });
        stmt.free();
        console.log('默认缴费分类数据初始化完成');
    }
}

// 保存数据库到 localStorage
function saveDatabase() {
    if (db) {
        const data = db.export();
        const arr = Array.from(data);
        localStorage.setItem('sqliteDB', JSON.stringify(arr));
        console.log('数据库已保存到localStorage');
    }
}

// 执行 SQL 查询 (SELECT)
function query(sql) {
    try {
        const result = db.exec(sql);
        if (result.length === 0) return [];
        const columns = result[0].columns;
        const values = result[0].values;
        return values.map(row => {
            const obj = {};
            columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });
    } catch (err) {
        console.error('SQL查询错误:', err, sql);
        return [];
    }
}

// 执行 SQL 语句 (INSERT, UPDATE, DELETE)
function run(sql, params = []) {
    try {
        db.run(sql, params);
        saveDatabase();
        return true;
    } catch (err) {
        console.error('SQL执行错误:', err, sql);
        return false;
    }
}

// 获取单条记录
function getOne(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
        }
        stmt.free();
        return null;
    } catch (err) {
        console.error('SQL查询错误:', err, sql);
        return null;
    }
}

// 获取插入记录的ID
function getLastInsertId() {
    const result = db.exec("SELECT last_insert_rowid() as id");
    if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0];
    }
    return null;
}

// 关闭数据库
function closeDatabase() {
    if (db) {
        saveDatabase();
        db.close();
        db = null;
        console.log('数据库已关闭');
    }
}

// 导出数据库到文件
function exportDatabase() {
    if (db) {
        const data = db.export();
        const buffer = data.buffer;
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lws_database.sqlite';
        a.click();
        URL.revokeObjectURL(url);
        console.log('数据库已导出');
    }
}

// 从 localStorage 迁移数据到 SQLite
async function migrateFromLocalStorage() {
    console.log('开始迁移 localStorage 数据到 SQLite...');

    // 迁移住户数据
    const residents = JSON.parse(localStorage.getItem('residents') || '[]');
    if (residents.length > 0) {
        residents.forEach(r => {
            const stmt = db.prepare("INSERT INTO residents (id, name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            stmt.run([r.id, r.name, r.phone, r.buildingId, r.stairId, r.floorId, r.roomId, r.area, r.floorNumber, r.roomNumber, r.createdAt]);
            stmt.free();
        });
        console.log(`迁移了 ${residents.length} 条住户数据`);
    }

    // 迁移缴费记录
    const payments = JSON.parse(localStorage.getItem('payments') || '[]');
    if (payments.length > 0) {
        payments.forEach(p => {
            const stmt = db.prepare("INSERT INTO payments (id, residentId, residentName, feeType, feeTypeName, feeMode, feeSubType, feeUnitPrice, feeQuantity, feeUnit, amount, year, date, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            stmt.run([p.id, p.residentId, p.residentName, p.feeType, p.feeTypeName, p.feeMode, p.feeSubType, p.feeUnitPrice, p.feeQuantity, p.feeUnit, p.amount, p.year, p.date, p.status, p.createdAt]);
            stmt.free();
        });
        console.log(`迁移了 ${payments.length} 条缴费记录`);
    }

    saveDatabase();
    console.log('数据迁移完成！');
}

// 清空所有数据并重新初始化
function resetDatabase() {
    db.run("DELETE FROM payments");
    db.run("DELETE FROM residents");
    db.run("DELETE FROM rooms");
    db.run("DELETE FROM floors");
    db.run("DELETE FROM stairs");
    db.run("DELETE FROM buildings");
    db.run("DELETE FROM propertyFees");
    db.run("DELETE FROM sanitationFees");
    db.run("DELETE FROM carFees");
    db.run("DELETE FROM motorcycleFees");
    db.run("DELETE FROM otherFees");
    db.run("DELETE FROM feeCategories");
    db.run("DELETE FROM users");
    db.run("DELETE FROM adminList");
    db.run("DELETE FROM adminPassword");
    saveDatabase();
    createTables();
    console.log('数据库已重置');
}