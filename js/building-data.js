// 登录检查
function checkLogin() {
    const currentUser = localStorage.getItem('user');
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 退出系统
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// 页面加载完成后初始化
window.addEventListener('load', async function() {
    if (!checkLogin()) return;

    // 不需要初始化本地数据库，直接使用API
    await loadAllData();
    initFormEvents();

    // 初始化所有展开/收缩图标
    document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▼';
    });
});

// 初始化表单事件
function initFormEvents() {
    // 楼号表单
    const buildingForm = document.getElementById('buildingForm');
    if (buildingForm) {
        buildingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const buildingId = document.getElementById('buildingId').value;
            if (buildingId) {
                updateBuildingLocal();
            } else {
                saveBuilding();
            }
        });
    }

    // 梯号表单
    const stairForm = document.getElementById('stairForm');
    if (stairForm) {
        stairForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const stairId = document.getElementById('stairId').value;
            if (stairId) {
                updateStairLocal();
            } else {
                saveStair();
            }
        });
    }

    // 层号表单
    const floorForm = document.getElementById('floorForm');
    if (floorForm) {
        floorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const floorId = document.getElementById('floorId').value;
            if (floorId) {
                updateFloor();
            } else {
                saveFloor();
            }
        });
    }

    // 房号表单
    const roomForm = document.getElementById('roomForm');
    if (roomForm) {
        roomForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const roomId = document.getElementById('roomId').value;
            if (roomId) {
                updateRoom();
            } else {
                saveRoom();
            }
        });
    }

    // 退出按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出系统吗？')) {
                logout();
            }
        });
    }

    // 层号模态框事件监听器
    const floorStairId = document.getElementById('floorStairId');
    if (floorStairId) {
        floorStairId.addEventListener('change', function() {
            // 当选择梯号时，清空层号输入
            document.getElementById('floorNumber').value = '';
        });
    }

    // 房号模态框事件监听器
    const roomFloorId = document.getElementById('roomFloorId');
    if (roomFloorId) {
        roomFloorId.addEventListener('change', function() {
            // 当选择层号时，可以在这里添加加载房号的逻辑
            // 但根据现有代码结构，房号是手动输入的，不是从下拉列表选择
        });
    }
}

// 加载所有数据
async function loadAllData() {
    await loadBuildingData();
    await loadStairData();
    await loadFloorData();
    await loadRoomData();
    await updateBuildingFilters();
    await loadBuildingSelect();
    await loadStairSelect(); // 更新所有梯号选择下拉框
    await loadFloorSelect();
}

// 更新楼号筛选器
async function updateBuildingFilters() {
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    const filters = ['stairBuildingFilter', 'floorBuildingFilter', 'roomBuildingFilter'];

    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            const currentValue = filter.value;
            filter.innerHTML = '<option value="">选择楼号</option>';
            buildings.forEach(building => {
                filter.innerHTML += `<option value="${building.id}">${building.number}</option>`;
            });
            filter.value = currentValue;
        }
    });
}

// 加载楼号数据
async function loadBuildingData() {
    // 使用API
    const result = await getBuildings();
    if (result.success) {
        const buildings = result.data;
        const tableBody = document.getElementById('buildingTableBody');

        if (buildings.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">暂无数据</div></div>';
            return;
        }

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
        console.error('加载楼号数据失败:', result.message);
    }
}

// 加载梯号数据
async function loadStairData() {
    const buildingId = document.getElementById('stairBuildingFilter').value;
    
    // 使用API
    const result = await getStairs(buildingId);
    if (result.success) {
        const stairs = result.data;
        const tableBody = document.getElementById('stairTableBody');

        if (stairs.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:4">暂无数据</div></div>';
            return;
        }

        // 预加载所有楼栋数据
        const buildingsResult = await getBuildings();
        const buildingsMap = {};
        if (buildingsResult.success) {
            buildingsResult.data.forEach(building => {
                buildingsMap[building.id] = building;
            });
        }

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
        console.error('加载梯号数据失败:', result.message);
    }
}

// 加载楼层筛选的楼号和梯号选择
async function loadFloorBuildingStairSelect() {
    const buildingId = document.getElementById('floorBuildingFilter').value;
    const stairSelect = document.getElementById('floorStairFilter');
    stairSelect.innerHTML = '<option value="">选择梯号</option>';

    if (buildingId) {
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
            
            result.data.forEach(stair => {
                const building = buildingMap[stair.buildingId];
                const buildingInfo = building ? building.number + ' ' : '';
                stairSelect.innerHTML += `<option value="${stair.id}">${buildingInfo}${stair.number}</option>`;
            });
        }
    }
    
    // 根据筛选条件加载楼层数据
    loadFloorData();
}

