/**
 * 系统首页业务逻辑
 * 负责登录状态检查、用户信息加载、收费平台页面管理等功能
 */

// 跟踪收费平台页面是否已打开（用于防止重复打开）
let paymentPlatformWindow = null;

/**
 * 页面DOM加载完成后执行初始化操作
 */
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户登录状态
    checkLogin();
    // 加载用户信息到页面
    loadUserInfo();
    
    // 绑定收费平台按钮点击事件（双重保障）
    const paymentPlatformBtn = document.querySelector('button[onclick*="payment-platform.html"]');
    if (paymentPlatformBtn) {
        paymentPlatformBtn.onclick = openPaymentPlatform;
    }
});

/**
 * 检查用户登录状态
 * 如果用户未登录且当前页面不是登录页或管理员页，跳转到登录页面
 */
function checkLogin() {
    // 从本地存储获取用户信息
    const user = localStorage.getItem('user');
    // 获取当前页面URL
    const currentUrl = window.location.href;
    
    // 如果没有用户信息且当前不是登录页或管理员页，跳转到登录页
    if (!user && !currentUrl.includes('login.html') && !currentUrl.includes('admin.html')) {
        window.location.href = 'login.html';
    }
}

/**
 * 加载用户信息到页面显示
 */
function loadUserInfo() {
    // 从本地存储获取并解析用户信息
    const user = JSON.parse(localStorage.getItem('user'));
    
    // 如果用户信息存在
    if (user) {
        // 设置用户名显示
        document.getElementById('userName').textContent = user.username || '管理员';
        // 设置用户角色显示
        document.getElementById('userRole').textContent = user.role === 'admin' ? '系统管理员' : '普通用户';
    }
}

/**
 * 打开收费平台页面（带防重复打开机制）
 */
function openPaymentPlatform() {
    // 检查收费平台页面是否已打开且未关闭
    if (paymentPlatformWindow && !paymentPlatformWindow.closed) {
        // 页面已打开，提示用户
        alert('收费平台页面已打开，请勿重复打开！');
        // 聚焦到已打开的窗口
        paymentPlatformWindow.focus();
        return;
    }
    
    // 打开新的收费平台页面（在新窗口中打开）
    paymentPlatformWindow = window.open('payment-platform.html', '_blank');
    
    // 设置定时器监听窗口关闭事件（每秒检查一次）
    const checkWindowClosed = setInterval(() => {
        // 如果窗口已关闭
        if (paymentPlatformWindow && paymentPlatformWindow.closed) {
            // 重置窗口引用为null
            paymentPlatformWindow = null;
            // 清除定时器
            clearInterval(checkWindowClosed);
        }
    }, 1000);
}

/**
 * 显示用户菜单（打开管理员页面）
 */
function showUserMenu() {
    // 在新窗口中打开管理员页面，设置窗口大小
    window.open('admin.html', '_blank', 'width=800,height=600');
}

/**
 * 用户退出登录
 */
function logout() {
    // 确认用户是否确定退出
    if (confirm('确定要退出登录吗？')) {
        // 清除本地存储的用户信息
        localStorage.removeItem('user');
        // 跳转到登录页面
        window.location.href = 'login.html';
    }
}