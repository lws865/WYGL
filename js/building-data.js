/**
 * 楼栋数据管理页面业务逻辑
 * 负责楼号、梯号、层号、房号的增删改查操作
 */

// 当前删除操作的ID和类型（用于确认删除）
let currentDeleteId = null;
let currentDeleteType = null;

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
 * 页面加载完成后执行初始化操作
 */
window.addEventListener('load', async function() {
    // 检查登录状态
    if (!checkLogin()) return;

    // 不需要初始化本地数据库，直接使用API
    await loadAllData();
    initFormEvents();

    // 初始化所有展开/收缩图标
    document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▼';
    });
});

/**
 * 初始化表单事件处理
 */
function initFormEvents() {
    // 楼号表单提交事件
    const buildingForm = document.getElementById('buildingForm');
    if (buildingForm) {
        buildingForm.addEventListener('submit', function(e) {
            // 阻止表单默认提交行为
            e.preventDefault();
            // 获取楼号ID，判断是添加还是更新
            const buildingId = document.getElementById('buildingId').value;
            if (buildingId) {
                updateBuildingLocal();
            } else {
                saveBuilding();
            }
        });
    }

    // 梯号表单提交事件
    const stairForm = document.getElementById('stairForm');
    if (stairForm) {
        stairForm.addEventListener('submit', function(e) {
            // 阻止表单默认提交行为
            e.preventDefault();
            // 获取梯号ID，判断是添加还是更新
            const stairId = document.getElementById('stairId').value;
            if (stairId) {
                updateStairLocal();
            } else {
                saveStair();
            }
        });
    }

    // 层号表单提交事件
    const floorForm = document.getElementById('floorForm');
    if (floorForm) {
        floorForm.addEventListener('submit', function(e) {
            // 阻止表单默认提交行为
            e.preventDefault();
            // 获取层号ID，判断是添加还是更新
            const floorId = document.getElementById('floorId').value;
            if (floorId) {
                updateFloor();
            } else {
                saveFloor();
            }
        });
    }

    // 房号表单提交事件
    const roomForm = document.getElementById('roomForm');
    if (roomForm) {
        roomForm.addEventListener('submit', function(e) {
            // 阻止表单默认提交行为
            e.preventDefault();
            // 获取房号ID，判断是添加还是更新
            const roomId = document.getElementById('roomId').value;
            if (roomId) {
                updateRoom();
            } else {
                saveRoom();
            }
        });
    }

    // 退出按钮点击事件
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // 确认用户是否确定退出
            if (confirm('确定要退出系统吗？')) {
                logout();
            }
        });
    }

    // 层号模态框梯号选择变化事件
    const floorStairId = document.getElementById('floorStairId');
    if (floorStairId) {
        floorStairId.addEventListener('change', function() {
            // 当选择梯号时，清空层号输入框
            document.getElementById('floorNumber').value = '';
        });
    }

    // 房号模态框层号选择变化事件
    const roomFloorId = document.getElementById('roomFloorId');
    if (roomFloorId) {
        roomFloorId.addEventListener('change', function() {
            // 当选择层号时，可以在这里添加加载房号的逻辑
            // 但根据现有代码结构，房号是手动输入的，不是从下拉列表选择
        });
    }
}

/**
 * 加载所有数据
 */
async function loadAllData() {
    // 依次加载各类数据
    await loadBuildingData();
    await loadStairData();
    await loadFloorData();
    await loadRoomData();
    await updateBuildingFilters();
    await loadBuildingSelect();
    await loadStairSelect(); // 更新所有梯号选择下拉框
    await loadFloorSelect();
}

/**
 * 更新楼号筛选器（用于梯号、层号、房号筛选）
 */
async function updateBuildingFilters() {
    // 调用API获取所有楼栋数据
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    
    // 需要更新的筛选器ID列表
    const filters = ['stairBuildingFilter', 'floorBuildingFilter', 'roomBuildingFilter'];

    // 遍历所有筛选器，更新其选项
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            // 保存当前选中值
            const currentValue = filter.value;
            // 清空并添加默认选项
            filter.innerHTML = '<option value="">选择楼号</option>';
            // 添加所有楼栋选项
            buildings.forEach(building => {
                filter.innerHTML += `<option value="${building.id}">${building.number}</option>`;
            });
            // 恢复之前的选中值
            filter.value = currentValue;
        }
    });
}

/**
 * 加载楼号数据
 */
