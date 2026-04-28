/**
 * API接口封装文件
 * 提供系统所有后端API的统一调用接口
 */

// API基础URL，指向后端服务器
const API_BASE_URL = 'http://localhost:3001/api';

// ==================== API请求封装 ====================

/**
 * 通用GET请求封装
 * @param {string} endpoint - API端点路径
 * @param {Object} params - 查询参数对象（可选）
 * @returns {Promise<Object>} - 返回API响应数据
 */
async function apiGet(endpoint, params = {}) {
    // 构建查询字符串
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;

    try {
        // 发送GET请求
        const response = await fetch(url);
        // 解析响应为JSON
        const result = await response.json();
        return result;
    } catch (error) {
        // 请求失败处理
        console.error('API请求失败:', error);
        return { success: false, message: error.message };
    }
}

/**
 * 通用POST请求封装
 * @param {string} endpoint - API端点路径
 * @param {Object} data - 请求体数据（可选）
 * @returns {Promise<Object>} - 返回API响应数据
 */
async function apiPost(endpoint, data = {}) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        // 日志记录请求信息
        console.log('POST请求URL:', url);
        console.log('POST请求数据:', data);
        
        // 发送POST请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        // 日志记录响应信息
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

/**
 * 通用PUT请求封装
 * @param {string} endpoint - API端点路径
 * @param {Object} data - 请求体数据（可选）
 * @returns {Promise<Object>} - 返回API响应数据
 */
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

/**
 * 通用DELETE请求封装
 * @param {string} endpoint - API端点路径
 * @returns {Promise<Object>} - 返回API响应数据
 */
async function apiDelete(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
        console.log('DELETE响应状态:', response.status);
        const text = await response.text();
        console.log('DELETE响应文本:', text);
        // 如果响应为空，返回成功
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

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} - 返回登录结果
 */
async function login(username, password) {
    return await apiPost('/login', { username, password });
}

// ==================== 楼栋相关API ====================

/**
 * 获取所有楼栋
 * @returns {Promise<Object>} - 返回楼栋列表
 */
async function getBuildings() {
    return await apiGet('/buildings');
}

/**
 * 添加楼栋
 * @param {string} number - 楼栋编号
 * @param {number} floorCount - 楼层数量
 * @returns {Promise<Object>} - 返回添加结果
 */
async function addBuilding(number, floorCount) {
    return await apiPost('/buildings', { number, floorCount });
}

/**
 * 更新楼栋
 * @param {number} id - 楼栋ID
 * @param {string} number - 楼栋编号
 * @param {number} floorCount - 楼层数量
 * @returns {Promise<Object>} - 返回更新结果
 */
async function updateBuilding(id, number, floorCount) {
    return await apiPut(`/buildings/${id}`, { number, floorCount });
}

/**
 * 删除楼栋
 * @param {number} id - 楼栋ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteBuilding(id) {
    return await apiDelete(`/buildings/${id}`);
}

/**
 * 删除楼栋（API别名，避免命名冲突）
 * @param {number} id - 楼栋ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function apiDeleteBuilding(id) {
    return await deleteBuilding(id);
}

// ==================== 梯号相关API ====================

/**
 * 获取所有梯号
 * @param {number|null} buildingId - 楼栋ID（可选，用于筛选）
 * @returns {Promise<Object>} - 返回梯号列表
 */
async function getStairs(buildingId = null) {
    const params = buildingId ? { buildingId } : {};
    return await apiGet('/stairs', params);
}

/**
 * 添加梯号
 * @param {number} buildingId - 楼栋ID
 * @param {string} number - 梯号
 * @returns {Promise<Object>} - 返回添加结果
 */
async function addStair(buildingId, number) {
    return await apiPost('/stairs', { buildingId, number });
}

/**
 * 更新梯号
 * @param {number} id - 梯号ID
 * @param {number} buildingId - 楼栋ID
 * @param {string} number - 梯号
 * @returns {Promise<Object>} - 返回更新结果
 */
async function updateStair(id, buildingId, number) {
    return await apiPut(`/stairs/${id}`, { buildingId, number });
}

/**
 * 删除梯号
 * @param {number} id - 梯号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteStair(id) {
    return await apiDelete(`/stairs/${id}`);
}

/**
 * 删除梯号（API别名，避免命名冲突）
 * @param {number} id - 梯号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function apiDeleteStair(id) {
    return await deleteStair(id);
}

// ==================== 层号相关API ====================

/**
 * 获取所有层号
 * @param {number|null} stairId - 梯号ID（可选，用于筛选）
 * @returns {Promise<Object>} - 返回层号列表
 */