// 加载层号数据
async function loadFloorData() {
    const buildingId = document.getElementById('floorBuildingFilter').value;
    const stairId = document.getElementById('floorStairFilter').value;
    
    // 使用API获取所有层号，然后在前端根据楼号和梯号筛选
    const result = await getFloors();
    if (result.success) {
        let floors = result.data;
        
        // 如果选择了楼号，先筛选属于该楼号的梯号
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

        if (floors.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:5">暂无数据</div></div>';
            return;
        }

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
        console.error('加载层号数据失败:', result.message);
    }
}

// 加载房间筛选的楼号选择
async function loadRoomBuildingStairSelect() {
    const buildingId = document.getElementById('roomBuildingFilter').value;
    const stairSelect = document.getElementById('roomStairFilter');
    stairSelect.innerHTML = '<option value="">选择梯号</option>';
    document.getElementById('roomFloorFilter').innerHTML = '<option value="">选择层号</option>';

    if (buildingId) {
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
            
            result.data.forEach(stair => {
                const building = buildingMap[stair.buildingId];
                const buildingInfo = building ? building.number + ' ' : '';
                stairSelect.innerHTML += `<option value="${stair.id}">${buildingInfo}${stair.number}</option>`;
            });
        }
    }
    
    // 根据筛选条件加载房号数据
    loadRoomData();
}

// 加载房间筛选的梯号和层号选择
async function loadRoomStairFloorSelect() {
    const stairId = document.getElementById('roomStairFilter').value;
    const floorSelect = document.getElementById('roomFloorFilter');
    floorSelect.innerHTML = '<option value="">选择层号</option>';

    if (stairId) {
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
            
            result.data.sort((a, b) => a.floorNumber - b.floorNumber).forEach(floor => {
                const stair = stairMap[floor.stairId];
                const building = stair ? buildingMap[stair.buildingId] : null;
                const buildingInfo = building ? building.number + ' ' : '';
                const stairInfo = stair ? stair.number + ' ' : '';
                floorSelect.innerHTML += `<option value="${floor.id}">${buildingInfo}${stairInfo}${floor.floorNumber}层</option>`;
            });
        }
    }
    
    // 根据筛选条件加载房号数据
    loadRoomData();
}

// 加载房号数据
async function loadRoomData() {
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

        if (rooms.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="flex:6">暂无数据</div></div>';
            return;
        }

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
        console.error('加载房号数据失败:', result.message);
    }
}

// 打开楼号模态框
function openBuildingModal() {
    document.getElementById('buildingModalTitle').textContent = '添加楼号';
    document.getElementById('buildingId').value = '';
    document.getElementById('buildingNumber').value = '';
    document.getElementById('floorCount').value = '';
    document.getElementById('buildingModal').style.display = 'flex';
    document.getElementById('buildingModal').classList.add('show');
}

// 关闭楼号模态框
function closeBuildingModal() {
    document.getElementById('buildingModal').style.display = 'none';
    document.getElementById('buildingModal').classList.remove('show');
}

// 保存楼号
async function saveBuilding() {
    const number = document.getElementById('buildingNumber').value.trim();
    const floorCount = parseInt(document.getElementById('floorCount').value) || 0;

    if (!number) {
        alert('请输入楼号');
        return;
    }

    console.log('保存楼号:', { number, floorCount });
    
    // 使用API
    const result = await addBuilding(number, floorCount);
    if (result.success) {
        closeBuildingModal();
        await loadBuildingData();
        await updateBuildingFilters();
        alert('楼号添加成功！');
    } else {
        alert('添加失败：' + (result.message || '未知错误'));
    }
}

// 编辑楼号
async function editBuilding(id) {
    const result = await getBuildings();
    if (result.success) {
        const building = result.data.find(b => b.id == id);
        if (building) {
            document.getElementById('buildingModalTitle').textContent = '编辑楼号';
            document.getElementById('buildingId').value = id;
            document.getElementById('buildingNumber').value = building.number;
            document.getElementById('floorCount').value = building.floorCount || '';
            document.getElementById('buildingModal').style.display = 'flex';
            document.getElementById('buildingModal').classList.add('show');
        }
    }
}