async function loadBuildingData() {
    // 使用API获取楼号数据
    const result = await getBuildings();
    
    if (result.success) {
        const buildings = result.data;
        const tableBody = document.getElementById('buildingTableBody');

        // 如果没有数据，显示提示信息
        if (buildings.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">暂无数据</div></div>';
            return;
        }

        // 渲染楼号列表到表格
        tableBody.innerHTML = buildings.map(building => `
            <div class="table-row">
                <div class="table-cell">${building.id}</div>
                <div class="table-cell">${building.number}</div>
                <div class="table-cell">${building.floorCount || '-'}</div>
                <div class="table-cell">
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editBuilding(${building.id})">编辑</button>
                        <button class="action-btn delete-btn" onclick="deleteBuildingLocal(${building.id})">删除</button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        // API调用失败，输出错误日志
        console.error('加载楼号数据失败:', result.message);
    }
}

/**
 * 加载梯号数据
 */
async function loadStairData() {
    // 获取楼号筛选条件
    const buildingId = document.getElementById('stairBuildingFilter').value;
    
    // 使用API获取梯号数据
    const result = await getStairs(buildingId);
    
    if (result.success) {
        const stairs = result.data;
        const tableBody = document.getElementById('stairTableBody');

        // 如果没有数据，显示提示信息
        if (stairs.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">暂无数据</div></div>';
            return;
        }

        // 预加载所有楼栋数据，用于显示楼栋名称
        const buildingsResult = await getBuildings();
        const buildingsMap = {};
        if (buildingsResult.success) {
            buildingsResult.data.forEach(building => {
                buildingsMap[building.id] = building;
            });
        }

        // 渲染梯号列表到表格
        tableBody.innerHTML = stairs.map(stair => {
            const building = buildingsMap[stair.buildingId];
            return `
            <div class="table-row">
                <div class="table-cell">${stair.id}</div>
                <div class="table-cell">${building ? building.number : '-'}</div>
                <div class="table-cell">${stair.number}</div>
                <div class="table-cell">
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editStair(${stair.id})">编辑</button>
                        <button class="action-btn delete-btn" onclick="deleteStairLocal(${stair.id})">删除</button>
                    </div>
                </div>
            </div>
        `}).join('');
    } else {
        // API调用失败，输出错误日志
        console.error('加载梯号数据失败:', result.message);
    }
}

/**
 * 加载楼层筛选的楼号和梯号选择框
 */
async function loadFloorBuildingStairSelect() {
    // 获取楼号筛选条件
    const buildingId = document.getElementById('floorBuildingFilter').value;
    const stairSelect = document.getElementById('floorStairFilter');
    
    // 清空梯号选择框并添加默认选项
    stairSelect.innerHTML = '<option value="">选择梯号</option>';

    // 如果选择了楼号
    if (buildingId) {
        // 获取该楼号下的所有梯号
        const result = await getStairs(buildingId);
        if (result.success) {
            // 获取对应楼号信息
            const buildingsResult = await getBuildings();
            const buildingMap = {};
            if (buildingsResult.success) {
                buildingsResult.data.forEach(building => {
                    buildingMap[building.id] = building;
                });
            }
            
            // 添加梯号选项
            result.data.forEach(stair => {
                const building = buildingMap[stair.buildingId];
                const buildingInfo = building ? building.number + ' ' : '';
                stairSelect.innerHTML += `<option value="${stair.id}">${buildingInfo}${stair.number}</option>`;
            });
        }
    }
    
    // 根据筛选条件重新加载楼层数据
    loadFloorData();
}

/**
 * 加载层号数据
 */
async function loadFloorData() {
    // 获取筛选条件
    const buildingId = document.getElementById('floorBuildingFilter').value;
    const stairId = document.getElementById('floorStairFilter').value;
    
    // 使用API获取所有层号，然后在前端根据楼号和梯号筛选
    const result = await getFloors();
    
    if (result.success) {
        let floors = result.data;
        
        // 如果选择了楼号，先筛选属于该楼号的梯号对应的层号
        if (buildingId) {
            const stairsResult = await getStairs(buildingId);
            if (stairsResult.success) {
                const buildingStairIds = stairsResult.data.map(s => s.id);
                floors = floors.filter(f => buildingStairIds.includes(f.stairId));
            }
        }
        
        // 如果选择了梯号，再筛选属于该梯号的层号
        if (stairId) {
            floors = floors.filter(f => f.stairId == stairId);
        }
        
        const tableBody = document.getElementById('floorTableBody');

        // 如果没有数据，显示提示信息
        if (floors.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:5">暂无数据</div></div>';
            return;
        }

        // 预加载所有楼栋和梯号数据，用于显示名称
        const buildingsResult = await getBuildings();
        const stairsResult = await getStairs();
        const buildingsMap = {};
        const stairsMap = {};
        
        if (buildingsResult.success) {
            buildingsResult.data.forEach(building => {
                buildingsMap[building.id] = building;
            });
        }
        
        if (stairsResult.success) {
            stairsResult.data.forEach(stair => {
                stairsMap[stair.id] = stair;
            });
        }

        // 渲染层号列表到表格
        tableBody.innerHTML = floors.map(floor => {
            const stair = stairsMap[floor.stairId];
            const building = stair ? buildingsMap[stair.buildingId] : null;
            return `
            <div class="table-row">
                <div class="table-cell">${floor.id}</div>
                <div class="table-cell">${building ? building.number : '-'}</div>
                <div class="table-cell">${stair ? stair.number : '-'}</div>
                <div class="table-cell">${floor.floorNumber}层</div>
                <div class="table-cell">
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editFloor(${floor.id})">编辑</button>
                        <button class="action-btn delete-btn" onclick="deleteFloorLocal(${floor.id})">删除</button>
                    </div>
                </div>
            </div>
        `}).join('');
    } else {
        // API调用失败，输出错误日志
        console.error('加载层号数据失败:', result.message);
    }
}

/**
 * 加载房间筛选的楼号选择框
 */
async function loadRoomBuildingStairSelect() {
    // 获取楼号筛选条件
    const buildingId = document.getElementById('roomBuildingFilter').value;
    const stairSelect = document.getElementById('roomStairFilter');
    
    // 清空梯号和层号选择框
    stairSelect.innerHTML = '<option value="">选择梯号</option>';
    document.getElementById('roomFloorFilter').innerHTML = '<option value="">选择层号</option>';

    // 如果选择了楼号
    if (buildingId) {
        // 获取该楼号下的所有梯号
        const result = await getStairs(buildingId);
        if (result.success) {
            // 获取对应楼号信息
            const buildingsResult = await getBuildings();
            const buildingMap = {};
            if (buildingsResult.success) {
                buildingsResult.data.forEach(building => {
                    buildingMap[building.id] = building;
                });
            }
            
            // 添加梯号选项
            result.data.forEach(stair => {
                const building = buildingMap[stair.buildingId];
                const buildingInfo = building ? building.number + ' ' : '';
                stairSelect.innerHTML += `<option value="${stair.id}">${buildingInfo}${stair.number}</option>`;
            });
        }
    }
    
    // 根据筛选条件重新加载房号数据
    loadRoomData();
}

/**
 * 加载房间筛选的梯号和层号选择框
 */
async function loadRoomStairFloorSelect() {
    // 获取梯号筛选条件
    const stairId = document.getElementById('roomStairFilter').value;
    const floorSelect = document.getElementById('roomFloorFilter');
    
    // 清空层号选择框
    floorSelect.innerHTML = '<option value="">选择层号</option>';

    // 如果选择了梯号
    if (stairId) {
        // 获取该梯号下的所有层号
        const result = await getFloors(stairId);
        if (result.success) {
            // 获取对应梯号和楼号信息
            const stairsResult = await getStairs();
            const buildingsResult = await getBuildings();
            const stairMap = {};
            const buildingMap = {};
            
            if (stairsResult.success) {
                stairsResult.data.forEach(stair => {
                    stairMap[stair.id] = stair;
                });
            }
            
            if (buildingsResult.success) {
                buildingsResult.data.forEach(building => {
                    buildingMap[building.id] = building;
                });
            }
            
            // 添加层号选项（按层号排序）
            result.data.sort((a, b) => a.floorNumber - b.floorNumber).forEach(floor => {
                const stair = stairMap[floor.stairId];
                const building = stair ? buildingMap[stair.buildingId] : null;
                const buildingInfo = building ? building.number + ' ' : '';
                const stairInfo = stair ? stair.number + ' ' : '';
                floorSelect.innerHTML += `<option value="${floor.id}">${buildingInfo}${stairInfo}${floor.floorNumber}层</option>`;
            });
        }
    }
    
    // 根据筛选条件重新加载房号数据
    loadRoomData();
}

/**
 * 加载房号数据
 */
async function loadRoomData() {
    // 获取筛选条件
    const buildingId = document.getElementById('roomBuildingFilter').value;
    const stairId = document.getElementById('roomStairFilter').value;
    const floorId = document.getElementById('roomFloorFilter').value;
    
    // 使用API获取所有房号，然后在前端根据楼号、梯号和层号筛选
    const result = await getRooms();
    
    if (result.success) {
        let rooms = result.data;
        
        // 如果选择了楼号，筛选属于该楼号的房号
        if (buildingId) {
            rooms = rooms.filter(r => String(r.buildingId) === buildingId);
        }
        
        // 如果选择了梯号，筛选属于该梯号的房号
        if (stairId) {
            rooms = rooms.filter(r => String(r.stairId) === stairId);
        }
        
        // 如果选择了层号，筛选属于该层号的房号
        if (floorId) {
            rooms = rooms.filter(r => String(r.floorId) === floorId);
        }
        
        const tableBody = document.getElementById('roomTableBody');

        // 如果没有数据，显示提示信息
        if (rooms.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:6">暂无数据</div></div>';
            return;
        }

        // 预加载所有楼栋和梯号数据，用于显示名称
        const buildingsResult = await getBuildings();
        const stairsResult = await getStairs();
        const buildingsMap = {};
        const stairsMap = {};
        
        if (buildingsResult.success) {
            buildingsResult.data.forEach(building => {
                buildingsMap[building.id] = building;
            });
        }
        
        if (stairsResult.success) {
            stairsResult.data.forEach(stair => {
                stairsMap[stair.id] = stair;
            });
        }

        // 渲染房号列表到表格
        tableBody.innerHTML = rooms.map(room => {
            const building = buildingsMap[room.buildingId];
            const stair = stairsMap[room.stairId];
            return `
            <div class="table-row">
                <div class="table-cell">${room.id}</div>
                <div class="table-cell">${building ? building.number : '-'}</div>
                <div class="table-cell">${stair ? stair.number : '-'}</div>
                <div class="table-cell">${room.floorNumber}层</div>
                <div class="table-cell">${room.roomNumber}</div>
                <div class="table-cell">
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editRoom(${room.id})">编辑</button>
                        <button class="action-btn delete-btn" onclick="deleteRoomLocal(${room.id})">删除</button>
                    </div>
                </div>
            </div>
        `}).join('');
    } else {
        // API调用失败，输出错误日志
        console.error('加载房号数据失败:', result.message);
    }
}

/**
 * 打开楼号模态框
 */
function openBuildingModal() {
    // 设置模态框标题为添加楼号
    document.getElementById('buildingModalTitle').textContent = '添加楼号';
    // 清空表单数据
    document.getElementById('buildingId').value = '';
    document.getElementById('buildingNumber').value = '';
    document.getElementById('floorCount').value = '';
    // 显示模态框
    document.getElementById('buildingModal').style.display = 'flex';
    document.getElementById('buildingModal').classList.add('show');
}

/**
 * 关闭楼号模态框
 */
function closeBuildingModal() {
    // 隐藏模态框
    document.getElementById('buildingModal').style.display = 'none';
    document.getElementById('buildingModal').classList.remove('show');
}

/**
 * 保存楼号
 */
async function saveBuilding() {
    // 获取表单数据
    const number = document.getElementById('buildingNumber').value.trim();
    const floorCount = parseInt(document.getElementById('floorCount').value) || 0;

    // 验证楼号必填
    if (!number) {
        alert('请输入楼号');
        return;
    }

    console.log('保存楼号:', { number, floorCount });
    
    // 使用API添加楼号
    const result = await addBuilding(number, floorCount);
    
    if (result.success) {
        // 添加成功，关闭模态框并刷新数据
        closeBuildingModal();
        await loadBuildingData();
        await updateBuildingFilters();
        alert('楼号添加成功！');
    } else {
        // 添加失败，显示错误信息
        alert('添加失败：' + (result.message || '未知错误'));
    }
}

/**
 * 编辑楼号
 * @param {number} id - 楼号ID
 */
async function editBuilding(id) {
    // 获取所有楼号数据
    const result = await getBuildings();
    
    if (result.success) {
        // 查找指定ID的楼号
        const building = result.data.find(b => b.id == id);
        
        if (building) {
            // 设置模态框标题为编辑楼号
            document.getElementById('buildingModalTitle').textContent = '编辑楼号';
            // 填充表单数据
            document.getElementById('buildingId').value = id;
            document.getElementById('buildingNumber').value = building.number;
            document.getElementById('floorCount').value = building.floorCount || '';
            // 显示模态框
            document.getElementById('buildingModal').style.display = 'flex';
            document.getElementById('buildingModal').classList.add('show');
        }
    }
}

/**
 * 更新楼号
 */
async function updateBuildingLocal() {
    // 获取表单数据
    const number = document.getElementById('buildingNumber').value.trim();
    const floorCount = parseInt(document.getElementById('floorCount').value) || 0;
    const id = parseInt(document.getElementById('buildingId').value);

    // 验证楼号必填
    if (!number) {
        alert('请输入楼号');
        return;
    }

    // 使用API更新楼号
    const result = await updateBuilding(id, number, floorCount);
    
    if (result.success) {
        // 更新成功，关闭模态框并刷新数据
        closeBuildingModal();
        await loadBuildingData();
        await updateBuildingFilters();
        alert('楼号更新成功！');
    } else {
        // 更新失败，显示错误信息
        alert('更新失败：' + (result.message || '未知错误'));
    }
}

/**
 * 删除楼号
 * @param {number} id - 楼号ID
 */
async function deleteBuildingLocal(id) {
    // 检查该楼号下是否有梯号
    const stairsResult = await getStairs(id);
    
    if (stairsResult.success && stairsResult.data.length > 0) {
        // 存在关联梯号，不允许删除
        alert('无法删除：该楼号下存在 ' + stairsResult.data.length + ' 个梯号，请先删除所有梯号');
        return;
    }
    
    // 保存当前删除信息
    currentDeleteId = id;
    currentDeleteType = 'building';
    
    // 设置删除确认消息
    document.getElementById('deleteMessage').textContent = '确定要删除此楼号吗？此操作不可恢复。';
    // 显示删除确认模态框
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
}

/**
 * 打开梯号模态框
 */
function openStairModal() {
    // 设置模态框标题为添加梯号
    document.getElementById('stairModalTitle').textContent = '添加梯号';
    // 清空表单数据
    document.getElementById('stairId').value = '';
    // 加载楼号选择框
    loadBuildingSelect();
    document.getElementById('stairNumber').value = '';
    // 显示模态框
    document.getElementById('stairModal').style.display = 'flex';
    document.getElementById('stairModal').classList.add('show');
}

/**
 * 加载楼号选择框（用于多个位置）
 */
async function loadBuildingSelect() {
    // 获取所有楼号数据
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    // 需要更新的选择框ID列表
    const selects = ['stairBuildingId', 'stairBuildingFilter'];

    // 遍历所有选择框，更新其选项
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // 保存当前选中值
            const currentValue = select.value;
            // 清空并添加默认选项
            select.innerHTML = '<option value="">选择楼号</option>';
            // 添加所有楼栋选项
            buildings.forEach(building => {
                select.innerHTML += `<option value="${building.id}">${building.number}</option>`;
            });
            // 恢复之前的选中值
            select.value = currentValue;
        }
    });
}

/**
 * 关闭梯号模态框
 */
function closeStairModal() {
    // 隐藏模态框
    document.getElementById('stairModal').style.display = 'none';
    document.getElementById('stairModal').classList.remove('show');
}

/**
 * 保存梯号
 */
async function saveStair() {
    // 获取表单数据
    const buildingId = document.getElementById('stairBuildingId').value;
    const number = document.getElementById('stairNumber').value.trim();

    // 验证必填项
    if (!buildingId || !number) {
        alert('请选择楼号并输入梯号');
        return;
    }

    // 使用API添加梯号
    const result = await addStair(buildingId, number);
    
    if (result.success) {
        // 添加成功，关闭模态框并刷新数据
        closeStairModal();
        await loadStairData();
        alert('梯号添加成功！');
    } else {
        // 添加失败，显示错误信息
        alert('添加失败：' + (result.message || '未知错误'));
    }
}

/**
 * 编辑梯号
 * @param {number} id - 梯号ID
 */
async function editStair(id) {
    // 获取所有梯号数据
    const result = await getStairs();
    
    if (result.success) {
        // 查找指定ID的梯号
        const stair = result.data.find(s => s.id == id);
        
        if (stair) {
            // 设置模态框标题为编辑梯号
            document.getElementById('stairModalTitle').textContent = '编辑梯号';
            // 填充表单数据
            document.getElementById('stairId').value = id;
            // 加载楼号选择框
            await loadBuildingSelect();
            // 延迟设置选中值（等待DOM更新）
            setTimeout(() => {
                document.getElementById('stairBuildingId').value = stair.buildingId;
                document.getElementById('stairNumber').value = stair.number;
            }, 100);
            // 显示模态框
            document.getElementById('stairModal').style.display = 'flex';
            document.getElementById('stairModal').classList.add('show');
        }
    }
}

/**
 * 更新梯号
 */
async function updateStairLocal() {
    // 获取表单数据
    const buildingId = document.getElementById('stairBuildingId').value;
    const number = document.getElementById('stairNumber').value.trim();
    const id = parseInt(document.getElementById('stairId').value);

    // 验证必填项
    if (!buildingId || !number) {
        alert('请选择楼号并输入梯号');
        return;
    }

    // 使用API更新梯号
    const result = await updateStair(id, buildingId, number);
    
    if (result.success) {
        // 更新成功，关闭模态框并刷新数据
        closeStairModal();
        await loadStairData();
        alert('梯号更新成功！');
    } else {
        // 更新失败，显示错误信息
        alert('更新失败：' + (result.message || '未知错误'));
    }
}

/**
 * 删除梯号
 * @param {number} id - 梯号ID
 */
async function deleteStairLocal(id) {
    // 检查该梯号下是否有层号
    const floorsResult = await getFloors(id);
    
    if (floorsResult.success && floorsResult.data.length > 0) {
        // 存在关联层号，不允许删除
        alert('无法删除：该梯号下存在 ' + floorsResult.data.length + ' 个层号，请先删除所有层号');
        return;
    }
    
    // 保存当前删除信息
    currentDeleteId = id;
    currentDeleteType = 'stair';
    
    // 设置删除确认消息
    document.getElementById('deleteMessage').textContent = '确定要删除此梯号吗？此操作不可恢复。';
    // 显示删除确认模态框
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
}

/**
 * 打开层号模态框
 */
async function openFloorModal() {
    // 设置模态框标题为添加层号
    document.getElementById('floorModalTitle').textContent = '添加层号';
    // 清空表单数据
    document.getElementById('floorId').value = '';
    // 加载楼号选择框
    await loadBuildingSelectForFloor();
    // 清空梯号和层号输入框
    document.getElementById('floorStairId').innerHTML = '<option value="">选择梯号</option>';
    document.getElementById('floorNumber').value = '';
    // 显示模态框
    document.getElementById('floorModal').style.display = 'flex';
    document.getElementById('floorModal').classList.add('show');
}

/**
 * 加载楼号选择框（楼层用）
 */
async function loadBuildingSelectForFloor() {
    // 获取所有楼号数据
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    const select = document.getElementById('floorBuildingId');
    
    // 清空并添加默认选项
    select.innerHTML = '<option value="">选择楼号</option>';
    // 添加所有楼栋选项
    buildings.forEach(building => {
        select.innerHTML += `<option value="${building.id}">${building.number}</option>`;
    });
}

/**
 * 加载梯号选择框（通用）
 * @param {number|null} buildingId - 楼栋ID（可选，用于筛选）
 * @param {Array} selectIds - 需要更新的选择框ID列表
 */
async function loadStairSelect(buildingId = '', selectIds = ['floorStairId', 'floorStairFilter', 'stairBuildingId']) {
    // 使用API获取梯号数据
    const result = await getStairs(buildingId);
    
    if (result.success) {
        const stairs = result.data;
        const selects = selectIds;

        // 预加载所有楼栋数据，用于显示楼栋名称
        const buildingsResult = await getBuildings();
        const buildingsMap = {};
        if (buildingsResult.success) {
            buildingsResult.data.forEach(building => {
                buildingsMap[building.id] = building;
            });
        }

        // 遍历所有选择框，更新其选项
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // 保存当前选中值
                const currentValue = select.value;
                // 清空并添加默认选项
                select.innerHTML = '<option value="">选择梯号</option>';
                // 添加所有梯号选项（包含楼栋信息）
                stairs.forEach(stair => {
                    const building = buildingsMap[stair.buildingId];
                    select.innerHTML += `<option value="${stair.id}">${building ? building.number : ''} ${stair.number}</option>`;
                });
                // 恢复之前的选中值
                select.value = currentValue;
            }
        });
    } else {
        // API调用失败，输出错误日志
        console.error('加载梯号数据失败:', result.message);
    }
}

/**
 * 加载楼层用梯号选择框
 */
async function loadFloorStairSelect() {
    // 获取楼号筛选条件
    const buildingId = document.getElementById('floorBuildingId').value;
    const stairSelect = document.getElementById('floorStairId');
    
    // 清空梯号选择框
    stairSelect.innerHTML = '<option value="">选择梯号</option>';

    // 如果选择了楼号
    if (buildingId) {
        // 获取该楼号下的所有梯号
        const result = await getStairs(buildingId);
        
        if (result.success) {
            // 获取对应楼号信息
            const buildingsResult = await getBuildings();
            const buildingMap = {};
            if (buildingsResult.success) {
                buildingsResult.data.forEach(building => {
                    buildingMap[building.id] = building;
                });
            }
            
            // 添加梯号选项（包含楼栋信息）
            result.data.forEach(stair => {
                const building = buildingMap[stair.buildingId];
                const buildingInfo = building ? building.number + ' ' : '';
                stairSelect.innerHTML += `<option value="${stair.id}">${buildingInfo}${stair.number}</option>`;
            });
        }
    }
}

/**
 * 关闭层号模态框
 */
function closeFloorModal() {
    // 隐藏模态框
    document.getElementById('floorModal').style.display = 'none';
    document.getElementById('floorModal').classList.remove('show');
}

/**
 * 保存层号
 */
async function saveFloor() {
    // 获取表单数据
    const stairId = document.getElementById('floorStairId').value;
    const floorNumber = parseInt(document.getElementById('floorNumber').value) || 0;

    // 验证必填项
    if (!stairId || !floorNumber) {
        alert('请选择梯号并输入层号');
        return;
    }

    // 使用API获取梯号信息
    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    // 检查是否已存在相同层号
    const floorsResult = await getFloors(stairId);
    const existingFloor = floorsResult.success ? floorsResult.data.find(f => f.floorNumber == floorNumber) : null;
    
    if (existingFloor) {
        alert('该梯号下已存在相同层号');
        return;
    }

    // 使用API添加层号
    const result = await addFloor(stair.buildingId, stairId, floorNumber);
    
    if (result.success) {
        // 添加成功，关闭模态框并刷新数据
        closeFloorModal();
        await loadFloorData();
        await loadStairSelect();
        alert('层号添加成功！');
    } else {
        // 添加失败，显示错误信息
        alert('添加失败：' + (result.message || '未知错误'));
    }
}

/**
 * 编辑层号
 * @param {number} id - 层号ID
 */
async function editFloor(id) {
    // 获取所有层号数据
    const floorsResult = await getFloors();
    
    if (floorsResult.success) {
        // 查找指定ID的层号
        const floor = floorsResult.data.find(f => f.id == id);
        
        if (floor) {
            // 设置模态框标题为编辑层号
            document.getElementById('floorModalTitle').textContent = '编辑层号';
            // 填充表单数据
            document.getElementById('floorId').value = id;
            // 加载楼号选择框
            await loadBuildingSelectForFloor();
            // 设置楼号选择框的值
            document.getElementById('floorBuildingId').value = floor.buildingId;
            // 加载对应的梯号
            const stairsResult = await getStairs(floor.buildingId);
            const stairSelect = document.getElementById('floorStairId');
            stairSelect.innerHTML = '<option value="">选择梯号</option>';
            
            if (stairsResult.success) {
                stairsResult.data.forEach(stair => {
                    stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
                });
            }
            
            // 设置梯号和层号
            document.getElementById('floorStairId').value = floor.stairId;
            document.getElementById('floorNumber').value = floor.floorNumber;
            // 显示模态框
            document.getElementById('floorModal').style.display = 'flex';
            document.getElementById('floorModal').classList.add('show');
        }
    }
}

/**
 * 更新层号
 */
async function updateFloor() {
    // 获取表单数据
    const stairId = document.getElementById('floorStairId').value;
    const floorNumber = parseInt(document.getElementById('floorNumber').value) || 0;
    const id = parseInt(document.getElementById('floorId').value);

    // 验证必填项
    if (!stairId || !floorNumber) {
        alert('请选择梯号并输入层号');
        return;
    }

    // 使用API获取梯号信息
    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    // 使用API更新层号
    const result = await updateFloorById(id, stair.buildingId, stairId, floorNumber);
    
    if (result.success) {
        // 更新成功，关闭模态框并刷新数据
        closeFloorModal();
        await loadFloorData();
        await loadStairSelect();
        alert('层号更新成功！');
    } else {
        // 更新失败，显示错误信息
        alert('更新失败：' + (result.message || '未知错误'));
    }
}

/**
 * 批量添加层号
 */
async function batchAddFloors() {
    // 获取梯号筛选条件
    const stairId = document.getElementById('floorStairFilter').value;
    
    if (!stairId) {
        alert('请先选择梯号');
        return;
    }

    // 提示用户输入要添加的层数
    const floorCount = prompt('请输入要添加的层数（从1层开始）：', '10');
    if (!floorCount) return;

    // 验证输入的层数
    const count = parseInt(floorCount);
    if (isNaN(count) || count < 1) {
        alert('请输入有效的数字');
        return;
    }

    // 使用API获取梯号信息
    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    // 批量添加层号
    let addedCount = 0;
    for (let i = 1; i <= count; i++) {
        // 检查是否已存在相同层号
        const floorsResult = await getFloors(stairId);
        const existingFloor = floorsResult.success ? floorsResult.data.find(f => f.floorNumber == i) : null;
        
        if (!existingFloor) {
            const result = await addFloor(stair.buildingId, stairId, i);
            if (result.success) {
                addedCount++;
            }
        }
    }

    // 根据添加结果显示提示
    if (addedCount > 0) {
        await loadFloorData();
        await loadStairSelect();
        alert(`成功添加 ${addedCount} 层！`);
    } else {
        alert('所有层号都已存在，无需添加');
    }
}

/**
 * 按楼号一键添加层号
 */
async function batchAddFloorsByBuilding() {
    // 获取所有楼号
    const buildingsResult = await getBuildings();
    
    if (!buildingsResult.success || buildingsResult.data.length === 0) {
        alert('暂无楼号数据');
        return;
    }
    
    // 构建楼号选择HTML
    let buildingOptions = '';
    buildingsResult.data.forEach(building => {
        buildingOptions += `<option value="${building.id}">${building.number} (${building.floorCount || 0}层)</option>`;
    });
    
    // 创建选择楼号的对话框HTML
    const html = `
        <div style="padding: 20px;">
            <h4>选择楼号</h4>
            <select id="batchBuildingSelect" class="form-control" style="margin: 10px 0;">
                ${buildingOptions}
            </select>
            <div style="text-align: right; margin-top: 20px;">
                <button onclick="batchAddFloorsByBuildingConfirm()" class="btn btn-success">确定</button>
                <button onclick="document.body.removeChild(this.closest('div'))" class="btn btn-secondary" style="margin-left: 10px;">取消</button>
            </div>
        </div>
    `;
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.innerHTML = `
        <div style="background: white; border-radius: 8px; width: 400px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            ${html}
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
}

/**
 * 确认按楼号一键添加层号
 */
async function batchAddFloorsByBuildingConfirm() {
    // 获取选中的楼号
    const buildingId = document.getElementById('batchBuildingSelect').value;
    
    if (!buildingId) {
        alert('请选择楼号');
        return;
    }
    
    // 获取楼号信息
    const buildingsResult = await getBuildings();
    const building = buildingsResult.success ? buildingsResult.data.find(b => b.id == buildingId) : null;
    
    if (!building) {
        alert('楼号不存在');
        return;
    }
    
    // 获取该楼号设置的总层数
    const floorCount = building.floorCount || 0;
    if (floorCount <= 0) {
        alert('该楼号未设置总层数');
        return;
    }
    
    // 获取该楼号下的所有梯号
    const stairsResult = await getStairs(buildingId);
    
    if (!stairsResult.success || stairsResult.data.length === 0) {
        alert('该楼号下暂无梯号');
        return;
    }
    
    // 记录总共添加的层数
    let totalAdded = 0;
    
    // 为每个梯号添加层号
    for (const stair of stairsResult.data) {
        let addedCount = 0;
        for (let i = 1; i <= floorCount; i++) {
            // 检查是否已存在相同层号
            const floorsResult = await getFloors(stair.id);
            const existingFloor = floorsResult.success ? floorsResult.data.find(f => f.floorNumber == i) : null;
            
            if (!existingFloor) {
                const result = await addFloor(buildingId, stair.id, i);
                if (result.success) {
                    addedCount++;
                    totalAdded++;
                }
            }
        }
    }
    
    // 关闭模态框
    const modal = document.querySelector('div[style*="z-index: 1000"]');
    if (modal) {
        document.body.removeChild(modal);
    }
    
    // 根据添加结果显示提示
    if (totalAdded > 0) {
        await loadFloorData();
        await loadStairSelect();
        alert(`成功添加 ${totalAdded} 层！`);
    } else {
        alert('所有层号都已存在，无需添加');
    }
}

/**
 * 批量删除层号
 */
async function batchDeleteFloors() {
    // 获取梯号筛选条件
    const stairId = document.getElementById('floorStairFilter').value;
    
    if (!stairId) {
        alert('请先选择梯号');
        return;
    }

    // 使用API获取梯号信息
    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    // 获取楼号信息
    const buildingsResult = await getBuildings();
    const building = buildingsResult.success ? buildingsResult.data.find(b => b.id == stair.buildingId) : null;
    
    // 提示用户确认删除
    const confirmMessage = `确定要删除 ${building ? building.number : ''} ${stair.number} 的所有层号吗？\n此操作不可恢复，且会影响相关的房号数据！`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        // 删除该梯号下的所有层号
        const result = await deleteFloorsByStairId(stairId);
        
        if (result.success) {
            await loadFloorData();
            alert('成功删除该梯号的所有层号！');
        } else {
            alert('删除失败：' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('删除层号时出错:', error);
        alert('删除失败：数据库错误');
    }
}

/**
 * 删除层号
 * @param {number} id - 层号ID
 */
async function deleteFloorLocal(id) {
    // 先获取层号信息，得到floorNumber
    const floorsResult = await getFloors();
    const floor = floorsResult.success ? floorsResult.data.find(f => f.id == id) : null;
    
    if (!floor) {
        alert('层号不存在');
        return;
    }
    
    // 使用floorNumber查询房间
    const roomsResult = await getRooms(floor.floorNumber);
    
    if (roomsResult.success && roomsResult.data.length > 0) {
        // 存在关联房号，不允许删除
        alert('无法删除：该层号下存在 ' + roomsResult.data.length + ' 个房号，请先删除所有房号');
        return;
    }
    
    // 保存当前删除信息
    currentDeleteId = id;
    currentDeleteType = 'floor';
    
    // 设置删除确认消息
    document.getElementById('deleteMessage').textContent = '确定要删除此层号吗？此操作不可恢复。';
    // 显示删除确认模态框
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
}

/**
 * 打开房号模态框
 */
async function openRoomModal() {
    try {
        // 设置模态框标题为添加房号
        document.getElementById('roomModalTitle').textContent = '添加房号';
        // 清空表单数据
        document.getElementById('roomId').value = '';
        // 加载楼号选择框
        await loadBuildingSelectForRoom();
        // 清空梯号、层号和房号输入框
        document.getElementById('roomStairId').innerHTML = '<option value="">选择梯号</option>';
        document.getElementById('roomFloorId').innerHTML = '<option value="">选择层号</option>';
        document.getElementById('roomNumber').value = '';
        // 显示模态框
        document.getElementById('roomModal').style.display = 'flex';
        document.getElementById('roomModal').classList.add('show');
    } catch (error) {
        console.error('打开房号模态框时出错:', error);
        alert('打开添加房号对话框时出错，请刷新页面重试');
    }
}

/**
 * 加载楼号选择框（房号用）
 */
async function loadBuildingSelectForRoom() {
    // 获取所有楼号数据
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    const select = document.getElementById('roomBuildingId');
    
    // 清空并添加默认选项
    select.innerHTML = '<option value="">选择楼号</option>';
    // 添加所有楼栋选项（带栋字）
    buildings.forEach(building => {
        select.innerHTML += `<option value="${building.id}">${building.number}栋</option>`;
    });
}

/**
 * 加载层号选择框（通用）
 * @param {number|null} stairId - 梯号ID（可选，用于筛选）
 */
async function loadFloorSelect(stairId = '') {
    // 使用API获取层号数据
    const result = await getFloors(stairId);
    
    if (result.success) {
        const floors = result.data;
        const selects = ['roomFloorId', 'roomFloorFilter'];
        
        // 预加载所有楼栋和梯号数据
        const buildingsResult = await getBuildings();
        const stairsResult = await getStairs();
        const buildingsMap = {};
        const stairsMap = {};
        
        if (buildingsResult.success) {
            buildingsResult.data.forEach(building => {
                buildingsMap[building.id] = building;
            });
        }
        
        if (stairsResult.success) {
            stairsResult.data.forEach(stair => {
                stairsMap[stair.id] = stair;
            });
        }
        
        // 遍历所有选择框，更新其选项
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // 保存当前选中值
                const currentValue = select.value;
                // 清空并添加默认选项
                select.innerHTML = '<option value="">选择层号</option>';
                // 添加所有层号选项（包含楼栋和梯号信息）
                floors.forEach(floor => {
                    const stair = stairsMap[floor.stairId];
                    const building = stair ? buildingsMap[stair.buildingId] : null;
                    select.innerHTML += `<option value="${floor.id}">${building ? building.number : ''} ${stair ? stair.number : ''} ${floor.floorNumber}层</option>`;
                });
                // 恢复之前的选中值
                select.value = currentValue;
            }
        });
    } else {
        // API调用失败，输出错误日志
        console.error('加载层号数据失败:', result.message);
    }
}

