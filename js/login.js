/**
 * 登录页面业务逻辑
 * 负责用户登录验证和页面初始化
 */

/**
 * 处理登录表单提交
 * 阻止默认提交行为，通过API验证用户身份
 */
function handleLoginForm() {
    // 获取登录表单元素
    const loginForm = document.getElementById('loginForm');

    // 如果表单存在，绑定提交事件
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            // 阻止表单默认提交行为
            e.preventDefault();

            // 获取用户名和密码输入框的值
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // 调用登录API进行身份验证
            const result = await login(username, password);

            // 检查登录结果
            if (result.success) {
                // 登录成功，将用户信息存储到本地存储
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                localStorage.setItem('user', JSON.stringify(result.user));

                // 跳转到系统首页
                window.location.href = 'index.html';
            } else {
                // 登录失败，显示错误提示
                alert('用户名或密码错误，请重试');
            }
        });
    }
}

/**
 * 页面加载完成后执行初始化操作
 */
window.addEventListener('load', async function() {
    // 检查是否已登录
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // 已登录状态，直接跳转到主页
        window.location.href = 'index.html';
        return;
    }

    // 未登录状态，初始化登录表单处理
    handleLoginForm();
});