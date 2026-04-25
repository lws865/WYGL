const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..')));

const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'property_management.db');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ data目录创建成功');
}

let db = null;

async function initDB() {
    const initSqlJs = require('sql.js').default;
    const SQL = await initSqlJs();

    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // 创建用户表
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    `);

    // 创建楼房表
    db.run(`
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT UNIQUE NOT NULL,
            floorCount INTEGER NOT NULL
        )
    `);

    // 创建梯号表
    db.run(`
        CREATE TABLE IF NOT EXISTS stairs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            buildingId INTEGER NOT NULL,
            number TEXT NOT NULL,
            FOREIGN KEY (buildingId) REFERENCES buildings(id)
        )
    `);

    // 创建层号表
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

    // 创建房号表
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

    // 创建住户表
    db.run(`
        CREATE TABLE IF NOT EXISTS residents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            buildingId INTEGER NOT NULL,
            stairId INTEGER NOT NULL,
            floorId INTEGER NOT NULL,
            roomId INTEGER NOT NULL,
            area REAL NOT NULL,
            floorNumber INTEGER NOT NULL,
            roomNumber TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            renovationStatus TEXT DEFAULT 'no',
            hasDebt INTEGER DEFAULT 0,
            debtAmount REAL DEFAULT 0,
            debtDescription TEXT DEFAULT '',
            createdAt TEXT NOT NULL,
            FOREIGN KEY (buildingId) REFERENCES buildings(id),
            FOREIGN KEY (stairId) REFERENCES stairs(id),
            FOREIGN KEY (floorId) REFERENCES floors(id),
            FOREIGN KEY (roomId) REFERENCES rooms(id)
        )
    `);

    // 创建费用分类表
    db.run(`
        CREATE TABLE IF NOT EXISTS feeCategories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `);

    // 创建物业费年份表
    db.run(`
        CREATE TABLE IF NOT EXISTS property_years (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year TEXT NOT NULL UNIQUE,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 初始化当前年份到物业费年份表
    try {
        const currentYear = new Date().getFullYear().toString();
        const existingYear = db.exec("SELECT * FROM property_years WHERE year = '" + currentYear + "'");
        if (!existingYear || existingYear.length === 0) {
            db.run("INSERT INTO property_years (year) VALUES (?)", [currentYear]);
        }
    } catch (e) {
        console.log('初始化年份数据失败:', e.message);
    }

    // 创建物业楼层基础费表
    db.run(`
        CREATE TABLE IF NOT EXISTS property_building_base_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 检查并添加year字段（如果不存在）
    try {
        const yearCheck = db.exec("SELECT year FROM property_building_base_fees LIMIT 1");
    } catch (e) {
        db.run("ALTER TABLE property_building_base_fees ADD COLUMN year TEXT");
    }

    // 创建卫生费表
    db.run(`
        CREATE TABLE IF NOT EXISTS sanitation_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 创建停车费表
    db.run(`
        CREATE TABLE IF NOT EXISTS car_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 创建摩托车费表
    db.run(`
        CREATE TABLE IF NOT EXISTS motorcycle_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 创建物业管理费项目表
    db.run(`
        CREATE TABLE IF NOT EXISTS property_Mag (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 创建物业管理费项目数据表（只有ID和描述，无金额）
    db.run(`
        CREATE TABLE IF NOT EXISTS property_management_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL
        )
    `);

    // 创建电梯管理费项目数据表（有ID、描述和金额）
    db.run(`
        CREATE TABLE IF NOT EXISTS elevator_management_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 创建其他费用表
    db.run(`
        CREATE TABLE IF NOT EXISTS other_fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // 创建管理员密码表
    db.run(`
        CREATE TABLE IF NOT EXISTS adminPassword (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            password TEXT NOT NULL
        )
    `);

    // 检查默认用户
    const checkUser = db.prepare("SELECT * FROM users WHERE username = ?");
    checkUser.bind(['admin']);
    if (!checkUser.step()) {
        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            ['admin', 'aa888888', 'admin']);
        console.log('✅ 默认用户创建成功');
    }
    checkUser.free();

    // 检查默认管理员密码
    const checkAdminPassword = db.prepare("SELECT * FROM adminPassword WHERE id = 1");
    checkAdminPassword.bind([]);
    if (!checkAdminPassword.step()) {
        db.run("INSERT INTO adminPassword (password) VALUES (?)", ['aa888888']);
        console.log('✅ 默认管理员密码创建成功');
    }
    checkAdminPassword.free();

    console.log('✅ 数据库连接成功');
}

function saveDB() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

app.use((req, res, next) => {
    if (!db) {
        return res.status(500).json({ success: false, message: '数据库未初始化' });
    }
    next();
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const stmt = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?");
    stmt.bind([username, password]);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        saveDB();
        res.json({ success: true, user: row });
    } else {
        res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    stmt.free();
});

app.get('/api/buildings', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM buildings ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const buildings = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: buildings });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/buildings', (req, res) => {
    const { number, floorCount } = req.body;
    db.run("INSERT INTO buildings (number, floorCount) VALUES (?, ?)", [number, floorCount]);
    saveDB();
    res.json({ success: true });
});

app.put('/api/buildings/:id', (req, res) => {
    const { id } = req.params;
    const { number, floorCount } = req.body;
    db.run("UPDATE buildings SET number = ?, floorCount = ? WHERE id = ?", [number, floorCount, id]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/buildings/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM buildings WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/fee-categories', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM feeCategories ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const categories = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: categories });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/property-fees', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM property_building_base_fees ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const fees = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: fees });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/property-fees', (req, res) => {
    const { description, amount } = req.body;
    db.run("INSERT INTO property_building_base_fees (description, amount) VALUES (?, ?)", [description, amount]);
    saveDB();
    res.json({ success: true });
});

app.put('/api/property-fees/:id', (req, res) => {
    const { id } = req.params;
    const { description, amount } = req.body;
    db.run("UPDATE property_building_base_fees SET description = ?, amount = ? WHERE id = ?", [description, amount, id]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/property-fees-years', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM property_years ORDER BY year DESC");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const years = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: years });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        if (err.message.includes('no such table')) {
            db.run(`
                CREATE TABLE IF NOT EXISTS property_years (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    year TEXT NOT NULL UNIQUE,
                    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run("INSERT INTO property_years (year) VALUES (?)", [new Date().getFullYear().toString()]);
            saveDB();
            res.json({ success: true, data: [{ id: 1, year: new Date().getFullYear().toString() }] });
        } else {
            res.status(500).json({ success: false, message: err.message });
        }
    }
});

app.post('/api/property-fees-years', (req, res) => {
    const { year } = req.body;
    try {
        db.run(`
            CREATE TABLE IF NOT EXISTS property_years (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year TEXT NOT NULL UNIQUE,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run("INSERT INTO property_years (year) VALUES (?)", [year]);
        saveDB();
        res.json({ success: true, message: '年份添加成功' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            res.status(400).json({ success: false, message: '该年份已存在' });
        } else {
            res.status(500).json({ success: false, message: err.message });
        }
    }
});

app.delete('/api/property-fees-years/:year', (req, res) => {
    const { year } = req.params;
    try {
        db.run("DELETE FROM property_years WHERE year = ?", [year]);
        saveDB();
        res.json({ success: true, message: '年份删除成功' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/property-fees/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM property_building_base_fees WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/sanitation-fees', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM sanitation_fees ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const fees = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: fees });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/sanitation-fees', (req, res) => {
    const { description, amount } = req.body;
    db.run("INSERT INTO sanitation_fees (description, amount) VALUES (?, ?)", [description, amount]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/sanitation-fees/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM sanitation_fees WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/car-fees', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM car_fees ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const fees = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: fees });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/car-fees', (req, res) => {
    const { description, amount } = req.body;
    db.run("INSERT INTO car_fees (description, amount) VALUES (?, ?)", [description, amount]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/car-fees/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM car_fees WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/motorcycle-fees', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM motorcycle_fees ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const fees = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: fees });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/motorcycle-fees', (req, res) => {
    const { description, amount } = req.body;
    db.run("INSERT INTO motorcycle_fees (description, amount) VALUES (?, ?)", [description, amount]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/motorcycle-fees/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM motorcycle_fees WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/other-fees', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM other_fees ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const fees = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: fees });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/other-fees', (req, res) => {
    const { description, amount } = req.body;
    db.run("INSERT INTO other_fees (description, amount) VALUES (?, ?)", [description, amount]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/other-fees/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM other_fees WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

// 物业管理费项目增删改查 API
app.get('/api/property-management-items', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM property_management_items ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const items = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: items });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/property-management-items', (req, res) => {
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ success: false, message: '描述不能为空' });
    }
    db.run("INSERT INTO property_management_items (description) VALUES (?)", [description]);
    saveDB();
    res.json({ success: true, message: '添加成功' });
});

app.put('/api/property-management-items/:id', (req, res) => {
    const { id } = req.params;
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ success: false, message: '描述不能为空' });
    }
    db.run("UPDATE property_management_items SET description = ? WHERE id = ?", [description, id]);
    saveDB();
    res.json({ success: true, message: '更新成功' });
});

app.delete('/api/property-management-items/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM property_management_items WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true, message: '删除成功' });
});

// 电梯管理费项目增删改查 API
app.get('/api/elevator-management-items', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM elevator_management_items ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const items = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: items });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/elevator-management-items', (req, res) => {
    const { description, amount } = req.body;
    if (!description || amount === undefined || amount === null || amount === '') {
        return res.status(400).json({ success: false, message: '描述和金额不能为空' });
    }
    db.run("INSERT INTO elevator_management_items (description, amount) VALUES (?, ?)", [description, parseFloat(amount)]);
    saveDB();
    res.json({ success: true, message: '添加成功' });
});

app.put('/api/elevator-management-items/:id', (req, res) => {
    const { id } = req.params;
    const { description, amount } = req.body;
    if (!description || amount === undefined || amount === null || amount === '') {
        return res.status(400).json({ success: false, message: '描述和金额不能为空' });
    }
    db.run("UPDATE elevator_management_items SET description = ?, amount = ? WHERE id = ?", [description, parseFloat(amount), id]);
    saveDB();
    res.json({ success: true, message: '更新成功' });
});

app.delete('/api/elevator-management-items/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM elevator_management_items WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true, message: '删除成功' });
});

app.get('/api/residents', (req, res) => {
    try {
        const results = db.exec(`
            SELECT 
                r.*,
                b.number as buildingNumber,
                s.number as stairNumber,
                f.floorNumber,
                rm.roomNumber
            FROM residents r
            LEFT JOIN buildings b ON r.buildingId = b.id
            LEFT JOIN stairs s ON r.stairId = s.id
            LEFT JOIN floors f ON r.floorId = f.id
            LEFT JOIN rooms rm ON r.roomId = rm.id
            ORDER BY r.id
        `);
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const residents = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: residents });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/residents/:id', (req, res) => {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
        res.status(400).json({ success: false, message: '无效的住户ID' });
        return;
    }
    db.run("DELETE FROM residents WHERE id = ?", [numericId]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/payments', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM payments ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const payments = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: payments });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/payments', (req, res) => {
    const { residentId, feeType, feeId, amount, paymentDate, status } = req.body;
    db.run("INSERT INTO payments (residentId, feeType, feeId, amount, paymentDate, status) VALUES (?, ?, ?, ?, ?, ?)",
        [residentId, feeType, feeId, amount, paymentDate, status]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/admin/password', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM adminPassword WHERE id = 1");
        if (results.length > 0 && results[0].values.length > 0) {
            res.json({ success: true, password: results[0].values[0][1] });
        } else {
            res.status(404).json({ success: false, message: '未找到密码' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/password', (req, res) => {
    const { password } = req.body;
    db.run("UPDATE adminPassword SET password = ? WHERE id = 1", [password]);
    saveDB();
    res.json({ success: true });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: '服务器运行正常' });
});

// ==================== 梯号相关API ====================

app.get('/api/stairs', (req, res) => {
    try {
        const { buildingId } = req.query;
        let sql = "SELECT * FROM stairs";
        if (buildingId) {
            sql += ` WHERE buildingId = ${buildingId}`;
        }
        sql += " ORDER BY id";
        
        const results = db.exec(sql);
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const stairs = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: stairs });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/stairs', (req, res) => {
    const { buildingId, number } = req.body;
    
    // 检查是否已存在相同的楼号+梯号组合
    const existingResult = db.exec(`SELECT id FROM stairs WHERE buildingId = ${buildingId} AND number = '${number}'`);
    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
        res.status(400).json({ success: false, message: '该楼号下已存在相同的梯号，不能重复添加' });
        return;
    }
    
    db.run("INSERT INTO stairs (buildingId, number) VALUES (?, ?)", [buildingId, number]);
    saveDB();
    res.json({ success: true });
});

app.put('/api/stairs/:id', (req, res) => {
    const { id } = req.params;
    const { buildingId, number } = req.body;
    db.run("UPDATE stairs SET buildingId = ?, number = ? WHERE id = ?", [buildingId, number, id]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/stairs/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM stairs WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

// ==================== 层号相关API ====================

app.get('/api/floors', (req, res) => {
    try {
        const { stairId } = req.query;
        let sql = "SELECT * FROM floors";
        if (stairId) {
            sql += ` WHERE stairId = ${stairId}`;
        }
        sql += " ORDER BY floorNumber";
        
        const results = db.exec(sql);
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const floors = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: floors });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/floors', (req, res) => {
    const { buildingId, stairId, floorNumber } = req.body;
    db.run("INSERT INTO floors (buildingId, stairId, floorNumber) VALUES (?, ?, ?)", [buildingId, stairId, floorNumber]);
    saveDB();
    res.json({ success: true });
});

app.put('/api/floors/:id', (req, res) => {
    const { id } = req.params;
    const { buildingId, stairId, floorNumber } = req.body;
    db.run("UPDATE floors SET buildingId = ?, stairId = ?, floorNumber = ? WHERE id = ?", [buildingId, stairId, floorNumber, id]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/floors/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM floors WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

// ==================== 房号相关API ====================

app.get('/api/rooms', (req, res) => {
    try {
        const { floorId, stairId } = req.query;
        let sql = "SELECT * FROM rooms";
        let conditions = [];
        
        if (stairId) {
            conditions.push(`stairId = ${stairId}`);
        }
        if (floorId) {
            // 先根据floorId查询对应的floorNumber和stairId
            const floorResult = db.exec(`SELECT floorNumber, stairId FROM floors WHERE id = ${floorId}`);
            if (floorResult.length > 0 && floorResult[0].values.length > 0) {
                const floorNumber = floorResult[0].values[0][0];
                const floorStairId = floorResult[0].values[0][1];
                conditions.push(`floorNumber = ${floorNumber}`);
                // 如果没有指定stairId，使用floor查询出来的stairId
                if (!stairId) {
                    conditions.push(`stairId = ${floorStairId}`);
                }
            }
        }
        
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        sql += " ORDER BY floorNumber, roomNumber";
        
        const results = db.exec(sql);
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const rooms = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: rooms });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/rooms', (req, res) => {
    const { buildingId, stairId, floorNumber, roomNumber } = req.body;
    db.run("INSERT INTO rooms (buildingId, stairId, floorNumber, roomNumber) VALUES (?, ?, ?, ?)", [buildingId, stairId, floorNumber, roomNumber]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/rooms/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM rooms WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

app.put('/api/rooms/:id', (req, res) => {
    const { id } = req.params;
    const { buildingId, stairId, floorNumber, roomNumber } = req.body;
    
    db.run(
        "UPDATE rooms SET buildingId = ?, stairId = ?, floorNumber = ?, roomNumber = ? WHERE id = ?",
        [buildingId, stairId, floorNumber, roomNumber, id]
    );
    saveDB();
    res.json({ success: true });
});

app.delete('/api/rooms/batch/:stairId/:floorNumber', (req, res) => {
    const { stairId, floorNumber } = req.params;
    db.run("DELETE FROM rooms WHERE stairId = ? AND floorNumber = ?", [stairId, floorNumber]);
    saveDB();
    res.json({ success: true });
});

// ==================== 费用相关API ====================

app.get('/api/fees/:type', (req, res) => {
    try {
        const { type } = req.params;
        let tableName = '';
        
        switch (type) {
            case 'property':
                tableName = 'property_building_base_fees';
                break;
            case 'sanitation':
                tableName = 'sanitation_fees';
                break;
            case 'car':
                tableName = 'car_fees';
                break;
            case 'motorcycle':
                tableName = 'motorcycle_fees';
                break;
            case 'property_management':
                tableName = 'property_Mag';
                break;
            case 'other':
                tableName = 'other_fees';
                break;
            default:
                return res.status(400).json({ success: false, message: '无效的费用类型' });
        }
        
        const results = db.exec(`SELECT * FROM ${tableName} ORDER BY id`);
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const fees = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: fees });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/fees/:type', (req, res) => {
    try {
        const { type } = req.params;
        const { description, amount } = req.body;
        let tableName = '';
        
        switch (type) {
            case 'property':
                tableName = 'property_building_base_fees';
                break;
            case 'sanitation':
                tableName = 'sanitation_fees';
                break;
            case 'car':
                tableName = 'car_fees';
                break;
            case 'motorcycle':
                tableName = 'motorcycle_fees';
                break;
            case 'property_management':
                tableName = 'property_Mag';
                break;
            case 'other':
                tableName = 'other_fees';
                break;
            default:
                return res.status(400).json({ success: false, message: '无效的费用类型' });
        }

        db.run(`INSERT INTO ${tableName} (description, amount) VALUES (?, ?)`, [description, amount]);
        saveDB();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/fees/:type/:id', (req, res) => {
    try {
        const { type, id } = req.params;
        const { description, amount } = req.body;
        let tableName = '';
        
        switch (type) {
            case 'property':
                tableName = 'property_building_base_fees';
                break;
            case 'sanitation':
                tableName = 'sanitation_fees';
                break;
            case 'car':
                tableName = 'car_fees';
                break;
            case 'motorcycle':
                tableName = 'motorcycle_fees';
                break;
            case 'property_management':
                tableName = 'property_Mag';
                break;
            case 'other':
                tableName = 'other_fees';
                break;
            default:
                return res.status(400).json({ success: false, message: '无效的费用类型' });
        }

        db.run(`UPDATE ${tableName} SET description = ?, amount = ? WHERE id = ?`, [description, amount, id]);
        saveDB();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/fees/:type/:id', (req, res) => {
    try {
        const { type, id } = req.params;
        let tableName = '';
        
        switch (type) {
            case 'property':
                tableName = 'property_building_base_fees';
                break;
            case 'sanitation':
                tableName = 'sanitation_fees';
                break;
            case 'car':
                tableName = 'car_fees';
                break;
            case 'motorcycle':
                tableName = 'motorcycle_fees';
                break;
            case 'property_management':
                tableName = 'property_Mag';
                break;
            case 'other':
                tableName = 'other_fees';
                break;
            default:
                return res.status(400).json({ success: false, message: '无效的费用类型' });
        }

        db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        saveDB();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== 管理员相关API ====================

app.get('/api/admins', (req, res) => {
    try {
        const results = db.exec("SELECT * FROM users ORDER BY id");
        if (results.length > 0) {
            const columns = results[0].columns;
            const values = results[0].values;
            const admins = values.map(row => {
                const obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                return obj;
            });
            res.json({ success: true, data: admins });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admins', (req, res) => {
    const { username, password, role } = req.body;
    db.run("INSERT INTO users (username, password, role, createTime) VALUES (?, ?, ?, ?)", 
        [username, password, role, new Date().toISOString()]);
    saveDB();
    res.json({ success: true });
});

app.put('/api/admins/:id', (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    db.run("UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?", 
        [username, password, role, id]);
    saveDB();
    res.json({ success: true });
});

app.delete('/api/admins/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM users WHERE id = ?", [id]);
    saveDB();
    res.json({ success: true });
});

// ==================== 住户相关API（更新）====================

app.post('/api/residents', (req, res) => {
    const { name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, status, renovationStatus, hasDebt, debtAmount, debtDescription, createdAt } = req.body;

    // 检查该房号是否已有住户
    const existingResult = db.exec(`SELECT id FROM residents WHERE roomId = ${roomId}`);
    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
        res.status(400).json({ success: false, message: '此房号已有住户，不能重复添加' });
        return;
    }

    db.run("INSERT INTO residents (name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, status, renovationStatus, hasDebt, debtAmount, debtDescription, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, status, renovationStatus, hasDebt, debtAmount, debtDescription, createdAt]);
    saveDB();
    res.json({ success: true });
});

app.put('/api/residents/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, status, renovationStatus, hasDebt, debtAmount, debtDescription } = req.body;
    db.run("UPDATE residents SET name = ?, phone = ?, buildingId = ?, stairId = ?, floorId = ?, roomId = ?, area = ?, floorNumber = ?, roomNumber = ?, status = ?, renovationStatus = ?, hasDebt = ?, debtAmount = ?, debtDescription = ? WHERE id = ?", 
        [name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, status, renovationStatus, hasDebt, debtAmount, debtDescription, id]);
    saveDB();
    res.json({ success: true });
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 服务器已启动`);
        console.log(`📡 访问地址: http://localhost:${PORT}`);
        console.log(`🎯 API文档: http://localhost:${PORT}/api/health`);
    });
}).catch(err => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
});