/**
 * 关闭房号模态框
 */
function closeRoomModal() {
    // 隐藏模态框
    document.getElementById('roomModal').style.display = 'none';
    document.getElementById('roomModal').classList.remove('show');
}

/**
 * 保存房号
 */
async function saveRoom() {
    // 获取表单数据
    const stairId = document.getElementById('roomStairId').value;
    const floorNumber = parseInt(document.getElementById('roomFloorNumber').value) || 0;
    const roomNumber = parseInt(document.getElementById('roomNumber').value) || 0;

    // 验证必填项
    if (!stairId || !floorNumber || !roomNumber) {
        alert('请选择梯号、层号并输入房号');
        return;
    }

    // 使用API获取梯号信息
    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    // 检查是否已存在相同房号
    const roomsResult = await getRooms();
    const existingRoom = roomsResult.success ? roomsResult.data.find(r => r.stairId == stairId && r.floorNumber == floorNumber && r.roomNumber == roomNumber) : null;
    
    if (existingRoom) {
        alert('该楼层下已存在相同房号');
        return;
    }

    // 使用API添加房号
    const result = await addRoom(stair.buildingId, stairId, floorNumber, roomNumber);
    
    if (result.success) {
        // 添加成功，关闭模态框并刷新数据
        closeRoomModal();
        await loadRoomData();
        alert('房号添加成功！');
    } else {
        // 添加失败，显示错误信息
        alert('添加失败：' + (result.message || '未知错误'));
    }
}

