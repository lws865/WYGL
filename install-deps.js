const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = 'E:\\Trae lws\\LWS_web_sqlite';
const nodeModulesDir = path.join(projectDir, 'node_modules');

console.log('项目目录:', projectDir);

// 检查package.json
const packageJsonPath = path.join(projectDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('错误: package.json不存在');
    process.exit(1);
}

console.log('package.json存在');

// 检查node_modules
console.log('node_modules状态:', fs.existsSync(nodeModulesDir) ? '存在' : '不存在');

// 列出node_modules内容
if (fs.existsSync(nodeModulesDir)) {
    const modules = fs.readdirSync(nodeModulesDir);
    console.log('已安装的模块:', modules.join(', '));
}

// 尝试直接使用完整路径运行npm
const npmPath = '"C:\\Program Files\\nodejs\\npm.cmd"';

console.log('\n开始安装依赖...');

try {
    // 使用 --prefix 指定安装目录
    execSync(`${npmPath} install --prefix "${projectDir}" express sqlite3 cors body-parser`, {
        stdio: 'inherit'
    });
    console.log('\n依赖安装完成');
} catch (error) {
    console.error('安装失败:', error.message);
    process.exit(1);
}

// 再次检查node_modules
if (fs.existsSync(nodeModulesDir)) {
    const modules = fs.readdirSync(nodeModulesDir);
    console.log('\n安装后的模块:', modules.join(', '));
}
