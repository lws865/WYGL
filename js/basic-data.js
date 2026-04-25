let currentDeleteId = null;
let currentDeleteType = null;

window.addEventListener('load', async function() {
    if (!checkLogin()) return;
    await loadAllFees();
    initFormEvents();
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
    await loadFeesByType('property', 'propertyTableBody');
    await loadFeesByType('sanitation', 'sanitationTableBody');
    await loadFeesByType('car', 'carTableBody');
    await loadFeesByType('motorcycle', 'motorcycleTableBody');
    await loadFeesByType('other', 'otherTableBody');
    await loadPropertyManagementItems();
    await loadElevatorManagementItems();
}

async function loadElevatorManagementItems() {
    try {
        const result = await apiGet('/elevator-management-items');
        const tableBody = document.getElementById('elevatorManagementItemsTableBody');
        
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
    }
}

async function loadPropertyManagementItems() {
    try {
        const result = await apiGet('/property-management-items');
        const tableBody = document.getElementById('propertyManagementItemsTableBody');
        
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
    }
}

async function loadFeesByType(type, tableBodyId) {
    let result;
    
    result = await getFees(type);
    
    const tableBody = document.getElementById(tableBodyId);

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
                <div class="table-cell">${fee.amount.toFixed(2)}</div>
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

    document.getElementById('feeModalTitle').textContent = id ? `编辑${titles[type]}` : `添加${titles[type]}`;
    document.getElementById('feeModal').style.display = 'flex';
    document.getElementById('feeModal').classList.add('show');
}

function closeFeeModal() {
    document.getElementById('feeModal').style.display = 'none';
    document.getElementById('feeModal').classList.remove('show');
}

function editFee(type, id, description, amount) {
    openFeeModal(type, id, description, amount);
}

function deleteFee(type, id) {
    currentDeleteId = id;
    currentDeleteType = type;
    document.getElementById('deleteMessage').textContent = '确定要删除此费用吗？此操作不可恢复。';
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.getElementById('deleteModal').classList.remove('show');
    currentDeleteId = null;
    currentDeleteType = null;
}

async function confirmDelete() {
    if (!currentDeleteId || !currentDeleteType) return;

    const result = await apiDeleteFee(currentDeleteType, currentDeleteId);

    if (result.success) {
        closeDeleteModal();
        await loadAllFees();
        alert('删除成功！');
    } else {
        alert('删除失败：' + (result.message || '未知错误'));
    }
}

function initFormEvents() {
    const feeForm = document.getElementById('feeForm');
    if (feeForm) {
        feeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveFee();
        });
    }
}

async function saveFee() {
    const type = document.getElementById('feeType').value;
    const id = document.getElementById('feeId').value;
    const description = document.getElementById('feeDescription').value.trim();
    const amount = parseFloat(document.getElementById('feeAmount').value);

    if (!description || isNaN(amount)) {
        alert('请填写完整的费用信息');
        return;
    }

    let result;
    if (id) {
        result = await updateFee(type, parseInt(id), description, amount);
    } else {
        result = await addFee(type, description, amount);
    }

    if (result.success) {
        closeFeeModal();
        await loadAllFees();
        alert(id ? '更新成功！' : '添加成功！');
    } else {
        alert((id ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
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

    modal.classList.add('show');
}

function closePropertyManagementItemModal() {
    const modal = document.getElementById('propertyManagementItemModal');
    modal.classList.remove('show');
    currentPropertyManagementItemId = null;
}

function editPropertyManagementItem(id, description) {
    openPropertyManagementItemModal(id, description);
}

async function deletePropertyManagementItem(id) {
    if (!confirm('确定要删除此物业管理费项目吗？此操作不可恢复。')) {
        return;
    }

    try {
        const result = await apiDelete(`/property-management-items/${id}`);
        if (result.success) {
            await loadPropertyManagementItems();
            alert('删除成功！');
        } else {
            alert('删除失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert('删除失败：' + err.message);
    }
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
            closePropertyManagementItemModal();
            await loadPropertyManagementItems();
            alert(currentPropertyManagementItemId ? '更新成功！' : '添加成功！');
        } else {
            alert((currentPropertyManagementItemId ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert((currentPropertyManagementItemId ? '更新' : '添加') + '失败：' + err.message);
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

    modal.classList.add('show');
}

function closeElevatorManagementItemModal() {
    const modal = document.getElementById('elevatorManagementItemModal');
    modal.classList.remove('show');
    currentElevatorManagementItemId = null;
}

function editElevatorManagementItem(id, description, amount) {
    openElevatorManagementItemModal(id, description, amount);
}

async function deleteElevatorManagementItem(id) {
    if (!confirm('确定要删除此电梯管理费项目吗？此操作不可恢复。')) {
        return;
    }

    try {
        const result = await apiDelete(`/elevator-management-items/${id}`);
        if (result.success) {
            await loadElevatorManagementItems();
            alert('删除成功！');
        } else {
            alert('删除失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert('删除失败：' + err.message);
    }
}

document.getElementById('elevatorManagementItemForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const description = document.getElementById('elevatorManagementItemDescription').value.trim();
    const amount = document.getElementById('elevatorManagementItemAmount').value.trim();
    
    if (!description) {
        alert('请填写描述');
        return;
    }
    
    if (!amount || isNaN(parseFloat(amount))) {
        alert('请填写有效金额');
        return;
    }

    try {
        let result;
        if (currentElevatorManagementItemId) {
            result = await apiPut(`/elevator-management-items/${currentElevatorManagementItemId}`, { description, amount: parseFloat(amount) });
        } else {
            result = await apiPost('/elevator-management-items', { description, amount: parseFloat(amount) });
        }

        if (result.success) {
            closeElevatorManagementItemModal();
            await loadElevatorManagementItems();
            alert(currentElevatorManagementItemId ? '更新成功！' : '添加成功！');
        } else {
            alert((currentElevatorManagementItemId ? '更新' : '添加') + '失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert((currentElevatorManagementItemId ? '更新' : '添加') + '失败：' + err.message);
    }
});