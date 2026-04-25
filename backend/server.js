const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const fs = require('fs');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '..')));

// 数据库文件路径
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'property_management.db');
console.log('数据库文件路径:', dbPath);

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ data目录创建成功');
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('✅ 数据库连接成功');
        initDatabase();
    }
});

// 初始化数据库表
function initDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )`, (err) => {
            if (err) console.error('创建users表失败:', err.message);
            else console.log('✅ users表创建成功');
        });

        db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
            ['admin', 'aa888888', 'admin'], (err) => {
            if (err) console.error('创建默认用户失败:', err.message);
            else console.log('✅ 默认用户创建成功');
        });
    });
}

// ==================== 用户相关接口 ====================

// 用户登录
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.get(sql, [username, password], (err, row) => {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
        } else if (row) {
            res.json({ success: true, user: row });
        } else {
            res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
    });
});

// ==================== 楼栋相关接口 ====================

// 获取所有楼栋
app.get('/api/buildings', (req, res) => {
    const sql = "SELECT * FROM buildings ORDER BY id";
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, data: rows });
    });
});

// 添加楼栋
app.post('/api/buildings', (req, res) => {
    const { number, floorCount } = req.body;
    const sql = "INSERT INTO buildings (number, floorCount) VALUES (?, ?)";
    db.run(sql, [number, floorCount], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, id: this.lastID });
    });
});

// 更新楼栋
app.put('/api/buildings/:id', (req, res) => {
    const { id } = req.params;
    const { number, floorCount } = req.body;
    const sql = "UPDATE buildings SET number = ?, floorCount = ? WHERE id = ?";
    db.run(sql, [number, floorCount, id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// 删除楼栋
app.delete('/api/buildings/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM buildings WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// ==================== 梯号相关接口 ====================

// 获取所有梯号
app.get('/api/stairs', (req, res) => {
    const { buildingId } = req.query;
    let sql = "SELECT * FROM stairs ORDER BY id";
    let params = [];
    
    if (buildingId) {
        sql = "SELECT * FROM stairs WHERE buildingId = ? ORDER BY id";
        params = [buildingId];
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, data: rows });
    });
});

// 添加梯号
app.post('/api/stairs', (req, res) => {
    const { buildingId, number } = req.body;
    const sql = "INSERT INTO stairs (buildingId, number) VALUES (?, ?)";
    db.run(sql, [buildingId, number], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, id: this.lastID });
    });
});

// 更新梯号
app.put('/api/stairs/:id', (req, res) => {
    const { id } = req.params;
    const { buildingId, number } = req.body;
    const sql = "UPDATE stairs SET buildingId = ?, number = ? WHERE id = ?";
    db.run(sql, [buildingId, number, id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// 删除梯号
app.delete('/api/stairs/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM stairs WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// ==================== 层号相关接口 ====================

// 获取所有层号
app.get('/api/floors', (req, res) => {
    const { stairId } = req.query;
    let sql = "SELECT * FROM floors ORDER BY id";
    let params = [];
    
    if (stairId) {
        sql = "SELECT * FROM floors WHERE stairId = ? ORDER BY id";
        params = [stairId];
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, data: rows });
    });
});

// 添加层号
app.post('/api/floors', (req, res) => {
    const { buildingId, stairId, floorNumber } = req.body;
    const sql = "INSERT INTO floors (buildingId, stairId, floorNumber) VALUES (?, ?, ?)";
    db.run(sql, [buildingId, stairId, floorNumber], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, id: this.lastID });
    });
});

// 删除层号
app.delete('/api/floors/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM floors WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// ==================== 房号相关接口 ====================

// 获取所有房号
app.get('/api/rooms', (req, res) => {
    const { floorId } = req.query;
    let sql = "SELECT * FROM rooms ORDER BY id";
    let params = [];
    
    if (floorId) {
        // 需要先获取楼层信息来筛选
        db.get("SELECT * FROM floors WHERE id = ?", [floorId], (err, floor) => {
            if (err) {
                res.status(500).json({ success: false, message: err.message });
            } else if (floor) {
                db.all("SELECT * FROM rooms WHERE floorNumber = ? ORDER BY id", 
                    [floor.floorNumber], (err, rows) => {
                    if (err) res.status(500).json({ success: false, message: err.message });
                    else res.json({ success: true, data: rows });
                });
            } else {
                res.json({ success: true, data: [] });
            }
        });
    } else {
        db.all(sql, params, (err, rows) => {
            if (err) res.status(500).json({ success: false, message: err.message });
            else res.json({ success: true, data: rows });
        });
    }
});

// 添加房号
app.post('/api/rooms', (req, res) => {
    const { buildingId, stairId, floorNumber, roomNumber } = req.body;
    const sql = "INSERT INTO rooms (buildingId, stairId, floorNumber, roomNumber) VALUES (?, ?, ?, ?)";
    db.run(sql, [buildingId, stairId, floorNumber, roomNumber], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, id: this.lastID });
    });
});

// 删除房号
app.delete('/api/rooms/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM rooms WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// ==================== 住户相关接口 ====================

// 获取所有住户
app.get('/api/residents', (req, res) => {
    const sql = `SELECT r.*,
        b.number as building_number,
        s.number as stair_number,
        f.floor_number,
        rm.room_number
        FROM residents r
        LEFT JOIN buildings b ON r.buildingId = b.id
        LEFT JOIN stairs s ON r.stairId = s.id
        LEFT JOIN floors f ON r.floorId = f.id
        LEFT JOIN rooms rm ON r.roomId = rm.id
        ORDER BY r.id`;
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, data: rows });
    });
});

// 添加住户
app.post('/api/residents', (req, res) => {
    const { name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt } = req.body;
    const sql = `INSERT INTO residents 
        (name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, createdAt], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, id: this.lastID });
    });
});

