// 数据库配置文件
// 统一管理所有数据库连接配置，确保使用用户指定的数据库

const path = require('path');
const fs = require('fs');

// 数据库文件路径配置 - 使用用户指定的数据库
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'property_management.db');

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ data目录创建成功');
}

console.log('📁 使用的数据库文件:', dbPath);

module.exports = {
    dbPath: dbPath,
    dataDir: dataDir
};
