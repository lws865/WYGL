const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'property_management.db'); // 使用用户指定的数据库

console.log('=== 系统状态检查 ===');
console.log('当前工作目录:', process.cwd());
console.log('数据库文件:', dbPath);
console.log('数据库文件存在:', fs.existsSync(dbPath));

// 检查sql.js
console.log('\n=== 检查sql.js ===');
try {
    const initSqlJs = require('sql.js');
    console.log('✅ sql.js 模块已安装');
} catch (e) {
    console.error('❌ sql.js 模块未安装:', e.message);
}

// 检查sqlite3
console.log('\n=== 检查sqlite3 ===');
try {
    const sqlite3 = require('sqlite3').verbose();
    console.log('✅ sqlite3 模块已安装');
} catch (e) {
    console.error('❌ sqlite3 模块错误:', e.message);
}

// 检查node-gyp
console.log('\n=== 检查node-gyp ===');
try {
    const nodeGyp = require('node-gyp');
    console.log('✅ node-gyp 模块已安装');
} catch (e) {
    console.error('❌ node-gyp 模块未安装:', e.message);
}

console.log('\n=== 检查完成 ===');
