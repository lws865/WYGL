/**
 * 基础数据页面业务逻辑
 * 负责费用管理的增删改查操作
 */

// 当前删除操作的ID和类型
let currentDeleteId = null;
let currentDeleteType = null;

/**
 * 页面DOM加载完成后执行初始化
 */
document.addEventListener('DOMContentLoaded', async function() {
    // 日志记录：DOM内容加载完成
    console.log('DOM内容加载完成，开始初始化基础数据页面');
    
    // 检查登录状态
    if (!checkLogin()) {
        console.log('未登录，跳转到登录页面');
        return;
    }
    
    // 登录验证通过，开始加载数据
    console.log('登录状态验证通过，开始加载数据');
    await loadAllFees();
    
    // 初始化表单事件
    console.log('数据加载完成，初始化表单事件');
    initFormEvents();
});

/**
 * 页面焦点变化时重新加载数据
 */
document.addEventListener('visibilitychange', async function() {
    // 当页面重新获得焦点时
    if (document.visibilityState === 'visible') {
        console.log('页面重新获得焦点，重新加载数据');
        await loadAllFees();
    }
});

/**
 * 检查用户登录状态
 * @returns {boolean} - 是否已登录
 */
function checkLogin() {
    // 从本地存储获取用户信息
    const currentUser = localStorage.getItem('user');
    
    // 如果没有用户信息，跳转到登录页面
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    // 已登录
    return true;
}

/**
 * 用户退出登录
 */
function logout() {
    // 清除本地存储的用户信息
    localStorage.removeItem('user');
    // 跳转到登录页面
    window.location.href = 'login.html';
}

/**
 * 加载所有费用数据
 */
async function loadAllFees() {
    try {
        // 按顺序加载各类费用数据
        console.log('开始加载物业楼层基础费数据');
        await loadFeesByType('property', 'propertyTableBody');
        
        console.log('开始加载卫生费数据');
        await loadFeesByType('sanitation', 'sanitationTableBody');
        
        console.log('开始加载汽车停车费数据');
        await loadFeesByType('car', 'carTableBody');
        
        console.log('开始加载摩托车停车费数据');
        await loadFeesByType('motorcycle', 'motorcycleTableBody');
        
        console.log('开始加载其他费用数据');
        await loadFeesByType('other', 'otherTableBody');
        
        console.log('开始加载物业管理费项目数据');
        await loadPropertyManagementItems();
        
        console.log('开始加载电梯管理费项目数据');
        await loadElevatorManagementItems();
        
        console.log('所有数据加载完成');
    } catch (err) {
        console.error('加载费用数据失败:', err);
    }
}

/**
 * 加载电梯管理费项目数据
 */
