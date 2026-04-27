const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'property_management.db'); // 使用用户指定的数据库

console.log('测试SQLite3原生模块...');
console.log('数据库文件:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        process.exit(1);
    }
    console.log('✅ 数据库连接成功');
});

db.run("SELECT 1", (err) => {
    if (err) {
        console.error('❌ SQL执行失败:', err.message);
        process.exit(1);
    }
    console.log('✅ SQL执行成功');
    db.close();
    console.log('\n✅ SQLite3原生模块工作正常！');
});