async function getFloors(stairId = null) {
    const params = stairId ? { stairId } : {};
    return await apiGet('/floors', params);
}

/**
 * 添加层号
 * @param {number} buildingId - 楼栋ID
 * @param {number} stairId - 梯号ID
 * @param {number} floorNumber - 楼层号
 * @returns {Promise<Object>} - 返回添加结果
 */
async function addFloor(buildingId, stairId, floorNumber) {
    return await apiPost('/floors', { buildingId, stairId, floorNumber });
}

/**
 * 更新层号
 * @param {number} id - 层号ID
 * @param {number} buildingId - 楼栋ID
 * @param {number} stairId - 梯号ID
 * @param {number} floorNumber - 楼层号
 * @returns {Promise<Object>} - 返回更新结果
 */
async function updateFloorById(id, buildingId, stairId, floorNumber) {
    return await apiPut(`/floors/${id}`, { buildingId, stairId, floorNumber });
}

/**
 * 删除层号
 * @param {number} id - 层号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteFloor(id) {
    return await apiDelete(`/floors/${id}`);
}

/**
 * 删除层号（API别名，避免命名冲突）
 * @param {number} id - 层号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function apiDeleteFloor(id) {
    return await deleteFloor(id);
}

// ==================== 房号相关API ====================

/**
 * 获取所有房号
 * @param {number|null} floorId - 层号ID（可选，用于筛选）
 * @param {number|null} stairId - 梯号ID（可选，用于筛选）
 * @returns {Promise<Object>} - 返回房号列表
 */
async function getRooms(floorId = null, stairId = null) {
    const params = {};
    if (floorId) params.floorId = floorId;
    if (stairId) params.stairId = stairId;
    return await apiGet('/rooms', params);
}

/**
 * 添加房号
 * @param {number} buildingId - 楼栋ID
 * @param {number} stairId - 梯号ID
 * @param {number} floorNumber - 楼层号
 * @param {number} roomNumber - 房间号
 * @returns {Promise<Object>} - 返回添加结果
 */
async function addRoom(buildingId, stairId, floorNumber, roomNumber) {
    return await apiPost('/rooms', { buildingId, stairId, floorNumber, roomNumber });
}

/**
 * 更新房号
 * @param {number} id - 房号ID
 * @param {number} buildingId - 楼栋ID
 * @param {number} stairId - 梯号ID
 * @param {number} floorNumber - 楼层号
 * @param {number} roomNumber - 房间号
 * @returns {Promise<Object>} - 返回更新结果
 */
async function updateRoomById(id, buildingId, stairId, floorNumber, roomNumber) {
    return await apiPut(`/rooms/${id}`, { buildingId, stairId, floorNumber, roomNumber });
}

/**
 * 删除房号
 * @param {number} id - 房号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteRoom(id) {
    return await apiDelete(`/rooms/${id}`);
}

/**
 * 批量删除房号
 * @param {number} stairId - 梯号ID
 * @param {number} floorNumber - 楼层号
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteRoomsBatch(stairId, floorNumber) {
    return await apiDelete(`/rooms/batch/${stairId}/${floorNumber}`);
}

/**
 * 删除房号（API别名，避免命名冲突）
 * @param {number} id - 房号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function apiDeleteRoom(id) {
    return await deleteRoom(id);
}

// ==================== 确认删除封装函数 ====================
// 这些函数由building-data.js的confirmDelete调用

/**
 * 删除楼栋（确认删除封装）
 * @param {number} id - 楼栋ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteBuildingById(id) {
    return await apiDeleteBuilding(id);
}

/**
 * 删除梯号（确认删除封装）
 * @param {number} id - 梯号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteStairById(id) {
    return await apiDeleteStair(id);
}

/**
 * 删除层号（确认删除封装）
 * @param {number} id - 层号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteFloorById(id) {
    return await apiDeleteFloor(id);
}

/**
 * 删除房号（确认删除封装）
 * @param {number} id - 房号ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteRoomById(id) {
    return await apiDeleteRoom(id);
}

// ==================== 住户相关API ====================

/**
 * 获取所有住户
 * @returns {Promise<Object>} - 返回住户列表
 */
async function getResidents() {
    return await apiGet('/residents');
}

/**
 * 添加住户
 * @param {Object} data - 住户数据对象
 * @returns {Promise<Object>} - 返回添加结果
 */
