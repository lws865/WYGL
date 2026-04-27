const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const publicDir = __dirname;

console.log('=== 简单HTTP服务器 ===');
console.log('服务目录:', publicDir);
console.log('端口:', PORT);
console.log('访问地址: http://localhost:' + PORT);

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log('请求:', req.url);
    
    let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('\n✅ 服务器已启动！');
    console.log('📡 访问地址: http://localhost:' + PORT);
    console.log('🎯 系统首页: http://localhost:' + PORT + '/index.html');
    console.log('🔑 登录页面: http://localhost:' + PORT + '/login.html');
});

// 防止进程自动退出
process.on('SIGINT', () => {
    console.log('\n\n👋 服务器已关闭');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 服务器已关闭');
    process.exit(0);
});

console.log('\n服务器正在启动...');
