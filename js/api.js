// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// ==================== API请求封装 ====================

// 通用GET请求
async function apiGet(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API请求失败:', error);
        return { success: false, message: error.message };
    }
}

// 通用POST请求
async function apiPost(endpoint, data = {}) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('POST请求URL:', url);
        console.log('POST请求数据:', data);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('POST响应状态:', response.status);
        console.log('POST响应状态文本:', response.statusText);
        console.log('POST响应URL:', response.url);
        
        // 尝试获取响应文本
        const responseText = await response.text();
        console.log('POST响应文本:', responseText);
        
        // 尝试解析为JSON
        try {
            const result = JSON.parse(responseText);
            console.log('POST响应数据:', result);
            return result;
        } catch (error) {
            console.error('解析JSON失败:', error);
            return { success: false, message: '解析响应失败: ' + error.message };
        }
    } catch (error) {
        console.error('API请求失败:', error);
        return { success: false, message: error.message };
    }
}

// 通用PUT请求
async function apiPut(endpoint, data = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API请求失败:', error);
        return { success: false, message: error.message };
    }
}

// 通用DELETE请求
async function apiDelete(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
        console.log('DELETE响应状态:', response.status);
        const text = await response.text();
        console.log('DELETE响应文本:', text);
        if (!text) {
            return { success: true };
        }
        const result = JSON.parse(text);
        return result;
    } catch (error) {
        console.error('API请求失败:', error);
        return { success: false, message: error.message };
    }
}

// ==================== 用户相关API ====================

// 用户登录
async function login(username, password) {
    return await apiPost('/login', { username, password });
}

// ==================== 楼栋相关API ====================

// 获取所有楼栋
async function getBuildings() {
    return await apiGet('/buildings');
}

// 添加楼栋
async function addBuilding(number, floorCount) {
    return await apiPost('/buildings', { number, floorCount });
}

// 更新楼栋
async function updateBuilding(id, number, floorCount) {
    return await apiPut(`/buildings/${id}`, { number, floorCount });
}

// 删除楼栋
async function deleteBuilding(id) {
    return await apiDelete(`/buildings/${id}`);
}

// API别名（避免命名冲突）
async function apiDeleteBuilding(id) {
    return await deleteBuilding(id);
}

// ==================== 梯号相关API ====================

// 获取所有梯号
async function getStairs(buildingId = null) {
    const params = buildingId ? { buildingId } : {};
    return await apiGet('/stairs', params);
}

// 添加梯号
async function addStair(buildingId, number) {
    return await apiPost('/stairs', { buildingId, number });
}

// 更新梯号
async function updateStair(id, buildingId, number) {
    return await apiPut(`/stairs/${id}`, { buildingId, number });
}

// 删除梯号
async function deleteStair(id) {
    return await apiDelete(`/stairs/${id}`);
}

// API别名（避免命名冲突）
async function apiDeleteStair(id) {
    return await deleteStair(id);
}

// ==================== 层号相关API ====================

// 获取所有层号
async function getFloors(stairId = null) {
    const params = stairId ? { stairId } : {};
    return await apiGet('/floors', params);
}

// 添加层号
async function addFloor(buildingId, stairId, floorNumber) {
    return await apiPost('/floors', { buildingId, stairId, floorNumber });
}

// 更新层号
async function updateFloorById(id, buildingId, stairId, floorNumber) {
    return await apiPut(`/floors/${id}`, { buildingId, stairId, floorNumber });
}

// 删除层号
async function deleteFloor(id) {
    return await apiDelete(`/floors/${id}`);
}

// API别名（避免命名冲突）
async function apiDeleteFloor(id) {
    return await deleteFloor(id);
}

// ==================== 房号相关API ====================

// 获取所有房号
async function getRooms(floorId = null, stairId = null) {
    const params = {};
    if (floorId) params.floorId = floorId;
    if (stairId) params.stairId = stairId;
    return await apiGet('/rooms', params);
}

// 添加房号
async function addRoom(buildingId, stairId, floorNumber, roomNumber) {
    return await apiPost('/rooms', { buildingId, stairId, floorNumber, roomNumber });
}

// 更新房号
async function updateRoomById(id, buildingId, stairId, floorNumber, roomNumber) {
    return await apiPut(`/rooms/${id}`, { buildingId, stairId, floorNumber, roomNumber });
}

// 删除房号
async function deleteRoom(id) {
    return await apiDelete(`/rooms/${id}`);
}

// 批量删除房号
async function deleteRoomsBatch(stairId, floorNumber) {
    return await apiDelete(`/rooms/batch/${stairId}/${floorNumber}`);
}

// API别名（避免命名冲突）
async function apiDeleteRoom(id) {
    return await deleteRoom(id);
}

// ==================== 确认删除封装函数 ====================
// 这些函数由building-data.js的confirmDelete调用

async function deleteBuildingById(id) {
    return await apiDeleteBuilding(id);
}

async function deleteStairById(id) {
    return await apiDeleteStair(id);
}

async function deleteFloorById(id) {
    return await apiDeleteFloor(id);
}

async function deleteRoomById(id) {
    return await apiDeleteRoom(id);
}

// ==================== 住户相关API ====================

// 获取所有住户
async function getResidents() {
    return await apiGet('/residents');
}

// 添加住户
async function addResident(data) {
    return await apiPost('/residents', data);
}

// 更新住户
async function updateResident(id, data) {
    return await apiPut(`/residents/${id}`, data);
}

// 删除住户
async function deleteResident(id) {
    return await apiDelete(`/residents/${id}`);
}

// ==================== 费用相关API ====================

// 获取费用数据
async function getFees(type) {
    return await apiGet(`/fees/${type}`);
}

// 添加费用
async function addFee(type, description, amount) {
    return await apiPost(`/fees/${type}`, { description, amount });
}

// 更新费用
async function updateFee(type, id, description, amount) {
    return await apiPut(`/fees/${type}/${id}`, { description, amount });
}

// 删除费用
async function apiDeleteFee(type, id) {
    return await apiDelete(`/fees/${type}/${id}`);
}

// ==================== 缴费分类相关API ====================

// 获取所有缴费分类
async function getFeeCategories() {
    return await apiGet('/fee-categories');
}

// ==================== 管理员相关API ====================

// 获取所有管理员
async function getAdmins() {
    return await apiGet('/admins');
}

// 添加管理员
async function addAdmin(data) {
    return await apiPost('/admins', data);
}

// 更新管理员
async function apiUpdateAdmin(id, data) {
    return await apiPut(`/admins/${id}`, data);
}

// 删除管理员
async function apiDeleteAdmin(id) {
    return await apiDelete(`/admins/${id}`);
}

// ==================== 管理员密码相关API ====================

// 获取管理员密码
async function getAdminPassword() {
    return await apiGet('/admin/password');
}

// 更新管理员密码
async function updateAdminPassword(password) {
    return await apiPost('/admin/password', { password });
}
