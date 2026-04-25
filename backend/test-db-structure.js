// 测试数据库结构
const Database = require('better-sqlite3');

// 连接数据库
try {
    const db = new Database('../lws-db.sqlite');
    console.log('数据库连接成功');
    
    // 检查residents表结构
    const tableInfo = db.prepare("PRAGMA table_info(residents)").all();
    console.log('\nResidents表结构:');
    tableInfo.forEach(column => {
        console.log(`${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? 'DEFAULT ' + column.dflt_value : ''}`);
    });
    
    // 检查是否存在property和propertyDescription字段
    const hasProperty = tableInfo.some(column => column.name === 'property');
    const hasPropertyDescription = tableInfo.some(column => column.name === 'propertyDescription');
    
    console.log('\n检查结果:');
    console.log('property字段存在:', hasProperty);
    console.log('propertyDescription字段存在:', hasPropertyDescription);
    
    // 检查现有数据
    const residents = db.prepare("SELECT id, name, property, propertyDescription FROM residents LIMIT 5").all();
    console.log('\n现有住户数据:');
    residents.forEach(resident => {
        console.log(`ID: ${resident.id}, 姓名: ${resident.name}, 性质: ${resident.property}, 说明: ${resident.propertyDescription}`);
    });
    
    db.close();
} catch (error) {
    console.error('错误:', error.message);
}