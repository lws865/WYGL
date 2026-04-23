const http = require('http');

const API_BASE_URL = 'http://localhost:3000';

function testAddResident() {
    const data = {
        name: '测试用户',
        phone: '13800138000',
        buildingId: 1,
        stairId: 1,
        floorId: 1,
        roomId: 1,
        area: 100,
        floorNumber: 1,
        roomNumber: '101',
        status: '入住',
        renovationStatus: '已装修',
        hasDebt: 0,
        debtAmount: 0,
        debtDescription: '',
        createdAt: new Date().toISOString()
    };

    const postData = JSON.stringify(data);

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/residents',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('测试添加住户，路径:', options.path);
    console.log('测试数据:', data);

    const req = http.request(options, (res) => {
        console.log('响应状态:', res.statusCode);
        console.log('响应头:', res.headers);

        let responseText = '';
        res.on('data', (chunk) => {
            responseText += chunk;
        });

        res.on('end', () => {
            console.log('响应文本:', responseText);
            try {
                const result = JSON.parse(responseText);
                console.log('响应数据:', result);
            } catch (error) {
                console.error('解析JSON失败:', error);
            }
        });
    });

    req.on('error', (e) => {
        console.error('请求失败:', e.message);
    });

    // 写入数据到请求体
    req.write(postData);
    req.end();
}

testAddResident();