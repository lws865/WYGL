const http = require('http');

const data = JSON.stringify({
    description: '按楼层计算电梯费',
    amount: 0
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/fees/elevator',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(data);
req.end();