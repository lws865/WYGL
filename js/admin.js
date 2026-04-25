// 页面加载完成后初始化
window.addEventListener('load', async function() {
    await loadAdminList();
    handleAdminForm();
    initModalEvents();
});

// 加载管理员列表
async function loadAdminList() {
    const result = await getAdmins();
    const tableBody = document.getElementById('adminTableBody');

    if (!result.success || result.data.length === 0) {
        tableBody.innerHTML = '<div class="table-row"><div class="table-cell" colspan="5">暂无管理员数据</div></div>';
        return;
    }

    tableBody.innerHTML = result.data.map(admin => `
        <div class="table-row">
            <div class="table-cell">${admin.id}</div>
            <div class="table-cell">${admin.username}</div>
            <div class="table-cell">${admin.role}</div>
            <div class="table-cell">${admin.createTime}</div>
            <div class="table-cell">
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editAdmin(${admin.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="deleteAdmin(${admin.id})">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 添加管理员
async function addAdmin(username, password, role) {
    const result = await apiPost('/admins', {
        username,
        password,
        role,
        createTime: new Date().toISOString()
    });

    if (result.success) {
        await loadAdminList();
        return true;
    } else {
        alert('添加失败：' + (result.message || '未知错误'));
        return false;
    }
}

// 编辑管理员
async function editAdmin(id) {
    const result = await getAdmins();
    if (result.success) {
        const admin = result.data.find(a => a.id == id);
        if (admin) {
            document.getElementById('adminId').value = admin.id;
            document.getElementById('username').value = admin.username;
            document.getElementById('password').value = admin.password;
            document.getElementById('role').value = admin.role;
            document.getElementById('modalTitle').textContent = '编辑管理员';

            document.getElementById('adminModal').style.display = 'block';
        }
    } else {
        alert('获取管理员信息失败');
    }
}

// 更新管理员
async function updateAdmin(id, username, password, role) {
    const result = await apiUpdateAdmin(id, {
        username,
        password,
        role
    });

    if (result.success) {
        await loadAdminList();
        return true;
    } else {
        alert('更新失败：' + (result.message || '未知错误'));
        return false;
    }
}

// 删除管理员
async function deleteAdmin(id) {
    const result = await getAdmins();
    if (result.success && result.data.length <= 1) {
        alert('至少需要保留一个管理员账号');
        return;
    }

    currentDeleteId = id;
    document.getElementById('deleteModal').style.display = 'block';
}

// 确认删除
async function confirmDeleteAdmin() {
    if (currentDeleteId) {
        const result = await apiDeleteAdmin(currentDeleteId);
        if (result.success) {
            await loadAdminList();
            closeDeleteModal();
        } else {
            alert('删除失败：' + (result.message || '未知错误'));
        }
    }
}

let currentDeleteId = null;

// 关闭删除确认对话框
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteId = null;
}

// 打开添加管理员对话框
function openAddModal() {
    document.getElementById('adminId').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('role').value = '超级管理员';
    document.getElementById('modalTitle').textContent = '添加管理员';
    document.getElementById('adminModal').style.display = 'block';
}

// 关闭管理员对话框
function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('adminForm').reset();
}

// 处理管理员表单提交
function handleAdminForm() {
    const adminForm = document.getElementById('adminForm');

    if (adminForm) {
        adminForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const adminId = document.getElementById('adminId').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            let success;
            if (adminId) {
                success = await updateAdminData(adminId, username, password, role);
            } else {
                success = await addAdmin(username, password, role);
            }

            if (success) {
                closeAdminModal();
            }
        });
    }
}

// 更新管理员数据（避免与API函数名冲突）
async function updateAdminData(id, username, password, role) {
    const result = await apiUpdateAdmin(id, {
        username,
        password,
        role
    });

    if (result.success) {
        await loadAdminList();
        return true;
    } else {
        alert('更新失败：' + (result.message || '未知错误'));
        return false;
    }
}

// 初始化模态框事件
function initModalEvents() {
    const addAdminBtn = document.getElementById('addAdminBtn');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', openAddModal);
    }

    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAdminModal);
    }

    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    }

    const cancelDeleteBtn = document.getElementById('cancelDelete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteAdmin);
    }
}