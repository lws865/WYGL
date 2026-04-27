const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const publicDir = path.join(__dirname, '..');

const server = http.createServer((req, res) => {
    let filePath = path.join(publicDir, req.url === '/' ? 'basic-data.html' : req.url);
    
    // 处理路径
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }
    
    // 读取文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在，返回 404
                res.writeHead(404);
                res.end('File not found');
            } else {
                // 其他错误
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            // 文件读取成功
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 静态服务器已启动`);
    console.log(`📡 访问地址: http://localhost:${PORT}`);
    console.log(`🎯 费用管理页面: http://localhost:${PORT}/basic-data.html`);
});
