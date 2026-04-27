let currentDeleteId = null;
let currentDeleteType = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM内容加载完成，开始初始化基础数据页面');
    if (!checkLogin()) {
        console.log('未登录，跳转到登录页面');
        return;
    }
    console.log('登录状态验证通过，开始加载数据');
    await loadAllFees();
    console.log('数据加载完成，初始化表单事件');
    initFormEvents();
});

document.addEventListener('visibilitychange', async function() {
    if (document.visibilityState === 'visible') {
        console.log('页面重新获得焦点，重新加载数据');
        await loadAllFees();
    }
});

function checkLogin() {
    const currentUser = localStorage.getItem('user');
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

async function loadAllFees() {
    try {
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

async function loadElevatorManagementItems() {
    try {
        console.log('请求电梯管理费项目数据');
        const result = await apiGet('/elevator-management-items');
        console.log('电梯管理费项目数据:', result);
        const tableBody = document.getElementById('elevatorManagementItemsTableBody');
        console.log('电梯管理费项目表格容器:', tableBody);
        
        if (result.success && result.data.length > 0) {
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

async function loadPropertyManagementItems() {
    try {
        console.log('请求物业管理费项目数据');
        const result = await apiGet('/property-management-items');
        console.log('物业管理费项目数据:', result);
        const tableBody = document.getElementById('propertyManagementItemsTableBody');
        console.log('物业管理费项目表格容器:', tableBody);
        
        if (result.success && result.data.length > 0) {
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

async function loadFeesByType(type, tableBodyId) {
    try {
        console.log(`请求${type}费用数据`);
        const result = await getFees(type);
        console.log(`${type}费用数据:`, result);
        const tableBody = document.getElementById(tableBodyId);
        console.log(`${type}费用表格容器:`, tableBody);

        if (result.success) {
            const fees = result.data;

            if (fees.length === 0) {
                tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">暂无数据</div></div>';
                return;
            }

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

function openFeeModal(type, id = null, description = '', amount = '') {
    document.getElementById('feeType').value = type;
    document.getElementById('feeId').value = id || '';
    document.getElementById('feeDescription').value = description;
    document.getElementById('feeAmount').value = amount;

    const titles = {
        'property': '物业管理费',
        'sanitation': '卫生费',
        'car': '汽车停车费',
        'motorcycle': '摩托车停车费',
        'property_management': '物业管理费项目',
        'other': '其他费用'
    };

    document.getElementById('feeModalTitle').textContent = (id ? '编辑' : '添加') + titles[type];
    document.getElementById('feeModal').style.display = 'flex';
}

function closeFeeModal() {
    document.getElementById('feeModal').style.display = 'none';
}

function openDeleteModal(type, id, name) {
    currentDeleteId = id;
    currentDeleteType = type;
    document.getElementById('deleteMessage').textContent = `确定要删除"${name}"吗？此操作不可恢复。`;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDelete() {
    if (!currentDeleteType || !currentDeleteId) return;

    try {
        let result;
        if (currentDeleteType === 'property_management') {
            result = await apiDelete(`/property-management-items/${currentDeleteId}`);
        } else if (currentDeleteType === 'elevator_management') {
            result = await apiDelete(`/elevator-management-items/${currentDeleteId}`);
        } else {
            result = await apiDelete(`/fees/${currentDeleteType}/${currentDeleteId}`);
        }

        if (result.success) {
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
        closeDeleteModal();
    }
}

// 物业管理费项目管理函数
let currentPropertyManagementItemId = null;

function openPropertyManagementItemModal(id, description) {
    currentPropertyManagementItemId = id;
    const modal = document.getElementById('propertyManagementItemModal');
    const title = document.getElementById('propertyManagementItemModalTitle');
    const descInput = document.getElementById('propertyManagementItemDescription');

    if (id) {
        title.textContent = '编辑物业管理费项目';
        descInput.value = description;
    } else {
        title.textContent = '添加物业管理费项目';
        descInput.value = '';
    }

    modal.style.display = 'flex';
}

function closePropertyManagementItemModal() {
    document.getElementById('propertyManagementItemModal').style.display = 'none';
}

function editPropertyManagementItem(id, description) {
    openPropertyManagementItemModal(id, description);
}

function deletePropertyManagementItem(id) {
    openDeleteModal('property_management', id, '物业管理费项目');
}

document.getElementById('propertyManagementItemForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const description = document.getElementById('propertyManagementItemDescription').value.trim();
    if (!description) {
        alert('请填写描述');
        return;
    }

    try {
        let result;
        if (currentPropertyManagementItemId) {
            result = await apiPut(`/property-management-items/${currentPropertyManagementItemId}`, { description });
        } else {
            result = await apiPost('/property-management-items', { description });
        }

        if (result.success) {
            await loadPropertyManagementItems();
            alert(currentPropertyManagementItemId ? '更新成功！' : '添加成功！');
        } else {
            alert((currentPropertyManagementItemId ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert((currentPropertyManagementItemId ? '更新' : '添加') + '失败：' + err.message);
    } finally {
        closePropertyManagementItemModal();
    }
});

// 电梯管理费项目管理函数
let currentElevatorManagementItemId = null;

function openElevatorManagementItemModal(id, description, amount) {
    currentElevatorManagementItemId = id;
    const modal = document.getElementById('elevatorManagementItemModal');
    const title = document.getElementById('elevatorManagementItemModalTitle');
    const descInput = document.getElementById('elevatorManagementItemDescription');
    const amountInput = document.getElementById('elevatorManagementItemAmount');

    if (id) {
        title.textContent = '编辑电梯管理费项目';
        descInput.value = description;
        amountInput.value = amount;
    } else {
        title.textContent = '添加电梯管理费项目';
        descInput.value = '';
        amountInput.value = '';
    }

    modal.style.display = 'flex';
}

function closeElevatorManagementItemModal() {
    document.getElementById('elevatorManagementItemModal').style.display = 'none';
}

function editElevatorManagementItem(id, description, amount) {
    openElevatorManagementItemModal(id, description, amount);
}

function deleteElevatorManagementItem(id) {
    openDeleteModal('elevator_management', id, '电梯管理费项目');
}

document.getElementById('elevatorManagementItemForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const description = document.getElementById('elevatorManagementItemDescription').value.trim();
    const amount = parseFloat(document.getElementById('elevatorManagementItemAmount').value);

    if (!description) {
        alert('请填写描述');
        return;
    }

    if (isNaN(amount) || amount < 0) {
        alert('请输入有效的金额');
        return;
    }

    try {
        let result;
        if (currentElevatorManagementItemId) {
            result = await apiPut(`/elevator-management-items/${currentElevatorManagementItemId}`, { description, amount });
        } else {
            result = await apiPost('/elevator-management-items', { description, amount });
        }

        if (result.success) {
            await loadElevatorManagementItems();
            alert(currentElevatorManagementItemId ? '更新成功！' : '添加成功！');
        } else {
            alert((currentElevatorManagementItemId ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert((currentElevatorManagementItemId ? '更新' : '添加') + '失败：' + err.message);
    } finally {
        closeElevatorManagementItemModal();
    }
});

function editFee(type, id, description, amount) {
    openFeeModal(type, id, description, amount);
}

function deleteFee(type, id) {
    openDeleteModal(type, id, '费用');
}

document.getElementById('feeForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const type = document.getElementById('feeType').value;
    const id = document.getElementById('feeId').value;
    const description = document.getElementById('feeDescription').value.trim();
    const amount = parseFloat(document.getElementById('feeAmount').value);

    if (!description) {
        alert('请填写描述');
        return;
    }

    if (isNaN(amount) || amount < 0) {
        alert('请输入有效的金额');
        return;
    }

    try {
        let result;
        if (id) {
            result = await updateFee(type, id, description, amount);
        } else {
            result = await addFee(type, description, amount);
        }

        if (result.success) {
            await loadFeesByType(type, `${type}TableBody`);
            alert(id ? '更新成功！' : '添加成功！');
        } else {
            alert((id ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert((id ? '更新' : '添加') + '失败：' + err.message);
    } finally {
        closeFeeModal();
    }
});

function initFormEvents() {
    console.log('初始化表单事件');
    // 表单事件已经通过addEventListener绑定
}