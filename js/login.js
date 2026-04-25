// 登录模块 - 使用 API

// 处理登录表单提交
function handleLoginForm() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // 调用API进行登录验证
            const result = await login(username, password);

            if (result.success) {
                // 登录成功，存储用户信息
                localStorage.setItem('currentUser', JSON.stringify(result.user));

                // 跳转到主页面
                window.location.href = 'index.html';
            } else {
                // 登录失败
                alert('用户名或密码错误，请重试');
            }
        });
    }
}

// 页面加载完成后初始化
window.addEventListener('load', async function() {
    // 检查是否已登录
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // 已登录，跳转到主页
        window.location.href = 'index.html';
        return;
    }

    // 处理登录表单
    handleLoginForm();
});
