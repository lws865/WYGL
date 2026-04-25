document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    loadUserInfo();
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

function showUserMenu() {
    window.open('admin.html', '_blank', 'width=800,height=600');
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}