// 更新楼号
async function updateBuildingLocal() {
    const number = document.getElementById('buildingNumber').value.trim();
    const floorCount = parseInt(document.getElementById('floorCount').value) || 0;
    const id = parseInt(document.getElementById('buildingId').value);

    if (!number) {
        alert('请输入楼号');
        return;
    }

    // 使用API
    const result = await updateBuilding(id, number, floorCount);
    if (result.success) {
        closeBuildingModal();
        await loadBuildingData();
        await updateBuildingFilters();
        alert('楼号更新成功！');
    } else {
        alert('更新失败：' + (result.message || '未知错误'));
    }
}

// 删除楼号
async function deleteBuildingLocal(id) {
    const stairsResult = await getStairs(id);
    if (stairsResult.success && stairsResult.data.length > 0) {
        alert('无法删除：该楼号下存在 ' + stairsResult.data.length + ' 个梯号，请先删除所有梯号');
        return;
    }
    currentDeleteId = id;
    currentDeleteType = 'building';
    document.getElementById('deleteMessage').textContent = '确定要删除此楼号吗？此操作不可恢复。';
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
}

// 打开梯号模态框
function openStairModal() {
    document.getElementById('stairModalTitle').textContent = '添加梯号';
    document.getElementById('stairId').value = '';
    loadBuildingSelect();
    document.getElementById('stairNumber').value = '';
    document.getElementById('stairModal').style.display = 'flex';
    document.getElementById('stairModal').classList.add('show');
}

// 加载楼号选择
async function loadBuildingSelect() {
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    const selects = ['stairBuildingId', 'stairBuildingFilter'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">选择楼号</option>';
            buildings.forEach(building => {
                select.innerHTML += `<option value="${building.id}">${building.number}</option>`;
            });
            select.value = currentValue;
        }
    });
}

// 关闭梯号模态框
function closeStairModal() {
    document.getElementById('stairModal').style.display = 'none';
    document.getElementById('stairModal').classList.remove('show');
}

// 保存梯号
async function saveStair() {
    const buildingId = document.getElementById('stairBuildingId').value;
    const number = document.getElementById('stairNumber').value.trim();

    if (!buildingId || !number) {
        alert('请选择楼号并输入梯号');
        return;
    }

    // 使用API
    const result = await addStair(buildingId, number);
    if (result.success) {
        closeStairModal();
        await loadStairData();
        alert('梯号添加成功！');
    } else {
        alert('添加失败：' + (result.message || '未知错误'));
    }
}

// 编辑梯号
async function editStair(id) {
    const result = await getStairs();
    if (result.success) {
        const stair = result.data.find(s => s.id == id);
        if (stair) {
            document.getElementById('stairModalTitle').textContent = '编辑梯号';
            document.getElementById('stairId').value = id;
            await loadBuildingSelect();
            setTimeout(() => {
                document.getElementById('stairBuildingId').value = stair.buildingId;
                document.getElementById('stairNumber').value = stair.number;
            }, 100);
            document.getElementById('stairModal').style.display = 'flex';
            document.getElementById('stairModal').classList.add('show');
        }
    }
}

// 更新梯号
async function updateStairLocal() {
    const buildingId = document.getElementById('stairBuildingId').value;
    const number = document.getElementById('stairNumber').value.trim();
    const id = parseInt(document.getElementById('stairId').value);

    if (!buildingId || !number) {
        alert('请选择楼号并输入梯号');
        return;
    }

    // 使用API
    const result = await updateStair(id, buildingId, number);
    if (result.success) {
        closeStairModal();
        await loadStairData();
        alert('梯号更新成功！');
    } else {
        alert('更新失败：' + (result.message || '未知错误'));
    }
}

// 删除梯号
async function deleteStairLocal(id) {
    const floorsResult = await getFloors(id);
    if (floorsResult.success && floorsResult.data.length > 0) {
        alert('无法删除：该梯号下存在 ' + floorsResult.data.length + ' 个层号，请先删除所有层号');
        return;
    }
    currentDeleteId = id;
    currentDeleteType = 'stair';
    document.getElementById('deleteMessage').textContent = '确定要删除此梯号吗？此操作不可恢复。';
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
}

