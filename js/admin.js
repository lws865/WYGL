/**
 * 管理员管理页面业务逻辑
 * 负责管理员账号的增删改查操作
 */

/**
 * 当前删除操作的管理员ID（用于确认删除）
 */
let currentDeleteId = null;

/**
 * 页面加载完成后执行初始化操作
 */
window.addEventListener('load', async function() {
    // 加载管理员列表
    await loadAdminList();
    // 初始化表单事件处理
    handleAdminForm();
    // 初始化模态框事件
    initModalEvents();
});

/**
 * 加载管理员列表
 * 从API获取管理员数据并渲染到页面表格中
 */
async function loadAdminList() {
    // 调用API获取管理员列表
    const result = await getAdmins();
    // 获取表格容器
    const tableBody = document.getElementById('adminTableBody');

    // 检查API返回结果
    if (!result.success || result.data.length === 0) {
        // 没有数据时显示提示
        tableBody.innerHTML = '<div class="table-row"><div class="table-cell" colspan="5">暂无管理员数据</div></div>';
        return;
    }

    // 渲染管理员列表到表格
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

/**
 * 添加管理员
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} role - 角色
 * @returns {boolean} - 添加是否成功
 */
async function addAdmin(username, password, role) {
    // 调用API添加管理员
    const result = await apiPost('/admins', {
        username,
        password,
        role,
        createTime: new Date().toISOString()  // 创建时间
    });

    // 检查添加结果
    if (result.success) {
        // 添加成功，重新加载列表
        await loadAdminList();
        return true;
    } else {
        // 添加失败，显示错误信息
        alert('添加失败：' + (result.message || '未知错误'));
        return false;
    }
}

/**
 * 编辑管理员
 * @param {number} id - 管理员ID
 */
async function editAdmin(id) {
    // 获取管理员列表
    const result = await getAdmins();
    
    if (result.success) {
        // 查找指定ID的管理员
        const admin = result.data.find(a => a.id == id);
        
        if (admin) {
            // 填充表单数据
            document.getElementById('adminId').value = admin.id;
            document.getElementById('username').value = admin.username;
            document.getElementById('password').value = admin.password;
            document.getElementById('role').value = admin.role;
            // 设置模态框标题
            document.getElementById('modalTitle').textContent = '编辑管理员';

            // 显示模态框
            document.getElementById('adminModal').style.display = 'block';
        }
    } else {
        // 获取管理员信息失败
        alert('获取管理员信息失败');
    }
}

/**
 * 更新管理员信息
 * @param {number} id - 管理员ID
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} role - 角色
 * @returns {boolean} - 更新是否成功
 */
async function updateAdmin(id, username, password, role) {
    // 调用API更新管理员信息
    const result = await apiUpdateAdmin(id, {
        username,
        password,
        role
    });

    // 检查更新结果
    if (result.success) {
        // 更新成功，重新加载列表
        await loadAdminList();
        return true;
    } else {
        // 更新失败，显示错误信息
        alert('更新失败：' + (result.message || '未知错误'));
        return false;
    }
}

/**
 * 删除管理员
 * @param {number} id - 管理员ID
 */
async function deleteAdmin(id) {
    // 获取管理员列表检查数量
    const result = await getAdmins();
    
    // 确保至少保留一个管理员账号
    if (result.success && result.data.length <= 1) {
        alert('至少需要保留一个管理员账号');
        return;
    }

    // 保存当前删除的管理员ID
    currentDeleteId = id;
    // 显示删除确认对话框
    document.getElementById('deleteModal').style.display = 'block';
}

/**
 * 确认删除管理员
 */
async function confirmDeleteAdmin() {
    // 检查是否有要删除的管理员ID
    if (currentDeleteId) {
        // 调用API删除管理员
        const result = await apiDeleteAdmin(currentDeleteId);
        
        if (result.success) {
            // 删除成功，重新加载列表
            await loadAdminList();
            // 关闭删除确认对话框
            closeDeleteModal();
        } else {
            // 删除失败，显示错误信息
            alert('删除失败：' + (result.message || '未知错误'));
        }
    }
}

/**
 * 关闭删除确认对话框
 */
function closeDeleteModal() {
    // 隐藏对话框
    document.getElementById('deleteModal').style.display = 'none';
    // 重置当前删除ID
    currentDeleteId = null;
}

/**
 * 打开添加管理员对话框
 */
function openAddModal() {
    // 清空表单数据
    document.getElementById('adminId').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('role').value = '超级管理员';
    // 设置对话框标题
    document.getElementById('modalTitle').textContent = '添加管理员';
    // 显示对话框
    document.getElementById('adminModal').style.display = 'block';
}

/**
 * 关闭管理员对话框
 */
function closeAdminModal() {
    // 隐藏对话框
    document.getElementById('adminModal').style.display = 'none';
    // 重置表单
    document.getElementById('adminForm').reset();
}

/**
 * 处理管理员表单提交
 */
function handleAdminForm() {
    // 获取表单元素
    const adminForm = document.getElementById('adminForm');

    if (adminForm) {
        // 绑定表单提交事件
        adminForm.addEventListener('submit', async function(e) {
            // 阻止默认提交行为
            e.preventDefault();

            // 获取表单数据
            const adminId = document.getElementById('adminId').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            // 根据是否有ID判断是添加还是更新
            let success;
            if (adminId) {
                success = await updateAdminData(adminId, username, password, role);
            } else {
                success = await addAdmin(username, password, role);
            }

            // 如果操作成功，关闭对话框
            if (success) {
                closeAdminModal();
            }
        });
    }
}

/**
 * 更新管理员数据（避免与API函数名冲突）
 * @param {number} id - 管理员ID
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} role - 角色
 * @returns {boolean} - 更新是否成功
 */
async function updateAdminData(id, username, password, role) {
    // 调用API更新管理员信息
    const result = await apiUpdateAdmin(id, {
        username,
        password,
        role
    });

    // 检查更新结果
    if (result.success) {
        // 更新成功，重新加载列表
        await loadAdminList();
        return true;
    } else {
        // 更新失败，显示错误信息
        alert('更新失败：' + (result.message || '未知错误'));
        return false;
    }
}

/**
 * 初始化模态框事件
 */
function initModalEvents() {
    // 添加管理员按钮
    const addAdminBtn = document.getElementById('addAdminBtn');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', openAddModal);
    }

    // 关闭管理员对话框按钮
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAdminModal);
    }

    // 关闭删除确认对话框按钮
    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    }

    // 取消删除按钮
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    // 确认删除按钮
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteAdmin);
    }
}