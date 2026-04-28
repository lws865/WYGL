/**
 * 统计中心页面业务逻辑
 * 负责统计数据展示和用户登录状态管理
 */

/**
 * 检查用户登录状态
 * @returns {boolean} - 是否已登录
 */
function checkLogin() {
    // 从本地存储获取用户信息
    const currentUser = localStorage.getItem('currentUser');
    
    // 如果没有用户信息，跳转到登录页面
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    // 用户已登录
    return true;
}

/**
 * 用户退出登录
 */
function logout() {
    // 清除本地存储的用户信息
    localStorage.removeItem('currentUser');
    // 跳转到登录页面
    window.location.href = 'login.html';
}

/**
 * 页面加载完成后执行初始化操作
 */
window.addEventListener('load', async function() {
    // 检查登录状态
    if (!checkLogin()) return;

    // 加载统计数据
    await loadStatistics();

    // 绑定退出按钮点击事件
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // 确认用户是否确定退出
            if (confirm('确定要退出系统吗？')) {
                logout();
            }
        });
    }
});

/**
 * 加载统计数据
 * 获取楼栋、房间、住户数据并计算相关统计指标
 */
async function loadStatistics() {
    // 并行请求多个数据接口
    const [residentsResult, buildingsResult, roomsResult] = await Promise.all([
        getResidents(),      // 获取住户数据
        getBuildings(),      // 获取楼栋数据
        getRooms()           // 获取房间数据
    ]);

    // 提取数据（处理API调用失败的情况）
    const residents = residentsResult.success ? residentsResult.data : [];
    const buildings = buildingsResult.success ? buildingsResult.data : [];
    const rooms = roomsResult.success ? roomsResult.data : [];

    // 计算统计指标
    const totalBuildings = buildings.length;                           // 楼栋总数
    const totalRooms = rooms.length;                                  // 房间总数
    const totalResidents = residents.length;                          // 住户总数
    const occupiedResidents = residents.filter(r => r.status === '入住').length;  // 已入住住户数
    // 计算入住率（避免除以0）
    const occupancyRate = totalRooms > 0 ? ((occupiedResidents / totalRooms) * 100).toFixed(1) : 0;

    // 更新统计值显示（大数值卡片）
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 2) {
        statValues[2].textContent = `${totalBuildings} 栋`;
    }

    // 更新详细统计数据显示
    const detailedStats = document.querySelectorAll('.stats-item-value');
    if (detailedStats.length >= 6) {
        detailedStats[3].textContent = `${totalBuildings} 栋`;      // 楼栋数
        detailedStats[4].textContent = `${totalRooms} 户`;          // 房间数
        detailedStats[5].textContent = `${occupancyRate}%`;          // 入住率
        detailedStats[6].textContent = `${occupiedResidents} 户`;    // 已入住
        detailedStats[7].textContent = `${totalResidents - occupiedResidents} 户`;  // 未入住
    }
}