// 更新住户
app.put('/api/residents/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber } = req.body;
    const sql = `UPDATE residents 
        SET name = ?, phone = ?, buildingId = ?, stairId = ?, floorId = ?, roomId = ?, area = ?, floorNumber = ?, roomNumber = ?
        WHERE id = ?`;
    db.run(sql, [name, phone, buildingId, stairId, floorId, roomId, area, floorNumber, roomNumber, id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// 删除住户
app.delete('/api/residents/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM residents WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// ==================== 费用相关接口 ====================

// 获取费用数据
app.get('/api/fees/:type', (req, res) => {
    const { type } = req.params;
    let tableName;
    if (type === 'property') tableName = 'property_fees';
    else if (type === 'sanitation') tableName = 'sanitation_fees';
    else if (type === 'car') tableName = 'car_fees';
    else if (type === 'motorcycle') tableName = 'motorcycle_fees';
    else if (type === 'water') tableName = 'water_fees';
    else if (type === 'other') tableName = 'other_fees';

    if (!tableName) {
        res.status(400).json({ success: false, message: '无效的费用类型' });
        return;
    }

    const sql = `SELECT * FROM ${tableName} ORDER BY id`;
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, data: rows });
    });
});

// 添加费用
app.post('/api/fees/:type', (req, res) => {
    const { type } = req.params;
    const { description, amount } = req.body;
    
    let tableName;
    if (type === 'property') tableName = 'property_fees';
    else if (type === 'sanitation') tableName = 'sanitation_fees';
    else if (type === 'car') tableName = 'car_fees';
    else if (type === 'motorcycle') tableName = 'motorcycle_fees';
    else if (type === 'water') tableName = 'water_fees';
    else if (type === 'other') tableName = 'other_fees';

    if (!tableName) {
        res.status(400).json({ success: false, message: '无效的费用类型' });
        return;
    }

    const sql = `INSERT INTO ${tableName} (description, amount) VALUES (?, ?)`;
    db.run(sql, [description, amount], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, id: this.lastID });
    });
});

// 删除费用
app.delete('/api/fees/:type/:id', (req, res) => {
    const { type, id } = req.params;
    
    let tableName;
    if (type === 'property') tableName = 'property_fees';
    else if (type === 'sanitation') tableName = 'sanitation_fees';
    else if (type === 'car') tableName = 'car_fees';
    else if (type === 'motorcycle') tableName = 'motorcycle_fees';
    else if (type === 'water') tableName = 'water_fees';
    else if (type === 'other') tableName = 'other_fees';

    if (!tableName) {
        res.status(400).json({ success: false, message: '无效的费用类型' });
        return;
    }

    const sql = `DELETE FROM ${tableName} WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// ==================== 缴费分类相关接口 ====================

// 获取所有缴费分类
app.get('/api/fee-categories', (req, res) => {
    const sql = "SELECT * FROM feeCategories ORDER BY id";
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, data: rows });
    });
});

// ==================== 管理员相关接口 ====================

// 获取所有管理员
app.get('/api/admins', (req, res) => {
    const sql = "SELECT * FROM admin ORDER BY id";
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, data: rows });
    });
});

// 添加管理员
app.post('/api/admins', (req, res) => {
    const { username, password, role, createTime } = req.body;
    const sql = "INSERT INTO admin (username, password, role, createTime) VALUES (?, ?, ?, ?)";
    db.run(sql, [username, password, role, createTime], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true, id: this.lastID });
    });
});

// 更新管理员
app.put('/api/admins/:id', (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    const sql = "UPDATE admin SET username = ?, password = ?, role = ? WHERE id = ?";
    db.run(sql, [username, password, role, id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// 删除管理员
app.delete('/api/admins/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM admin WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) res.status(500).json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n🚀 服务器已启动`);
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`🎯 API文档: http://localhost:${PORT}/api`);
});
