const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'property_management.db'); // 使用用户指定的数据库

// 确保data目录存在
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✓ data目录创建成功');
}

// 创建空数据库文件（服务器启动时会自动初始化）
if (!fs.existsSync(dbPath)) {
    // 创建一个最小的有效SQLite文件头
    const sqliteHeader = Buffer.from([
        0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66,
        0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00
    ]);

    fs.writeFileSync(dbPath, sqliteHeader);
    console.log('✓ SQLite数据库文件创建成功');
    console.log('  文件位置:', dbPath);
} else {
    console.log('ℹ 数据库文件已存在');
}

console.log('\n现在可以尝试启动后端服务器了');
console.log('服务器启动时会自动初始化数据库表结构');