async function addResident(data) {
    return await apiPost('/residents', data);
}

/**
 * 更新住户
 * @param {number} id - 住户ID
 * @param {Object} data - 住户数据对象
 * @returns {Promise<Object>} - 返回更新结果
 */
async function updateResident(id, data) {
    return await apiPut(`/residents/${id}`, data);
}

/**
 * 删除住户
 * @param {number} id - 住户ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function deleteResident(id) {
    return await apiDelete(`/residents/${id}`);
}

// ==================== 费用相关API ====================

/**
 * 获取费用数据
 * @param {string} type - 费用类型
 * @returns {Promise<Object>} - 返回费用列表
 */
async function getFees(type) {
    return await apiGet(`/fees/${type}`);
}

/**
 * 获取物业楼层基础费（用于根据层号计算费用）
 * @returns {Promise<Object>} - 返回物业楼层基础费列表
 */
async function getPropertyBuildingFees() {
    return await apiGet('/property-building-fees');
}

/**
 * 获取电梯楼层基础费（用于根据层号计算电梯费）
 * @returns {Promise<Object>} - 返回电梯楼层基础费列表
 */
async function getElevatorBuildingFees() {
    return await apiGet('/elevator-building-fees');
}

/**
 * 添加费用
 * @param {string} type - 费用类型
 * @param {string} description - 费用描述
 * @param {number} amount - 费用金额
 * @returns {Promise<Object>} - 返回添加结果
 */
async function addFee(type, description, amount) {
    return await apiPost(`/fees/${type}`, { description, amount });
}

/**
 * 更新费用
 * @param {string} type - 费用类型
 * @param {number} id - 费用ID
 * @param {string} description - 费用描述
 * @param {number} amount - 费用金额
 * @returns {Promise<Object>} - 返回更新结果
 */
async function updateFee(type, id, description, amount) {
    return await apiPut(`/fees/${type}/${id}`, { description, amount });
}

/**
 * 删除费用
 * @param {string} type - 费用类型
 * @param {number} id - 费用ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function apiDeleteFee(type, id) {
    return await apiDelete(`/fees/${type}/${id}`);
}

/**
 * 物业楼层基础费添加
 * @param {string} description - 费用描述
 * @param {number} amount - 费用金额
 * @returns {Promise<Object>} - 返回添加结果
 */
async function addPropertyFee(description, amount) {
    return await apiPost('/property-fees', { description, amount });
}

/**
 * 物业楼层基础费更新
 * @param {number} id - 费用ID
 * @param {string} description - 费用描述
 * @param {number} amount - 费用金额
 * @returns {Promise<Object>} - 返回更新结果
 */
async function updatePropertyFee(id, description, amount) {
    return await apiPut(`/property-fees/${id}`, { description, amount });
}

// ==================== 缴费分类相关API ====================

/**
 * 获取所有缴费分类
 * @returns {Promise<Object>} - 返回缴费分类列表
 */
async function getFeeCategories() {
    return await apiGet('/fee-categories');
}

// ==================== 管理员相关API ====================

/**
 * 获取所有管理员
 * @returns {Promise<Object>} - 返回管理员列表
 */
async function getAdmins() {
    return await apiGet('/admins');
}

/**
 * 添加管理员
 * @param {Object} data - 管理员数据对象
 * @returns {Promise<Object>} - 返回添加结果
 */
async function addAdmin(data) {
    return await apiPost('/admins', data);
}

/**
 * 更新管理员
 * @param {number} id - 管理员ID
 * @param {Object} data - 管理员数据对象
 * @returns {Promise<Object>} - 返回更新结果
 */
async function apiUpdateAdmin(id, data) {
    return await apiPut(`/admins/${id}`, data);
}

/**
 * 删除管理员
 * @param {number} id - 管理员ID
 * @returns {Promise<Object>} - 返回删除结果
 */
async function apiDeleteAdmin(id) {
    return await apiDelete(`/admins/${id}`);
}

// ==================== 管理员密码相关API ====================

/**
 * 获取管理员密码
 * @returns {Promise<Object>} - 返回管理员密码信息
 */
async function getAdminPassword() {
    return await apiGet('/admin/password');
}

/**
 * 更新管理员密码
 * @param {string} password - 新密码
 * @returns {Promise<Object>} - 返回更新结果
 */
async function updateAdminPassword(password) {
    return await apiPost('/admin/password', { password });
}