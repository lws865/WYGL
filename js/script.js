// 跟踪收费平台页面是否已打开
let paymentPlatformWindow = null;

document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    loadUserInfo();
    
    // 绑定收费平台按钮点击事件
    const paymentPlatformBtn = document.querySelector('button[onclick*="payment-platform.html"]');
    if (paymentPlatformBtn) {
        paymentPlatformBtn.onclick = openPaymentPlatform;
    }
});

function checkLogin() {
    const user = localStorage.getItem('user');
    const currentUrl = window.location.href;
    if (!user && !currentUrl.includes('login.html') && !currentUrl.includes('admin.html')) {
        window.location.href = 'login.html';
    }
}

function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.username || '管理员';
        document.getElementById('userRole').textContent = user.role === 'admin' ? '系统管理员' : '普通用户';
    }
}

function openPaymentPlatform() {
    // 检查收费平台页面是否已打开
    if (paymentPlatformWindow && !paymentPlatformWindow.closed) {
        // 页面已打开，提示用户
        alert('收费平台页面已打开，请勿重复打开！');
        // 聚焦到已打开的窗口
        paymentPlatformWindow.focus();
        return;
    }
    
    // 打开新的收费平台页面
    paymentPlatformWindow = window.open('payment-platform.html', '_blank');
    
    // 监听窗口关闭事件
    const checkWindowClosed = setInterval(() => {
        if (paymentPlatformWindow && paymentPlatformWindow.closed) {
            paymentPlatformWindow = null;
            clearInterval(checkWindowClosed);
        }
    }, 1000);
}

function showUserMenu() {
    window.open('admin.html', '_blank', 'width=800,height=600');
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}