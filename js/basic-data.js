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
    await loadFeesByType('water', 'waterTableBody');
    await loadFeesByType('other', 'otherTableBody');
}

async function loadFeesByType(type, tableBodyId) {
    const result = await getFees(type);
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
        'water': '水电费',
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