/**
 * 编辑房号
 * @param {number} id - 房号ID
 */
async function editRoom(id) {
    // 获取所有房号数据
    const roomsResult = await getRooms();
    
    if (roomsResult.success) {
        // 查找指定ID的房号
        const room = roomsResult.data.find(r => r.id == id);
        
        if (room) {
            // 设置模态框标题为编辑房号
            document.getElementById('roomModalTitle').textContent = '编辑房号';
            // 填充表单数据
            document.getElementById('roomId').value = id;
            // 加载楼号选择框
            await loadBuildingSelectForRoom();
            // 设置楼号选择框的值
            document.getElementById('roomBuildingId').value = room.buildingId;
            // 加载对应的梯号
            const stairsResult = await getStairs(room.buildingId);
            const stairSelect = document.getElementById('roomStairId');
            stairSelect.innerHTML = '<option value="">选择梯号</option>';
            
            if (stairsResult.success) {
                stairsResult.data.forEach(stair => {
                    const selected = stair.id == room.stairId ? 'selected' : '';
                    stairSelect.innerHTML += `<option value="${stair.id}" ${selected}>${stair.number}</option>`;
                });
            }
            
            // 加载对应的层号
            const floorsResult = await getFloors(room.stairId);
            const floorSelect = document.getElementById('roomFloorId');
            floorSelect.innerHTML = '<option value="">选择层号</option>';
            
            if (floorsResult.success) {
                floorsResult.data.forEach(floor => {
                    const selected = floor.id == room.floorId ? 'selected' : '';
                    floorSelect.innerHTML += `<option value="${floor.id}" ${selected}>${floor.floorNumber}层</option>`;
                });
            }
            
            // 设置房号
            document.getElementById('roomFloorNumber').value = room.floorNumber;
            document.getElementById('roomNumber').value = room.roomNumber;
            // 显示模态框
            document.getElementById('roomModal').style.display = 'flex';
            document.getElementById('roomModal').classList.add('show');
        }
    }
}