// 打开层号模态框
async function openFloorModal() {
    document.getElementById('floorModalTitle').textContent = '添加层号';
    document.getElementById('floorId').value = '';
    await loadBuildingSelectForFloor();
    document.getElementById('floorStairId').innerHTML = '<option value="">选择梯号</option>';
    document.getElementById('floorNumber').value = '';
    document.getElementById('floorModal').style.display = 'flex';
    document.getElementById('floorModal').classList.add('show');
}

// 加载楼号选择（楼层用）
async function loadBuildingSelectForFloor() {
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    const select = document.getElementById('floorBuildingId');
    select.innerHTML = '<option value="">选择楼号</option>';
    buildings.forEach(building => {
        select.innerHTML += `<option value="${building.id}">${building.number}</option>`;
    });
}

// 加载梯号选择
async function loadStairSelect(buildingId = '', selectIds = ['floorStairId', 'floorStairFilter', 'stairBuildingId']) {
    // 使用API
    const result = await getStairs(buildingId);
    if (result.success) {
        const stairs = result.data;
        const selects = selectIds;

        // 预加载所有楼栋数据
        const buildingsResult = await getBuildings();
        const buildingsMap = {};
        if (buildingsResult.success) {
            buildingsResult.data.forEach(building => {
                buildingsMap[building.id] = building;
            });
        }

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">选择梯号</option>';
                stairs.forEach(stair => {
                    const building = buildingsMap[stair.buildingId];
                    select.innerHTML += `<option value="${stair.id}">${building ? building.number : ''} ${stair.number}</option>`;
                });
                select.value = currentValue;
            }
        });
    } else {
        console.error('加载梯号数据失败:', result.message);
    }
}

// 加载楼层用梯号选择
async function loadFloorStairSelect() {
    const buildingId = document.getElementById('floorBuildingId').value;
    const stairSelect = document.getElementById('floorStairId');
    stairSelect.innerHTML = '<option value="">选择梯号</option>';

    if (buildingId) {
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
            
            result.data.forEach(stair => {
                const building = buildingMap[stair.buildingId];
                const buildingInfo = building ? building.number + ' ' : '';
                stairSelect.innerHTML += `<option value="${stair.id}">${buildingInfo}${stair.number}</option>`;
            });
        }
    }
}

// 关闭层号模态框
function closeFloorModal() {
    document.getElementById('floorModal').style.display = 'none';
    document.getElementById('floorModal').classList.remove('show');
}

// 保存层号
async function saveFloor() {
    const stairId = document.getElementById('floorStairId').value;
    const floorNumber = parseInt(document.getElementById('floorNumber').value) || 0;

    if (!stairId || !floorNumber) {
        alert('请选择梯号并输入层号');
        return;
    }

    // 使用API
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

    const result = await addFloor(stair.buildingId, stairId, floorNumber);
    if (result.success) {
        closeFloorModal();
        await loadFloorData();
        await loadStairSelect();
        alert('层号添加成功！');
    } else {
        alert('添加失败：' + (result.message || '未知错误'));
    }
}

// 编辑层号
async function editFloor(id) {
    const floorsResult = await getFloors();
    if (floorsResult.success) {
        const floor = floorsResult.data.find(f => f.id == id);
        if (floor) {
            document.getElementById('floorModalTitle').textContent = '编辑层号';
            document.getElementById('floorId').value = id;
            await loadBuildingSelectForFloor();
            // 设置楼号选择框的值
            document.getElementById('floorBuildingId').value = floor.buildingId;
            // 直接加载对应的梯号
            const stairsResult = await getStairs(floor.buildingId);
            const stairSelect = document.getElementById('floorStairId');
            stairSelect.innerHTML = '<option value="">选择梯号</option>';
            if (stairsResult.success) {
                stairsResult.data.forEach(stair => {
                    stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
                });
            }
            document.getElementById('floorStairId').value = floor.stairId;
            document.getElementById('floorNumber').value = floor.floorNumber;
            document.getElementById('floorModal').style.display = 'flex';
            document.getElementById('floorModal').classList.add('show');
        }
    }
}

// 更新层号
async function updateFloor() {
    const stairId = document.getElementById('floorStairId').value;
    const floorNumber = parseInt(document.getElementById('floorNumber').value) || 0;
    const id = parseInt(document.getElementById('floorId').value);

    if (!stairId || !floorNumber) {
        alert('请选择梯号并输入层号');
        return;
    }

    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    const result = await updateFloorById(id, stair.buildingId, stairId, floorNumber);
    if (result.success) {
        closeFloorModal();
        await loadFloorData();
        await loadStairSelect();
        alert('层号更新成功！');
    } else {
        alert('更新失败：' + (result.message || '未知错误'));
    }
}