async function loadElevatorManagementItems() {
    try {
        console.log('请求电梯管理费项目数据');
        // 调用API获取电梯管理费项目
        const result = await apiGet('/elevator-management-items');
        console.log('电梯管理费项目数据:', result);
        
        // 获取表格容器
        const tableBody = document.getElementById('elevatorManagementItemsTableBody');
        console.log('电梯管理费项目表格容器:', tableBody);
        
        // 如果请求成功且有数据
        if (result.success && result.data.length > 0) {
            // 渲染表格内容
            tableBody.innerHTML = result.data.map(item => `
                <div class="table-row">
                    <div class="table-cell" style="flex:0.5">${item.id}</div>
                    <div class="table-cell" style="flex:2">${item.description}</div>
                    <div class="table-cell" style="flex:1">${item.amount}</div>
                    <div class="table-cell" style="flex:0.5">
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="editElevatorManagementItem(${item.id}, '${item.description}', ${item.amount})">编辑</button>
                            <button class="action-btn delete-btn" onclick="deleteElevatorManagementItem(${item.id})">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            // 没有数据时显示提示
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">暂无数据</div></div>';
        }
    } catch (err) {
        console.error('加载电梯管理费项目失败:', err);
        const tableBody = document.getElementById('elevatorManagementItemsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">加载失败</div></div>';
        }
    }
}

/**
 * 加载物业管理费项目数据
 */
async function loadPropertyManagementItems() {
    try {
        console.log('请求物业管理费项目数据');
        // 调用API获取物业管理费项目
        const result = await apiGet('/property-management-items');
        console.log('物业管理费项目数据:', result);
        
        // 获取表格容器
        const tableBody = document.getElementById('propertyManagementItemsTableBody');
        console.log('物业管理费项目表格容器:', tableBody);
        
        // 如果请求成功且有数据
        if (result.success && result.data.length > 0) {
            // 渲染表格内容
            tableBody.innerHTML = result.data.map(item => `
                <div class="table-row">
                    <div class="table-cell" style="flex:0.5">${item.id}</div>
                    <div class="table-cell" style="flex:3">${item.description}</div>
                    <div class="table-cell" style="flex:0.5">
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="editPropertyManagementItem(${item.id}, '${item.description}')">编辑</button>
                            <button class="action-btn delete-btn" onclick="deletePropertyManagementItem(${item.id})">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            // 没有数据时显示提示
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">暂无数据</div></div>';
        }
    } catch (err) {
        console.error('加载物业管理费项目失败:', err);
        const tableBody = document.getElementById('propertyManagementItemsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">加载失败</div></div>';
        }
    }
}

/**
 * 根据费用类型加载数据
 * @param {string} type - 费用类型
 * @param {string} tableBodyId - 表格容器ID
 */
async function loadFeesByType(type, tableBodyId) {
    try {
        console.log(`请求${type}费用数据`);
        // 调用API获取指定类型的费用数据
        const result = await getFees(type);
        console.log(`${type}费用数据:`, result);
        
        // 获取表格容器
        const tableBody = document.getElementById(tableBodyId);
        console.log(`${type}费用表格容器:`, tableBody);

        // 如果请求成功
        if (result.success) {
            const fees = result.data;

            // 如果没有数据
            if (fees.length === 0) {
                tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">暂无数据</div></div>';
                return;
            }

            // 渲染表格内容
            tableBody.innerHTML = fees.map(fee => `
                <div class="table-row">
                    <div class="table-cell">${fee.id}</div>
                    <div class="table-cell">${fee.description}</div>
                    <div class="table-cell">${fee.amount ? fee.amount.toFixed(2) : '0.00'}</div>
                    <div class="table-cell">
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="editFee('${type}', ${fee.id}, '${fee.description}', ${fee.amount})">编辑</button>
                            <button class="action-btn delete-btn" onclick="deleteFee('${type}', ${fee.id})">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">加载失败</div></div>';
        }
    } catch (err) {
        console.error(`加载${type}费用失败:`, err);
        const tableBody = document.getElementById(tableBodyId);
        if (tableBody) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">加载失败</div></div>';
        }
    }
}

/**
 * 打开费用编辑弹窗
 * @param {string} type - 费用类型
 * @param {number|null} id - 费用ID（编辑时传入）
 * @param {string} description - 费用描述
 * @param {number} amount - 费用金额
 */
function openFeeModal(type, id = null, description = '', amount = '') {
    // 设置表单字段值
    document.getElementById('feeType').value = type;
    document.getElementById('feeId').value = id || '';
    document.getElementById('feeDescription').value = description;
    document.getElementById('feeAmount').value = amount;

    // 费用类型标题映射
    const titles = {
        'property': '物业管理费',
        'sanitation': '卫生费',
        'car': '汽车停车费',
        'motorcycle': '摩托车停车费',
        'property_management': '物业管理费项目',
        'other': '其他费用'
    };

    // 设置弹窗标题
    document.getElementById('feeModalTitle').textContent = (id ? '编辑' : '添加') + titles[type];
    // 显示弹窗
    document.getElementById('feeModal').style.display = 'flex';
}

/**
 * 关闭费用弹窗
 */
function closeFeeModal() {
    document.getElementById('feeModal').style.display = 'none';
}

/**
 * 打开删除确认弹窗
 * @param {string} type - 删除类型
 * @param {number} id - 删除项ID
 * @param {string} name - 删除项名称
 */
function openDeleteModal(type, id, name) {
    // 保存当前删除信息
    currentDeleteId = id;
    currentDeleteType = type;
    
    // 设置删除确认消息
    document.getElementById('deleteMessage').textContent = `确定要删除"${name}"吗？此操作不可恢复。`;
    // 显示弹窗
    document.getElementById('deleteModal').style.display = 'flex';
}

/**
 * 关闭删除确认弹窗
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

/**
 * 确认删除操作
 */
async function confirmDelete() {
    // 如果没有设置删除信息，直接返回
    if (!currentDeleteType || !currentDeleteId) return;

    try {
        let result;
        // 根据删除类型调用不同的API
        if (currentDeleteType === 'property_management') {
            result = await apiDelete(`/property-management-items/${currentDeleteId}`);
        } else if (currentDeleteType === 'elevator_management') {
            result = await apiDelete(`/elevator-management-items/${currentDeleteId}`);
        } else {
            result = await apiDelete(`/fees/${currentDeleteType}/${currentDeleteId}`);
        }

        // 如果删除成功
        if (result.success) {
            // 重新加载对应的数据
            if (currentDeleteType === 'property_management') {
                await loadPropertyManagementItems();
            } else if (currentDeleteType === 'elevator_management') {
                await loadElevatorManagementItems();
            } else {
                await loadFeesByType(currentDeleteType, `${currentDeleteType}TableBody`);
            }
            alert('删除成功！');
        } else {
            alert('删除失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert('删除失败：' + err.message);
    } finally {
        // 关闭弹窗
        closeDeleteModal();
    }
}

// ==================== 物业管理费项目管理函数 ====================

// 当前编辑的物业管理费项目ID
let currentPropertyManagementItemId = null;

/**
 * 打开物业管理费项目编辑弹窗
 * @param {number|null} id - 项目ID（编辑时传入）
 * @param {string} description - 项目描述
 */
function openPropertyManagementItemModal(id, description) {
    // 保存当前编辑ID
    currentPropertyManagementItemId = id;
    
    // 获取弹窗元素
    const modal = document.getElementById('propertyManagementItemModal');
    const title = document.getElementById('propertyManagementItemModalTitle');
    const descInput = document.getElementById('propertyManagementItemDescription');

    // 根据是否有ID判断是编辑还是添加
    if (id) {
        title.textContent = '编辑物业管理费项目';
        descInput.value = description;
    } else {
        title.textContent = '添加物业管理费项目';
        descInput.value = '';
    }

    // 显示弹窗
    modal.style.display = 'flex';
}

/**
 * 关闭物业管理费项目弹窗
 */
function closePropertyManagementItemModal() {
    document.getElementById('propertyManagementItemModal').style.display = 'none';
}

/**
 * 编辑物业管理费项目
 * @param {number} id - 项目ID
 * @param {string} description - 项目描述
 */
function editPropertyManagementItem(id, description) {
    openPropertyManagementItemModal(id, description);
}

/**
 * 删除物业管理费项目
 * @param {number} id - 项目ID
 */
function deletePropertyManagementItem(id) {
    openDeleteModal('property_management', id, '物业管理费项目');
}

/**
 * 物业管理费项目表单提交处理
 */
document.getElementById('propertyManagementItemForm').addEventListener('submit', async function(e) {
    // 阻止表单默认提交
    e.preventDefault();

    // 获取表单数据
    const description = document.getElementById('propertyManagementItemDescription').value.trim();
    
    // 验证描述字段
    if (!description) {
        alert('请填写描述');
        return;
    }

    try {
        let result;
        // 根据是否有ID判断是更新还是添加
        if (currentPropertyManagementItemId) {
            result = await apiPut(`/property-management-items/${currentPropertyManagementItemId}`, { description });
        } else {
            result = await apiPost('/property-management-items', { description });
        }

        // 如果操作成功
        if (result.success) {
            // 重新加载数据
            await loadPropertyManagementItems();
            alert(currentPropertyManagementItemId ? '更新成功！' : '添加成功！');
        } else {
            alert((currentPropertyManagementItemId ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert((currentPropertyManagementItemId ? '更新' : '添加') + '失败：' + err.message);
    } finally {
        // 关闭弹窗
        closePropertyManagementItemModal();
    }
});

// ==================== 电梯管理费项目管理函数 ====================

// 当前编辑的电梯管理费项目ID
let currentElevatorManagementItemId = null;

/**
 * 打开电梯管理费项目编辑弹窗
 * @param {number|null} id - 项目ID（编辑时传入）
 * @param {string} description - 项目描述
 * @param {number} amount - 项目金额
 */
function openElevatorManagementItemModal(id, description, amount) {
    // 保存当前编辑ID
    currentElevatorManagementItemId = id;
    
    // 获取弹窗元素
    const modal = document.getElementById('elevatorManagementItemModal');
    const title = document.getElementById('elevatorManagementItemModalTitle');
    const descInput = document.getElementById('elevatorManagementItemDescription');
    const amountInput = document.getElementById('elevatorManagementItemAmount');

    // 根据是否有ID判断是编辑还是添加
    if (id) {
        title.textContent = '编辑电梯管理费项目';
        descInput.value = description;
        amountInput.value = amount;
    } else {
        title.textContent = '添加电梯管理费项目';
        descInput.value = '';
        amountInput.value = '';
    }

    // 显示弹窗
    modal.style.display = 'flex';
}

/**
 * 关闭电梯管理费项目弹窗
 */
function closeElevatorManagementItemModal() {
    document.getElementById('elevatorManagementItemModal').style.display = 'none';
}

/**
 * 编辑电梯管理费项目
 * @param {number} id - 项目ID
 * @param {string} description - 项目描述
 * @param {number} amount - 项目金额
 */
function editElevatorManagementItem(id, description, amount) {
    openElevatorManagementItemModal(id, description, amount);
}

/**
 * 删除电梯管理费项目
 * @param {number} id - 项目ID
 */
function deleteElevatorManagementItem(id) {
    openDeleteModal('elevator_management', id, '电梯管理费项目');
}

/**
 * 电梯管理费项目表单提交处理
 */
document.getElementById('elevatorManagementItemForm').addEventListener('submit', async function(e) {
    // 阻止表单默认提交
    e.preventDefault();

    // 获取表单数据
    const description = document.getElementById('elevatorManagementItemDescription').value.trim();
    const amount = parseFloat(document.getElementById('elevatorManagementItemAmount').value);

    // 验证描述字段
    if (!description) {
        alert('请填写描述');
        return;
    }

    // 验证金额字段
    if (isNaN(amount) || amount < 0) {
        alert('请输入有效的金额');
        return;
    }

    try {
        let result;
        // 根据是否有ID判断是更新还是添加
        if (currentElevatorManagementItemId) {
            result = await apiPut(`/elevator-management-items/${currentElevatorManagementItemId}`, { description, amount });
        } else {
            result = await apiPost('/elevator-management-items', { description, amount });
        }

        // 如果操作成功
        if (result.success) {
            // 重新加载数据
            await loadElevatorManagementItems();
            alert(currentElevatorManagementItemId ? '更新成功！' : '添加成功！');
        } else {
            alert((currentElevatorManagementItemId ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert((currentElevatorManagementItemId ? '更新' : '添加') + '失败：' + err.message);
    } finally {
        // 关闭弹窗
        closeElevatorManagementItemModal();
    }
});

/**
 * 编辑费用
 * @param {string} type - 费用类型
 * @param {number} id - 费用ID
 * @param {string} description - 费用描述
 * @param {number} amount - 费用金额
 */
function editFee(type, id, description, amount) {
    openFeeModal(type, id, description, amount);
}

/**
 * 删除费用
 * @param {string} type - 费用类型
 * @param {number} id - 费用ID
 */
function deleteFee(type, id) {
    openDeleteModal(type, id, '费用');
}

/**
 * 费用表单提交处理
 */
document.getElementById('feeForm').addEventListener('submit', async function(e) {
    // 阻止表单默认提交
    e.preventDefault();

    // 获取表单数据
    const type = document.getElementById('feeType').value;
    const id = document.getElementById('feeId').value;
    const description = document.getElementById('feeDescription').value.trim();
    const amount = parseFloat(document.getElementById('feeAmount').value);

    // 验证描述字段
    if (!description) {
        alert('请填写描述');
        return;
    }

    // 验证金额字段
    if (isNaN(amount) || amount < 0) {
        alert('请输入有效的金额');
        return;
    }

    try {
        let result;
        // 根据是否有ID判断是更新还是添加
        if (id) {
            result = await updateFee(type, id, description, amount);
        } else {
            result = await addFee(type, description, amount);
        }

        // 如果操作成功
        if (result.success) {
            // 重新加载数据
            await loadFeesByType(type, `${type}TableBody`);
            alert(id ? '更新成功！' : '添加成功！');
        } else {
            alert((id ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert((id ? '更新' : '添加') + '失败：' + err.message);
    } finally {
        // 关闭弹窗
        closeFeeModal();
    }
});

/**
 * 初始化表单事件
 */
function initFormEvents() {
    console.log('初始化表单事件');
    // 表单事件已经通过addEventListener绑定
}