/**
 * 更新房号
 */
async function updateRoom() {
    // 获取表单数据
    const id = parseInt(document.getElementById('roomId').value);
    const stairId = document.getElementById('roomStairId').value;
    const floorNumber = parseInt(document.getElementById('roomFloorNumber').value) || 0;
    const roomNumber = parseInt(document.getElementById('roomNumber').value) || 0;

    // 验证必填项
    if (!stairId || !floorNumber || !roomNumber) {
        alert('请选择梯号、层号并输入房号');
        return;
    }

    // 使用API获取梯号信息
    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    // 使用API更新房号
    const result = await updateRoomById(id, stair.buildingId, stairId, floorNumber, roomNumber);
    
    if (result.success) {
        // 更新成功，关闭模态框并刷新数据
        closeRoomModal();
        await loadRoomData();
        alert('房号更新成功！');
    } else {
        // 更新失败，显示错误信息
        alert('更新失败：' + (result.message || '未知错误'));
    }
}

/**
 * 删除房号
 * @param {number} id - 房号ID
 */
async function deleteRoomLocal(id) {
    // 保存当前删除信息
    currentDeleteId = id;
    currentDeleteType = 'room';
    
    // 设置删除确认消息
    document.getElementById('deleteMessage').textContent = '确定要删除此房号吗？此操作不可恢复。';
    // 显示删除确认模态框
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
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
        switch (currentDeleteType) {
            case 'building':
                result = await deleteBuildingById(currentDeleteId);
                break;
            case 'stair':
                result = await deleteStairById(currentDeleteId);
                break;
            case 'floor':
                result = await deleteFloorById(currentDeleteId);
                break;
            case 'room':
                result = await deleteRoomById(currentDeleteId);
                break;
            default:
                alert('未知删除类型');
                return;
        }

        // 如果删除成功
        if (result.success) {
            // 重新加载对应的数据
            switch (currentDeleteType) {
                case 'building':
                    await loadBuildingData();
                    await updateBuildingFilters();
                    break;
                case 'stair':
                    await loadStairData();
                    break;
                case 'floor':
                    await loadFloorData();
                    break;
                case 'room':
                    await loadRoomData();
                    break;
            }
            alert('删除成功！');
        } else {
            alert('删除失败：' + (result.message || '未知错误'));
        }
    } catch (err) {
        alert('删除失败：' + err.message);
    } finally {
        // 关闭删除确认模态框
        closeDeleteModal();
    }
}

/**
 * 关闭删除确认模态框
 */
function closeDeleteModal() {
    // 隐藏模态框
    document.getElementById('deleteModal').style.display = 'none';
    document.getElementById('deleteModal').classList.remove('show');
}

/**
 * 展开/收缩功能区域
 * @param {string} sectionId - 区域ID
 */
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const icon = document.querySelector(`[onclick="toggleSection('${sectionId}')"]`);
    
    if (section) {
        // 切换区域显示状态
        if (section.style.display === 'none') {
            section.style.display = 'block';
            icon.textContent = '▼';
        } else {
            section.style.display = 'none';
            icon.textContent = '▶';
        }
    }
}