// 批量添加层号
async function batchAddFloors() {
    const stairId = document.getElementById('floorStairFilter').value;
    if (!stairId) {
        alert('请先选择梯号');
        return;
    }

    const floorCount = prompt('请输入要添加的层数（从1层开始）：', '10');
    if (!floorCount) return;

    const count = parseInt(floorCount);
    if (isNaN(count) || count < 1) {
        alert('请输入有效的数字');
        return;
    }

    // 使用API
    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    if (!stair) {
        alert('梯号不存在');
        return;
    }

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

    if (addedCount > 0) {
        await loadFloorData();
        await loadStairSelect();
        alert(`成功添加 ${addedCount} 层！`);
    } else {
        alert('所有层号都已存在，无需添加');
    }
}

// 按楼号一键添加层号
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
    
    // 创建选择楼号的对话框
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
    document.body.appendChild(modal);
}

// 确认按楼号一键添加层号
async function batchAddFloorsByBuildingConfirm() {
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
    
    if (totalAdded > 0) {
        await loadFloorData();
        await loadStairSelect();
        alert(`成功添加 ${totalAdded} 层！`);
    } else {
        alert('所有层号都已存在，无需添加');
    }
}

// 批量删除层号
async function batchDeleteFloors() {
    const stairId = document.getElementById('floorStairFilter').value;
    if (!stairId) {
        alert('请先选择梯号');
        return;
    }

    // 使用API
    const stairResult = await getStairs();
    const stair = stairResult.success ? stairResult.data.find(s => s.id == stairId) : null;
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    const buildingsResult = await getBuildings();
    const building = buildingsResult.success ? buildingsResult.data.find(b => b.id == stair.buildingId) : null;
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

// 删除层号
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
        alert('无法删除：该层号下存在 ' + roomsResult.data.length + ' 个房号，请先删除所有房号');
        return;
    }
    currentDeleteId = id;
    currentDeleteType = 'floor';
    document.getElementById('deleteMessage').textContent = '确定要删除此层号吗？此操作不可恢复。';
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
}

// 打开房号模态框
async function openRoomModal() {
    try {
        document.getElementById('roomModalTitle').textContent = '添加房号';
        document.getElementById('roomId').value = '';
        await loadBuildingSelectForRoom();
        document.getElementById('roomStairId').innerHTML = '<option value="">选择梯号</option>';
        document.getElementById('roomFloorId').innerHTML = '<option value="">选择层号</option>';
        document.getElementById('roomNumber').value = '';
        document.getElementById('roomModal').style.display = 'flex';
        document.getElementById('roomModal').classList.add('show');
    } catch (error) {
        console.error('打开房号模态框时出错:', error);
        alert('打开添加房号对话框时出错，请刷新页面重试');
    }
}

// 加载楼号选择（房号用）
async function loadBuildingSelectForRoom() {
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    const select = document.getElementById('roomBuildingId');
    select.innerHTML = '<option value="">选择楼号</option>';
    buildings.forEach(building => {
        select.innerHTML += `<option value="${building.id}">${building.number}栋</option>`;
    });
}

// 加载层号选择
async function loadFloorSelect(stairId = '') {
    // 使用API
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
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">选择层号</option>';
                floors.forEach(floor => {
                    const stair = stairsMap[floor.stairId];
                    const building = stair ? buildingsMap[stair.buildingId] : null;
                    select.innerHTML += `<option value="${floor.id}">${building ? building.number : ''} ${stair ? stair.number : ''} ${floor.floorNumber}层</option>`;
                });
                select.value = currentValue;
            }
        });
    } else {
        console.error('加载层号数据失败:', result.message);
    }
}

// 关闭房号模态框
function closeRoomModal() {
    document.getElementById('roomModal').style.display = 'none';
    document.getElementById('roomModal').classList.remove('show');
}

