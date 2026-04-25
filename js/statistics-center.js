// 登录检查
function checkLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 退出系统
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// 页面加载完成后初始化
window.addEventListener('load', async function() {
    if (!checkLogin()) return;

    await loadStatistics();

    // 退出按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出系统吗？')) {
                logout();
            }
        });
    }
});

// 加载统计数据
async function loadStatistics() {
    const [residentsResult, buildingsResult, roomsResult] = await Promise.all([
        getResidents(),
        getBuildings(),
        getRooms()
    ]);

    const residents = residentsResult.success ? residentsResult.data : [];
    const buildings = buildingsResult.success ? buildingsResult.data : [];
    const rooms = roomsResult.success ? roomsResult.data : [];

    const totalBuildings = buildings.length;
    const totalRooms = rooms.length;
    const totalResidents = residents.length;
    const occupiedResidents = residents.filter(r => r.status === '入住').length;
    const occupancyRate = totalRooms > 0 ? ((occupiedResidents / totalRooms) * 100).toFixed(1) : 0;

    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 2) {
        statValues[2].textContent = `${totalBuildings} 栋`;
    }

    const detailedStats = document.querySelectorAll('.stats-item-value');
    if (detailedStats.length >= 6) {
        detailedStats[3].textContent = `${totalBuildings} 栋`;
        detailedStats[4].textContent = `${totalRooms} 户`;
        detailedStats[5].textContent = `${occupancyRate}%`;
        detailedStats[6].textContent = `${occupiedResidents} 户`;
        detailedStats[7].textContent = `${totalResidents - occupiedResidents} 户`;
    }
}