// SQLite 数据库初始化脚本
// 在所有页面加载前初始化SQLite数据库

let db = null;
let isDBReady = false;
let dbInitPromise = null;

// 初始化 SQLite 数据库
async function initSQLiteDB() {
    if (dbInitPromise) return dbInitPromise;

    dbInitPromise = new Promise(async (resolve, reject) => {
        try {
            // 加载 sql.js
            const sqlPromise = initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });

            const SQL = await sqlPromise;

            // 检查是否有保存的数据库
            const savedDB = localStorage.getItem('sqliteDB');
            console.log('检查本地存储中的数据库:', savedDB ? '存在' : '不存在');
            if (savedDB) {
                console.log('保存的数据库大小:', savedDB.length, '字节');
                try {
                    const parsedData = JSON.parse(savedDB);
                    console.log('解析数据库数据成功，长度:', parsedData.length);
                    const uint8Array = new Uint8Array(parsedData);
                    console.log('创建Uint8Array成功，长度:', uint8Array.length);
                    db = new SQL.Database(uint8Array);
                    console.log('SQLite数据库加载成功');
                    // 验证数据库加载是否成功
                    const testResult = db.exec("SELECT 1");
                    console.log('数据库测试结果:', testResult ? '成功' : '失败');
                } catch (err) {
                    console.error('数据库加载失败，创建新数据库:', err);
                    db = new SQL.Database();
                }
            } else {
                db = new SQL.Database();
                console.log('SQLite数据库创建成功');
            }

            // 创建所有表
            createTables();

            // 从 localStorage 迁移数据（如果有必要）
            await migrateFromLocalStorage();

            isDBReady = true;
            resolve(db);
        } catch (err) {
            console.error('SQLite初始化失败:', err);
            reject(err);
        }
    });

    return dbInitPromise;
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

    // 管理员表
    db.run(`
        CREATE TABLE IF NOT EXISTS admin (
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
            idCard TEXT,
            buildingId INTEGER,
            stairId INTEGER,
            floorId INTEGER,
            roomId INTEGER,
            area REAL,
            floorNumber INTEGER,
            roomNumber TEXT,
            status TEXT,
            renovationStatus TEXT,
            hasDebt INTEGER,
            debtAmount REAL,
            debtDescription TEXT,
            createdAt TEXT,
            FOREIGN KEY (buildingId) REFERENCES buildings(id),
            FOREIGN KEY (stairId) REFERENCES stairs(id),
            FOREIGN KEY (floorId) REFERENCES floors(id),
            FOREIGN KEY (roomId) REFERENCES rooms(id)
        )
    `);
    
    // 添加新字段（如果不存在）
    try {
        db.run(`ALTER TABLE residents ADD COLUMN idCard TEXT`);
    } catch (e) {}
    try {
        db.run(`ALTER TABLE residents ADD COLUMN status TEXT`);
    } catch (e) {}
    try {
        db.run(`ALTER TABLE residents ADD COLUMN renovationStatus TEXT`);
    } catch (e) {}
    try {
        db.run(`ALTER TABLE residents ADD COLUMN hasDebt INTEGER`);
    } catch (e) {}
    try {
        db.run(`ALTER TABLE residents ADD COLUMN debtAmount REAL`);
    } catch (e) {}
    try {
        db.run(`ALTER TABLE residents ADD COLUMN debtDescription TEXT`);
    } catch (e) {}
    try {
        db.run(`ALTER TABLE residents ADD COLUMN createdAt TEXT`);
    } catch (e) {}


    // 物业费数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS property_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 卫生费数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS sanitation_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 汽车停车费数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS car_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 摩托车停车费数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS motorcycle_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 其他费用数据表
    db.run(`
        CREATE TABLE IF NOT EXISTS other_fees (
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
    try {
        const usersResult = db.exec("SELECT COUNT(*) as count FROM users");
        if (usersResult && usersResult.length > 0 && usersResult[0].values && usersResult[0].values[0][0] === 0) {
            db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'aa888888', 'admin')");
            db.run("INSERT INTO adminList (username, password, role, createTime) VALUES ('admin', 'aa888888', '超级管理员', '2024-01-01')");
            db.run("INSERT INTO admin (username, password, role, createTime) VALUES ('admin', 'aa888888', '超级管理员', '2024-01-01')");
            db.run("INSERT INTO adminPassword (id, password) VALUES (1, 'aa888888')");
            console.log('默认用户数据初始化完成');
        }
    } catch (e) {
        console.error('检查用户表出错:', e);
    }

    // 检查楼栋表是否为空
    try {
        const buildingsResult = db.exec("SELECT COUNT(*) as count FROM buildings");
        if (buildingsResult && buildingsResult.length > 0 && buildingsResult[0].values && buildingsResult[0].values[0][0] === 0) {
            db.run("INSERT INTO buildings (number, floorCount) VALUES ('A栋', 18)");
            db.run("INSERT INTO buildings (number, floorCount) VALUES ('B栋', 24)");
            db.run("INSERT INTO buildings (number, floorCount) VALUES ('C栋', 30)");
            console.log('默认楼栋数据初始化完成');
        }
    } catch (e) {
        console.error('检查楼栋表出错:', e);
    }

    // 检查楼梯表是否为空
    try {
        const stairsResult = db.exec("SELECT COUNT(*) as count FROM stairs");
        if (stairsResult && stairsResult.length > 0 && stairsResult[0].values && stairsResult[0].values[0][0] === 0) {
            db.run("INSERT INTO stairs (buildingId, number) VALUES (1, '1号楼梯')");
            db.run("INSERT INTO stairs (buildingId, number) VALUES (2, '1号楼梯')");
            db.run("INSERT INTO stairs (buildingId, number) VALUES (3, '1号楼梯')");
            console.log('默认楼梯数据初始化完成');
        }
    } catch (e) {
        console.error('检查楼梯表出错:', e);
    }

    // 检查楼层表是否为空
    try {
        const floorsResult = db.exec("SELECT COUNT(*) as count FROM floors");
        if (floorsResult && floorsResult.length > 0 && floorsResult[0].values && floorsResult[0].values[0][0] === 0) {
            for (let i = 1; i <= 18; i++) {
                db.run(`INSERT INTO floors (stairId, floorNumber) VALUES (1, ${i})`);
            }
            for (let i = 1; i <= 24; i++) {
                db.run(`INSERT INTO floors (stairId, floorNumber) VALUES (2, ${i})`);
            }
            for (let i = 1; i <= 30; i++) {
                db.run(`INSERT INTO floors (stairId, floorNumber) VALUES (3, ${i})`);
            }
            console.log('默认楼层数据初始化完成');
        }
    } catch (e) {
        console.error('检查楼层表出错:', e);
    }

    // 检查房间表是否为空
    try {
        const roomsResult = db.exec("SELECT COUNT(*) as count FROM rooms");
        if (roomsResult && roomsResult.length > 0 && roomsResult[0].values && roomsResult[0].values[0][0] === 0) {
            db.run("INSERT INTO rooms (buildingId, stairId, floorNumber, roomNumber) VALUES (1, 1, 8, '801')");
            db.run("INSERT INTO rooms (buildingId, stairId, floorNumber, roomNumber) VALUES (1, 1, 8, '802')");
            db.run("INSERT INTO rooms (buildingId, stairId, floorNumber, roomNumber) VALUES (1, 1, 8, '803')");
            console.log('默认房间数据初始化完成');
        }
    } catch (e) {
        console.error('检查房间表出错:', e);
    }

    // 检查住户表是否为空
    try {
        const residentsResult = db.exec("SELECT COUNT(*) as count FROM residents");
        if (residentsResult && residentsResult.length > 0 && residentsResult[0].values && residentsResult[0].values[0][0] === 0) {
            db.run("INSERT INTO residents (name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt) VALUES ('林伟升', '13800138000', 1, 1, 8, 1, 120.5, 8, '801', '2024-01-01')");
            db.run("INSERT INTO residents (name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt) VALUES ('张三', '13800138001', 1, 1, 8, 2, 100.0, 8, '802', '2024-01-02')");
            db.run("INSERT INTO residents (name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt) VALUES ('李四', '13800138002', 1, 1, 8, 3, 90.0, 8, '803', '2024-01-03')");
            console.log('默认住户数据初始化完成');
        }
    } catch (e) {
        console.error('检查住户表出错:', e);
    }

    // 检查物业费表是否为空
    try {
        const propertyFeesResult = db.exec("SELECT COUNT(*) as count FROM property_fees");
        if (propertyFeesResult && propertyFeesResult.length > 0 && propertyFeesResult[0].values && propertyFeesResult[0].values[0][0] === 0) {
            db.run("INSERT INTO property_fees (description, amount) VALUES ('1至3层', 1)");
            db.run("INSERT INTO property_fees (description, amount) VALUES ('4至6层', 1.5)");
            db.run("INSERT INTO property_fees (description, amount) VALUES ('7层及以上', 2)");
            console.log('默认物业费数据初始化完成');
        }
    } catch (e) {
        console.error('检查物业费表出错:', e);
    }

    // 检查卫生费表是否为空
    try {
        const sanitationFeesResult = db.exec("SELECT COUNT(*) as count FROM sanitation_fees");
        if (sanitationFeesResult && sanitationFeesResult.length > 0 && sanitationFeesResult[0].values && sanitationFeesResult[0].values[0][0] === 0) {
            db.run("INSERT INTO sanitation_fees (description, amount) VALUES ('生活垃圾费', 30)");
            db.run("INSERT INTO sanitation_fees (description, amount) VALUES ('公共区域清洁费', 20)");
            db.run("INSERT INTO sanitation_fees (description, amount) VALUES ('化粪池清理费', 50)");
            console.log('默认卫生费数据初始化完成');
        }
    } catch (e) {
        console.error('检查卫生费表出错:', e);
    }

    // 检查汽车停车费表是否为空
    try {
        const carFeesResult = db.exec("SELECT COUNT(*) as count FROM car_fees");
        if (carFeesResult && carFeesResult.length > 0 && carFeesResult[0].values && carFeesResult[0].values[0][0] === 0) {
            db.run("INSERT INTO car_fees (description, amount) VALUES ('年费', 2500)");
            db.run("INSERT INTO car_fees (description, amount) VALUES ('月费', 250)");
            db.run("INSERT INTO car_fees (description, amount) VALUES ('临时', 5)");
            console.log('默认汽车停车费数据初始化完成');
        }
    } catch (e) {
        console.error('检查汽车停车费表出错:', e);
    }

    // 检查摩托车停车费表是否为空
    try {
        const motorcycleFeesResult = db.exec("SELECT COUNT(*) as count FROM motorcycle_fees");
        if (motorcycleFeesResult && motorcycleFeesResult.length > 0 && motorcycleFeesResult[0].values && motorcycleFeesResult[0].values[0][0] === 0) {
            db.run("INSERT INTO motorcycle_fees (description, amount) VALUES ('年费', 500)");
            db.run("INSERT INTO motorcycle_fees (description, amount) VALUES ('月费', 50)");
            db.run("INSERT INTO motorcycle_fees (description, amount) VALUES ('临时', 2)");
            console.log('默认摩托车停车费数据初始化完成');
        }
    } catch (e) {
        console.error('检查摩托车停车费表出错:', e);
    }

    // 检查其他费用表是否为空
    try {
        const otherFeesResult = db.exec("SELECT COUNT(*) as count FROM other_fees");
        if (otherFeesResult && otherFeesResult.length > 0 && otherFeesResult[0].values && otherFeesResult[0].values[0][0] === 0) {
            db.run("INSERT INTO other_fees (description, amount) VALUES ('垃圾处理费', 50)");
            db.run("INSERT INTO other_fees (description, amount) VALUES ('公共设施维修费', 100)");
            db.run("INSERT INTO other_fees (description, amount) VALUES ('广告费', 200)");
            console.log('默认其他费用数据初始化完成');
        }
    } catch (e) {
        console.error('检查其他费用表出错:', e);
    }

    // 检查缴费分类表是否为空
    try {
        const feeCategoriesResult = db.exec("SELECT COUNT(*) as count FROM feeCategories");
        if (feeCategoriesResult && feeCategoriesResult.length > 0 && feeCategoriesResult[0].values && feeCategoriesResult[0].values[0][0] === 0) {
            const propertySubItems = JSON.stringify([
                { id: 101, name: '基础物业费', value: 'basic' },
                { id: 102, name: '电梯费', value: 'elevator' },
                { id: 103, name: '公共照明费', value: 'lighting' }
            ]);
            const sanitationSubItems = JSON.stringify([
                { id: 201, name: '生活垃圾费', value: 'trash' },
                { id: 202, name: '公共区域清洁费', value: 'cleaning' }
            ]);
            const carSubItems = JSON.stringify([
                { id: 301, name: '室内车位', value: 'indoor' },
                { id: 302, name: '室外车位', value: 'outdoor' }
            ]);
            const motorcycleSubItems = JSON.stringify([
                { id: 401, name: '摩托车位', value: 'motorcycle' }
            ]);
            const waterSubItems = JSON.stringify([
                { id: 501, name: '居民用水', value: 'residential' },
                { id: 502, name: '商业用水', value: 'commercial' }
            ]);
            const otherSubItems = JSON.stringify([
                { id: 701, name: '垃圾处理费', value: 'garbage' },
                { id: 702, name: '卫生费', value: 'sanitation' }
            ]);
            db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('物业费', 'property', ?)", [propertySubItems]);
            db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('卫生费', 'sanitation', ?)", [sanitationSubItems]);
            db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('汽车停车费', 'car', ?)", [carSubItems]);
            db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('摩托停车费', 'motorcycle', ?)", [motorcycleSubItems]);
            db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('水费', 'water', ?)", [waterSubItems]);
            db.run("INSERT INTO feeCategories (name, value, subItems) VALUES ('其他收入', 'other', ?)", [otherSubItems]);
            console.log('默认缴费分类数据初始化完成');
        }
    } catch (e) {
        console.error('检查缴费分类表出错:', e);
    }
}

// 保存数据库到 localStorage
function saveDatabase() {
    if (db) {
        try {
            const data = db.export();
            const arr = Array.from(data);
            const jsonData = JSON.stringify(arr);
            console.log('准备保存数据库，大小:', jsonData.length, '字节');
            localStorage.setItem('sqliteDB', jsonData);
            console.log('数据库保存成功，大小:', jsonData.length, '字节');
            // 验证保存是否成功
            const savedData = localStorage.getItem('sqliteDB');
            console.log('验证保存结果:', savedData ? '成功' : '失败');
            if (savedData) {
                console.log('保存的数据库大小:', savedData.length, '字节');
            }
        } catch (err) {
            console.error('数据库保存失败:', err);
        }
    } else {
        console.error('数据库未初始化，无法保存');
    }
}

// 执行 SQL 查询 (SELECT)
function query(sql, params = []) {
    try {
        if (params.length > 0) {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();
            return rows;
        } else {
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
        }
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

// 从 localStorage 迁移数据到 SQLite
async function migrateFromLocalStorage() {
    // 检查是否已经迁移过
    if (localStorage.getItem('dataMigrated')) {
        console.log('数据已经迁移过，跳过迁移步骤');
        return;
    }

    console.log('开始迁移 localStorage 数据到 SQLite...');

    try {
        // 迁移住户数据
        const residents = JSON.parse(localStorage.getItem('residents') || '[]');
        if (residents.length > 0) {
            // 清空现有数据
            db.run("DELETE FROM residents");
            residents.forEach(r => {
                db.run("INSERT INTO residents (id, name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [r.id, r.name, r.phone, r.buildingId, r.stairId, r.floorId, r.roomId, r.area, r.floorNumber, r.roomNumber, r.createdAt]);
            });
            console.log(`迁移了 ${residents.length} 条住户数据`);
        }

        // 迁移缴费记录
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        if (payments.length > 0) {
            db.run("DELETE FROM payments");
            payments.forEach(p => {
                db.run("INSERT INTO payments (id, residentId, residentName, feeType, feeTypeName, feeMode, feeSubType, feeUnitPrice, feeQuantity, feeUnit, amount, year, date, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [p.id, p.residentId, p.residentName, p.feeType, p.feeTypeName, p.feeMode, p.feeSubType, p.feeUnitPrice, p.feeQuantity, p.feeUnit, p.amount, p.year, p.date, p.status, p.createdAt]);
            });
            console.log(`迁移了 ${payments.length} 条缴费记录`);
        }

        // 迁移物业费数据
        const propertyFees = JSON.parse(localStorage.getItem('propertyFees') || '[]');
        if (propertyFees.length > 0) {
            db.run("DELETE FROM property_fees");
            propertyFees.forEach(f => {
                db.run("INSERT INTO property_fees (id, description, amount) VALUES (?, ?, ?)", [f.id, f.description, f.amount]);
            });
            console.log(`迁移了 ${propertyFees.length} 条物业费数据`);
        }

        // 迁移卫生费数据
        const sanitationFees = JSON.parse(localStorage.getItem('sanitationFees') || '[]');
        if (sanitationFees.length > 0) {
            db.run("DELETE FROM sanitation_fees");
            sanitationFees.forEach(f => {
                db.run("INSERT INTO sanitation_fees (id, description, amount) VALUES (?, ?, ?)", [f.id, f.description, f.amount]);
            });
            console.log(`迁移了 ${sanitationFees.length} 条卫生费数据`);
        }

        // 迁移汽车停车费数据
        const carFees = JSON.parse(localStorage.getItem('carFees') || '[]');
        if (carFees.length > 0) {
            db.run("DELETE FROM car_fees");
            carFees.forEach(f => {
                db.run("INSERT INTO car_fees (id, description, amount) VALUES (?, ?, ?)", [f.id, f.description, f.amount]);
            });
            console.log(`迁移了 ${carFees.length} 条汽车停车费数据`);
        }

        // 迁移摩托车停车费数据
        const motorcycleFees = JSON.parse(localStorage.getItem('motorcycleFees') || '[]');
        if (motorcycleFees.length > 0) {
            db.run("DELETE FROM motorcycle_fees");
            motorcycleFees.forEach(f => {
                db.run("INSERT INTO motorcycle_fees (id, description, amount) VALUES (?, ?, ?)", [f.id, f.description, f.amount]);
            });
            console.log(`迁移了 ${motorcycleFees.length} 条摩托车停车费数据`);
        }

        // 迁移其他费用数据
        const otherFees = JSON.parse(localStorage.getItem('otherFees') || '[]');
        if (otherFees.length > 0) {
            db.run("DELETE FROM other_fees");
            otherFees.forEach(f => {
                db.run("INSERT INTO other_fees (id, description, amount) VALUES (?, ?, ?)", [f.id, f.description, f.amount]);
            });
            console.log(`迁移了 ${otherFees.length} 条其他费用数据`);
        }

        saveDatabase();
        localStorage.setItem('dataMigrated', 'true');
        console.log('数据迁移完成！');
    } catch (err) {
        console.error('迁移失败:', err);
    }
}

// 清空所有数据并重新初始化
function resetDatabase() {
    db.run("DELETE FROM payments");
    db.run("DELETE FROM residents");
    db.run("DELETE FROM rooms");
    db.run("DELETE FROM floors");
    db.run("DELETE FROM stairs");
    db.run("DELETE FROM buildings");
    db.run("DELETE FROM property_fees");
    db.run("DELETE FROM sanitation_fees");
    db.run("DELETE FROM car_fees");
    db.run("DELETE FROM motorcycle_fees");
    db.run("DELETE FROM other_fees");
    db.run("DELETE FROM feeCategories");
    db.run("DELETE FROM users");
    db.run("DELETE FROM adminList");
    db.run("DELETE FROM admin");
    db.run("DELETE FROM adminPassword");
    saveDatabase();
    createTables();
    console.log('数据库已重置');
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

// 检查数据库是否就绪
function isDatabaseReady() {
    return isDBReady;
}

// 获取数据库实例
function getDatabase() {
    return db;
}

// 等待数据库就绪
async function waitForDatabase() {
    if (isDBReady) return db;
    return initSQLiteDB();
}

// 重置数据库（用于测试）
function resetDatabase() {
    localStorage.removeItem('sqliteDB');
    location.reload();
}