// 保存房号
async function saveRoom() {
    const floorId = document.getElementById('roomFloorId').value;
    const number = document.getElementById('roomNumber').value.trim();

    if (!floorId || !number) {
        alert('请选择层号并输入房号');
        return;
    }

    // 使用API
    const floorsResult = await getFloors();
    const floor = floorsResult.success ? floorsResult.data.find(f => f.id == floorId) : null;
    console.log('floor数据:', floor);
    if (!floor) {
        alert('层号不存在');
        return;
    }

    // 获取楼栋和梯号信息
    console.log('floor.stairId:', floor.stairId);
    const stairsResult = await getStairs();
    const stair = stairsResult.success ? stairsResult.data.find(s => s.id == floor.stairId) : null;
    console.log('stair数据:', stair);
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    // 检查是否已存在相同房号
    const roomsResult = await getRooms();
    const existingRoom = roomsResult.success ? roomsResult.data.find(r => r.stairId == stair.id && r.floorNumber == floor.floorNumber && r.roomNumber == number) : null;
    if (existingRoom) {
        alert('该层下已存在相同房号');
        return;
    }

    const result = await addRoom(stair.buildingId, stair.id, floor.floorNumber, number);
    if (result.success) {
        closeRoomModal();
        await loadRoomData();
        await loadFloorSelect();
        alert('房号添加成功！');
    } else {
        alert('添加失败：' + (result.message || '未知错误'));
    }
}

// 编辑房号
async function editRoom(id) {
    const roomsResult = await getRooms();
    if (roomsResult.success) {
        const room = roomsResult.data.find(r => r.id == id);
        if (room) {
            document.getElementById('roomModalTitle').textContent = '编辑房号';
            document.getElementById('roomId').value = id;
            await loadBuildingSelectForRoom();
            // 设置楼号选择框的值
            document.getElementById('roomBuildingId').value = room.buildingId;
            // 等待loadRoomStairSelect完成
            await loadRoomStairSelect();
            // 设置梯号选择框的值
            const stairSelect = document.getElementById('roomStairId');
            stairSelect.value = room.stairId;
            // 等待loadRoomFloorSelect完成
            await loadRoomFloorSelect();
            // 根据stairId和floorNumber查找对应的层号id
            const floorsResult = await getFloors(room.stairId);
            if (floorsResult.success) {
                const floor = floorsResult.data.find(f => f.floorNumber == room.floorNumber);
                if (floor) {
                    // 设置层号选择框的值
                    const floorSelect = document.getElementById('roomFloorId');
                    floorSelect.value = floor.id;
                }
            }
            // 设置房号
            document.getElementById('roomNumber').value = room.roomNumber;
            // 显示模态框
            document.getElementById('roomModal').style.display = 'flex';
            document.getElementById('roomModal').classList.add('show');
        }
    }
}

// 加载楼号选择（房号用）
async function loadBuildingSelectForRoom() {
    const result = await getBuildings();
    const buildings = result.success ? result.data : [];
    const select = document.getElementById('roomBuildingId');
    select.innerHTML = '<option value="">选择楼号</option>';
    buildings.forEach(building => {
        select.innerHTML += `<option value="${building.id}">${building.number}</option>`;
    });
}

// 更新房号
async function updateRoom() {
    const floorId = document.getElementById('roomFloorId').value;
    const number = document.getElementById('roomNumber').value.trim();
    const id = parseInt(document.getElementById('roomId').value);

    if (!floorId || !number) {
        alert('请选择层号并输入房号');
        return;
    }

    // 获取所有层号数据，然后根据ID查找
    const floorsResult = await getFloors();
    const floor = floorsResult.success ? floorsResult.data.find(f => f.id == floorId) : null;
    
    if (!floor) {
        alert('层号不存在');
        return;
    }

    const stairsResult = await getStairs();
    const stair = stairsResult.success ? stairsResult.data.find(s => s.id == floor.stairId) : null;
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    const result = await updateRoomById(id, stair.buildingId, stair.id, floor.floorNumber, number);
    if (result.success) {
        closeRoomModal();
        await loadRoomData();
        await loadFloorSelect();
        alert('房号更新成功！');
    } else {
        alert('更新失败：' + (result.message || '未知错误'));
    }
}

// 删除房号
async function deleteRoomLocal(id) {
    const residentsResult = await getResidents();
    if (residentsResult.success) {
        const roomsResidents = residentsResult.data.filter(r => r.roomId == id);
        if (roomsResidents.length > 0) {
            alert('无法删除：该房号下存在 ' + roomsResidents.length + ' 个住户，请先删除或迁出所有住户');
            return;
        }
    }
    currentDeleteId = id;
    currentDeleteType = 'room';
    document.getElementById('deleteMessage').textContent = '确定要删除此房号吗？此操作不可恢复。';
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('deleteModal').classList.add('show');
}

