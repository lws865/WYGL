const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = 'E:\\Trae lws\\LWS_web_sqlite';
const npmPath = 'C:\\Program Files\\nodejs\\npm.cmd';

console.log('=== NPM 诊断脚本 ===\n');

// 检查npm路径
console.log('NPM路径:', npmPath);
console.log('NPM是否存在:', fs.existsSync(npmPath));

// 检查node版本
try {
    const nodeVersion = execSync('"C:\\Program Files\\nodejs\\node.exe" --version', { encoding: 'utf8' });
    console.log('Node版本:', nodeVersion.trim());
} catch (e) {
    console.log('Node版本检查失败');
}

// 检查npm版本
try {
    const npmVersion = execSync(`"${npmPath}" --version`, { encoding: 'utf8' });
    console.log('NPM版本:', npmVersion.trim());
} catch (e) {
    console.log('NPM版本检查失败');
}

// 检查package.json
const packageJsonPath = path.join(projectDir, 'package.json');
console.log('\nPackage.json路径:', packageJsonPath);
console.log('Package.json存在:', fs.existsSync(packageJsonPath));

// 读取package.json
if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('依赖:', JSON.stringify(pkg.dependencies, null, 2));
}

// 检查node_modules
const nodeModulesDir = path.join(projectDir, 'node_modules');
console.log('\nnode_modules路径:', nodeModulesDir);
console.log('node_modules存在:', fs.existsSync(nodeModulesDir));

if (fs.existsSync(nodeModulesDir)) {
    const modules = fs.readdirSync(nodeModulesDir);
    console.log('已安装模块数:', modules.length);
    console.log('已安装模块:', modules.join(', '));
}

// 尝试直接执行npm install --verbose
console.log('\n=== 尝试安装 express ===');
try {
    const result = execSync(`"${npmPath}" install express --verbose`, {
        cwd: projectDir,
        encoding: 'utf8',
        timeout: 60000
    });
    console.log('安装结果:', result);
} catch (e) {
    console.log('安装失败:', e.message);
    if (e.stdout) console.log('stdout:', e.stdout);
    if (e.stderr) console.log('stderr:', e.stderr);
}

console.log('\n=== 再次检查 node_modules ===');
if (fs.existsSync(nodeModulesDir)) {
    const modules = fs.readdirSync(nodeModulesDir);
    console.log('已安装模块数:', modules.length);
    console.log('已安装模块:', modules.join(', '));
}