// 批量删除房号
async function batchDeleteRooms() {
    const floorId = document.getElementById('roomFloorFilter').value;
    if (!floorId) {
        alert('请先选择层号');
        return;
    }

    const floorsResult = await getFloors();
    if (!floorsResult.success) {
        alert('获取层号信息失败');
        return;
    }
    const floor = floorsResult.data.find(f => f.id == floorId);
    if (!floor) {
        alert('层号不存在');
        return;
    }

    const stairsResult = await getStairs();
    if (!stairsResult.success) {
        alert('获取梯号信息失败');
        return;
    }
    const stair = stairsResult.data.find(s => s.id == floor.stairId);
    if (!stair) {
        alert('梯号不存在');
        return;
    }

    const buildingsResult = await getBuildings();
    if (!buildingsResult.success) {
        alert('获取楼号信息失败');
        return;
    }
    const building = buildingsResult.data.find(b => b.id == stair.buildingId);
    const confirmMessage = `确定要删除 ${building ? building.number : ''} ${stair ? stair.number : ''} ${floor.floorNumber}层的所有房号吗？\n此操作不可恢复！`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        const result = await deleteRoomsBatch(floor.stairId, floor.floorNumber);

        if (result.success) {
            await loadRoomData();
            alert('成功删除该层号的所有房号！');
        } else {
            alert('删除失败：' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('删除房号时出错:', error);
        alert('删除失败：数据库错误');
    }
}

// 确认删除
async function confirmDelete() {
    const id = currentDeleteId;
    const type = currentDeleteType;

    let success = false;
    let message = '';
    
    if (type === 'building') {
        const result = await deleteBuildingById(id);
        success = result.success;
        message = result.message;
    } else if (type === 'stair') {
        const result = await deleteStairById(id);
        success = result.success;
        message = result.message;
    } else if (type === 'floor') {
        const result = await deleteFloorById(id);
        success = result.success;
        message = result.message;
    } else if (type === 'room') {
        const result = await deleteRoomById(id);
        success = result.success;
        message = result.message;
    }

    if (success) {
        closeDeleteModal();
        await loadAllData();
    } else {
        alert('删除失败：' + (message || '未知错误'));
        closeDeleteModal();
    }
}

// 关闭删除确认对话框
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.getElementById('deleteModal').classList.remove('show');
    currentDeleteId = null;
    currentDeleteType = '';
}

let currentDeleteId = null;
let currentDeleteType = '';

// 展开/收缩区域
function toggleSection(section) {
    const content = document.getElementById('content-' + section);
    const icon = document.getElementById('toggle-' + section);

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        icon.textContent = '▼';
    } else {
        content.classList.add('collapsed');
        icon.textContent = '▶';
    }
}

// 加载房间楼层选择
async function loadRoomStairSelect() {
    const buildingId = document.getElementById('roomBuildingId').value;
    const stairSelect = document.getElementById('roomStairId');
    stairSelect.innerHTML = '<option value="">选择梯号</option>';
    document.getElementById('roomFloorId').innerHTML = '<option value="">选择层号</option>';

    if (buildingId) {
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
            
            result.data.forEach(stair => {
                const building = buildingMap[stair.buildingId];
                const buildingInfo = building ? building.number + ' ' : '';
                stairSelect.innerHTML += `<option value="${stair.id}">${buildingInfo}${stair.number}</option>`;
            });
        }
    }
}

// 加载房间层号选择
async function loadRoomFloorSelect() {
    const stairId = document.getElementById('roomStairId').value;
    const floorSelect = document.getElementById('roomFloorId');
    floorSelect.innerHTML = '<option value="">选择层号</option>';

    if (stairId) {
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
            
            result.data.sort((a, b) => a.floorNumber - b.floorNumber).forEach(floor => {
                const stair = stairMap[floor.stairId];
                const building = stair ? buildingMap[stair.buildingId] : null;
                const buildingInfo = building ? building.number + ' ' : '';
                const stairInfo = stair ? stair.number + ' ' : '';
                floorSelect.innerHTML += `<option value="${floor.id}">${buildingInfo}${stairInfo}${floor.floorNumber}层</option>`;
            });
        }
    }
}
