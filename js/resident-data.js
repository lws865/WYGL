let allResidents = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadBuildingOptions();
    await loadAllResidents();

    const addButton = document.querySelector('.btn-primary');
    if (addButton) {
        addButton.addEventListener('click', showAddResidentModal);
    }
});

function showAddResidentModal() {
    const modal = document.createElement('div');
    modal.id = 'residentModal';
    modal.className = 'modal show';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-dialog" style="width: 676px;">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">添加住户</h4>
                    <button type="button" class="close" onclick="closeResidentModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="residentForm">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label for="residentName">姓名</label>
                                <input type="text" id="residentName" class="form-control" required>
                            </div>
                            <div style="flex: 1;">
                                <label for="residentPhone">电话</label>
                                <input type="tel" id="residentPhone" class="form-control" required>
                            </div>
                        </div>

                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label for="residentBuilding">楼号</label>
                                <select id="residentBuilding" class="form-control" onchange="updateResidentStairOptions()" required>
                                    <option value="">选择楼号</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="residentStair">梯号</label>
                                <select id="residentStair" class="form-control" onchange="updateResidentFloorOptions()" required>
                                    <option value="">选择</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="residentFloor">层号</label>
                                <select id="residentFloor" class="form-control" onchange="updateResidentRoomOptions()" required>
                                    <option value="">选择</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="residentRoom">房号</label>
                                <select id="residentRoom" class="form-control" required>
                                    <option value="">选择</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="residentArea">面积</label>
                                <input type="number" id="residentArea" class="form-control" step="0.01" required>
                            </div>
                        </div>

                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label for="residentStatus">状态</label>
                                <select id="residentStatus" class="form-control" required>
                                    <option value="active">入住</option>
                                    <option value="inactive">未入住</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="residentRenovationStatus">装修状态</label>
                                <select id="residentRenovationStatus" class="form-control" required>
                                    <option value="no">未装修</option>
                                    <option value="in_progress">装修中</option>
                                    <option value="completed">已装修</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="residentProperty">住户性质</label>
                                <select id="residentProperty" class="form-control" onchange="togglePropertyDescriptionField()" required>
                                    <option value="excellent">优</option>
                                    <option value="medium" selected>中</option>
                                    <option value="poor">差</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom: 15px; display: none;" id="propertyDescriptionField">
                            <label for="residentPropertyDescription">性质说明</label>
                            <textarea id="residentPropertyDescription" class="form-control" rows="2" placeholder="请输入优/差说明"></textarea>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label for="residentHasDebt">是否欠房款</label>
                            <select id="residentHasDebt" class="form-control" onchange="toggleDebtFields()" required>
                                <option value="0">否</option>
                                <option value="1">是</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 15px; display: none;" id="debtFields">
                            <label for="residentDebtAmount">欠款金额</label>
                            <input type="number" id="residentDebtAmount" class="form-control" step="0.01" value="0">
                        </div>

                        <div style="margin-bottom: 15px; display: none;" id="debtDescriptionField">
                            <label for="residentDebtDescription">欠款说明</label>
                            <textarea id="residentDebtDescription" class="form-control" rows="2"></textarea>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label for="residentRemark">备注</label>
                            <textarea id="residentRemark" class="form-control" rows="2" placeholder="请输入备注信息"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeResidentModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="handleAddResident()">保存</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    loadResidentBuildingOptions();

    document.getElementById('residentStatus').value = 'active';
    document.getElementById('residentRenovationStatus').value = 'completed';
}

function togglePropertyDescriptionField() {
    const property = document.getElementById('residentProperty').value;
    const descriptionField = document.getElementById('propertyDescriptionField');
    if (property === 'excellent' || property === 'poor') {
        descriptionField.style.display = 'block';
    } else {
        descriptionField.style.display = 'none';
    }
}

function toggleDebtFields() {
    const hasDebt = document.getElementById('residentHasDebt').value === '1';
    document.getElementById('debtFields').style.display = hasDebt ? 'block' : 'none';
    document.getElementById('debtDescriptionField').style.display = hasDebt ? 'block' : 'none';
}

function closeResidentModal() {
    const modal = document.getElementById('residentModal');
    if (modal) {
        modal.remove();
    }
}

async function loadResidentBuildingOptions() {
    const result = await getBuildings();
    const buildingSelect = document.getElementById('residentBuilding');

    if (result.success && result.data) {
        buildingSelect.innerHTML = '<option value="">选择楼号</option>';
        result.data.forEach(building => {
            buildingSelect.innerHTML += `<option value="${building.id}">${building.number}</option>`;
        });
    }
}

async function updateResidentStairOptions() {
    const buildingId = document.getElementById('residentBuilding').value;
    const stairSelect = document.getElementById('residentStair');
    const floorSelect = document.getElementById('residentFloor');
    const roomSelect = document.getElementById('residentRoom');

    stairSelect.innerHTML = '<option value="">选择梯号</option>';
    floorSelect.innerHTML = '<option value="">选择层号</option>';
    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!buildingId) return;

    const result = await getStairs(buildingId);
    if (result.success && result.data) {
        result.data.forEach(stair => {
            stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
        });
    }
}

async function updateResidentFloorOptions() {
    const stairId = document.getElementById('residentStair').value;
    const floorSelect = document.getElementById('residentFloor');
    const roomSelect = document.getElementById('residentRoom');

    floorSelect.innerHTML = '<option value="">选择层号</option>';
    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!stairId) return;

    const result = await getFloors(stairId);
    if (result.success && result.data) {
        result.data.forEach(floor => {
            floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
        });
    }
}

async function updateResidentRoomOptions() {
    const floorId = document.getElementById('residentFloor').value;
    const roomSelect = document.getElementById('residentRoom');

    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!floorId) return;

    const result = await getRooms(floorId);
    if (result.success && result.data) {
        result.data.forEach(room => {
            roomSelect.innerHTML += `<option value="${room.id}">${room.roomNumber}</option>`;
        });
    }
}

async function handleAddResident() {
    const name = document.getElementById('residentName').value.trim();
    const phone = document.getElementById('residentPhone').value.trim();
    const buildingId = parseInt(document.getElementById('residentBuilding').value);
    const stairId = parseInt(document.getElementById('residentStair').value);
    const floorId = parseInt(document.getElementById('residentFloor').value);
    const roomId = parseInt(document.getElementById('residentRoom').value);
    const area = parseFloat(document.getElementById('residentArea').value);
    const status = document.getElementById('residentStatus').value;
    const renovationStatus = document.getElementById('residentRenovationStatus').value;
    const property = document.getElementById('residentProperty').value;
    const propertyDescription = document.getElementById('residentPropertyDescription').value.trim() || '';
    const hasDebt = parseInt(document.getElementById('residentHasDebt').value);
    const debtAmount = parseFloat(document.getElementById('residentDebtAmount').value) || 0;
    const debtDescription = document.getElementById('residentDebtDescription').value.trim() || '';
    const remark = document.getElementById('residentRemark').value.trim() || '';

    if (!name || !phone || isNaN(buildingId) || isNaN(stairId) || isNaN(floorId) || isNaN(roomId) || isNaN(area)) {
        alert('请填写所有必填字段');
        return;
    }

    try {
        const floorResult = await getFloors(stairId);
        const floor = floorResult.success ? floorResult.data.find(f => f.id == floorId) : null;

        const roomResult = await getRooms(floorId);
        const room = roomResult.success ? roomResult.data.find(r => r.id == roomId) : null;

        if (!floor || !room) {
            alert('楼层或房号信息错误');
            return;
        }

        const residentData = {
            name,
            phone,
            buildingId,
            stairId,
            floorId,
            roomId,
            area,
            floorNumber: floor.floorNumber,
            roomNumber: room.roomNumber,
            status,
            renovationStatus,
            property,
            propertyDescription,
            hasDebt,
            debtAmount,
            debtDescription,
            remark,
            createdAt: new Date().toISOString()
        };

        const result = await addResident(residentData);

        if (result.success) {
            alert('住户添加成功！');
            closeResidentModal();
            await loadAllResidents();
        } else {
            alert('添加失败：' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('添加住户时出错:', error);
        alert('添加失败：' + error.message);
    }
}

async function editResident(residentId) {
    const resident = allResidents.find(r => r.id === residentId);
    if (!resident) {
        alert('未找到该住户');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'editResidentModal';
    modal.className = 'modal show';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-dialog" style="width: 676px;">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">编辑住户</h4>
                    <button type="button" class="close" onclick="closeEditResidentModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editResidentForm">
                        <input type="hidden" id="editResidentId" value="${resident.id}">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label for="editResidentName">姓名</label>
                                <input type="text" id="editResidentName" class="form-control" value="${resident.name}" required>
                            </div>
                            <div style="flex: 1;">
                                <label for="editResidentPhone">电话</label>
                                <input type="tel" id="editResidentPhone" class="form-control" value="${resident.phone}" required>
                            </div>
                        </div>

                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label for="editResidentBuilding">楼号</label>
                                <select id="editResidentBuilding" class="form-control" onchange="updateEditResidentStairOptions()" required>
                                    <option value="">选择楼号</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="editResidentStair">梯号</label>
                                <select id="editResidentStair" class="form-control" onchange="updateEditResidentFloorOptions()" required>
                                    <option value="">选择</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="editResidentFloor">层号</label>
                                <select id="editResidentFloor" class="form-control" onchange="updateEditResidentRoomOptions()" required>
                                    <option value="">选择</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="editResidentRoom">房号</label>
                                <select id="editResidentRoom" class="form-control" required>
                                    <option value="">选择</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="editResidentArea">面积</label>
                                <input type="number" id="editResidentArea" class="form-control" step="0.01" value="${resident.area}" required>
                            </div>
                        </div>

                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label for="editResidentStatus">状态</label>
                                <select id="editResidentStatus" class="form-control" required>
                                    <option value="active">入住</option>
                                    <option value="inactive">未入住</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="editResidentRenovationStatus">装修状态</label>
                                <select id="editResidentRenovationStatus" class="form-control" required>
                                    <option value="no">未装修</option>
                                    <option value="in_progress">装修中</option>
                                    <option value="completed">已装修</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label for="editResidentProperty">住户性质</label>
                                <select id="editResidentProperty" class="form-control" onchange="toggleEditPropertyDescriptionField()" required>
                                    <option value="excellent">优</option>
                                    <option value="medium">中</option>
                                    <option value="poor">差</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom: 15px; display: none;" id="editPropertyDescriptionField">
                            <label for="editResidentPropertyDescription">性质说明</label>
                            <textarea id="editResidentPropertyDescription" class="form-control" rows="2" placeholder="请输入优/差说明"></textarea>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label for="editResidentHasDebt">是否欠房款</label>
                            <select id="editResidentHasDebt" class="form-control" onchange="toggleEditDebtFields()" required>
                                <option value="0">否</option>
                                <option value="1">是</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 15px; display: none;" id="editDebtFields">
                            <label for="editResidentDebtAmount">欠款金额</label>
                            <input type="number" id="editResidentDebtAmount" class="form-control" step="0.01" value="0">
                        </div>

                        <div style="margin-bottom: 15px; display: none;" id="editDebtDescriptionField">
                            <label for="editResidentDebtDescription">欠款说明</label>
                            <textarea id="editResidentDebtDescription" class="form-control" rows="2"></textarea>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label for="editResidentRemark">备注</label>
                            <textarea id="editResidentRemark" class="form-control" rows="2" placeholder="请输入备注信息"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeEditResidentModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="handleEditResident()">保存</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    await loadEditResidentBuildingOptions(resident.buildingId);
    await loadEditResidentStairOptions(resident.buildingId, resident.stairId);
    await loadEditResidentFloorOptions(resident.stairId, resident.floorId);
    await loadEditResidentRoomOptions(resident.floorId, resident.roomId);

    document.getElementById('editResidentStatus').value = resident.status || 'active';
    document.getElementById('editResidentRenovationStatus').value = resident.renovationStatus || 'no';
    document.getElementById('editResidentProperty').value = resident.property || 'medium';
    document.getElementById('editResidentHasDebt').value = resident.hasDebt ? '1' : '0';
    document.getElementById('editResidentRemark').value = resident.remark || '';

    if (resident.property === 'excellent' || resident.property === 'poor') {
        document.getElementById('editPropertyDescriptionField').style.display = 'block';
        document.getElementById('editResidentPropertyDescription').value = resident.propertyDescription || '';
    }

    if (resident.hasDebt) {
        document.getElementById('editDebtFields').style.display = 'block';
        document.getElementById('editDebtDescriptionField').style.display = 'block';
        document.getElementById('editResidentDebtAmount').value = resident.debtAmount || 0;
        document.getElementById('editResidentDebtDescription').value = resident.debtDescription || '';
    }
}

async function loadEditResidentBuildingOptions(selectedBuildingId) {
    const result = await getBuildings();
    const buildingSelect = document.getElementById('editResidentBuilding');

    if (result.success && result.data) {
        buildingSelect.innerHTML = '<option value="">选择楼号</option>';
        result.data.forEach(building => {
            const selected = building.id == selectedBuildingId ? 'selected' : '';
            buildingSelect.innerHTML += `<option value="${building.id}" ${selected}>${building.number}</option>`;
        });
    }
}

async function loadEditResidentStairOptions(buildingId, selectedStairId) {
    const stairSelect = document.getElementById('editResidentStair');
    const floorSelect = document.getElementById('editResidentFloor');
    const roomSelect = document.getElementById('editResidentRoom');

    stairSelect.innerHTML = '<option value="">选择梯号</option>';
    floorSelect.innerHTML = '<option value="">选择层号</option>';
    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!buildingId) return;

    const result = await getStairs(buildingId);
    if (result.success && result.data) {
        result.data.forEach(stair => {
            const selected = stair.id == selectedStairId ? 'selected' : '';
            stairSelect.innerHTML += `<option value="${stair.id}" ${selected}>${stair.number}</option>`;
        });
    }
}

async function loadEditResidentFloorOptions(stairId, selectedFloorId) {
    const floorSelect = document.getElementById('editResidentFloor');
    const roomSelect = document.getElementById('editResidentRoom');

    floorSelect.innerHTML = '<option value="">选择层号</option>';
    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!stairId) return;

    const result = await getFloors(stairId);
    if (result.success && result.data) {
        result.data.forEach(floor => {
            const selected = floor.id == selectedFloorId ? 'selected' : '';
            floorSelect.innerHTML += `<option value="${floor.id}" ${selected}>${floor.floorNumber}层</option>`;
        });
    }
}

async function loadEditResidentRoomOptions(floorId, selectedRoomId) {
    const roomSelect = document.getElementById('editResidentRoom');

    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!floorId) return;

    const result = await getRooms(floorId);
    if (result.success && result.data) {
        result.data.forEach(room => {
            const selected = room.id == selectedRoomId ? 'selected' : '';
            roomSelect.innerHTML += `<option value="${room.id}" ${selected}>${room.roomNumber}</option>`;
        });
    }
}

function updateEditResidentStairOptions() {
    const buildingId = document.getElementById('editResidentBuilding').value;
    const stairSelect = document.getElementById('editResidentStair');
    const floorSelect = document.getElementById('editResidentFloor');
    const roomSelect = document.getElementById('editResidentRoom');

    stairSelect.innerHTML = '<option value="">选择梯号</option>';
    floorSelect.innerHTML = '<option value="">选择层号</option>';
    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!buildingId) return;

    getStairs(buildingId).then(result => {
        if (result.success && result.data) {
            result.data.forEach(stair => {
                stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
            });
        }
    });
}

function updateEditResidentFloorOptions() {
    const stairId = document.getElementById('editResidentStair').value;
    const floorSelect = document.getElementById('editResidentFloor');
    const roomSelect = document.getElementById('editResidentRoom');

    floorSelect.innerHTML = '<option value="">选择层号</option>';
    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!stairId) return;

    getFloors(stairId).then(result => {
        if (result.success && result.data) {
            result.data.forEach(floor => {
                floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
            });
        }
    });
}

function updateEditResidentRoomOptions() {
    const floorId = document.getElementById('editResidentFloor').value;
    const roomSelect = document.getElementById('editResidentRoom');

    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (!floorId) return;

    getRooms(floorId).then(result => {
        if (result.success && result.data) {
            result.data.forEach(room => {
                roomSelect.innerHTML += `<option value="${room.id}">${room.roomNumber}</option>`;
            });
        }
    });
}

function toggleEditPropertyDescriptionField() {
    const property = document.getElementById('editResidentProperty').value;
    const descriptionField = document.getElementById('editPropertyDescriptionField');
    if (property === 'excellent' || property === 'poor') {
        descriptionField.style.display = 'block';
    } else {
        descriptionField.style.display = 'none';
    }
}

function toggleEditDebtFields() {
    const hasDebt = document.getElementById('editResidentHasDebt').value === '1';
    document.getElementById('editDebtFields').style.display = hasDebt ? 'block' : 'none';
    document.getElementById('editDebtDescriptionField').style.display = hasDebt ? 'block' : 'none';
}

function closeEditResidentModal() {
    const modal = document.getElementById('editResidentModal');
    if (modal) {
        modal.remove();
    }
}

async function handleEditResident() {
    const id = parseInt(document.getElementById('editResidentId').value);
    const name = document.getElementById('editResidentName').value.trim();
    const phone = document.getElementById('editResidentPhone').value.trim();
    const buildingId = parseInt(document.getElementById('editResidentBuilding').value);
    const stairId = parseInt(document.getElementById('editResidentStair').value);
    const floorId = parseInt(document.getElementById('editResidentFloor').value);
    const roomId = parseInt(document.getElementById('editResidentRoom').value);
    const area = parseFloat(document.getElementById('editResidentArea').value);
    const status = document.getElementById('editResidentStatus').value;
    const renovationStatus = document.getElementById('editResidentRenovationStatus').value;
    const property = document.getElementById('editResidentProperty').value;
    const propertyDescription = document.getElementById('editResidentPropertyDescription').value.trim() || '';
    const hasDebt = parseInt(document.getElementById('editResidentHasDebt').value);
    const debtAmount = parseFloat(document.getElementById('editResidentDebtAmount').value) || 0;
    const debtDescription = document.getElementById('editResidentDebtDescription').value.trim() || '';
    const remark = document.getElementById('editResidentRemark').value.trim() || '';

    if (!name || !phone || isNaN(buildingId) || isNaN(stairId) || isNaN(floorId) || isNaN(roomId) || isNaN(area)) {
        alert('请填写所有必填字段');
        return;
    }

    try {
        const floorResult = await getFloors(stairId);
        const floor = floorResult.success ? floorResult.data.find(f => f.id == floorId) : null;

        const roomResult = await getRooms(floorId);
        const room = roomResult.success ? roomResult.data.find(r => r.id == roomId) : null;

        if (!floor || !room) {
            alert('楼层或房号信息错误');
            return;
        }

        const residentData = {
            name,
            phone,
            buildingId,
            stairId,
            floorId,
            roomId,
            area,
            floorNumber: floor.floorNumber,
            roomNumber: room.roomNumber,
            status,
            renovationStatus,
            property,
            propertyDescription,
            hasDebt,
            debtAmount,
            debtDescription,
            remark
        };

        const result = await updateResident(id, residentData);

        if (result.success) {
            alert('住户信息更新成功！');
            closeEditResidentModal();
            await loadAllResidents();
        } else {
            alert('更新失败：' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('更新住户时出错:', error);
        alert('更新失败：' + error.message);
    }
}

async function loadBuildingOptions() {
    const result = await getBuildings();
    const buildingSelect = document.getElementById('buildingSelect');

    if (result.success && result.data) {
        buildingSelect.innerHTML = '<option value="">楼号</option>';
        result.data.forEach(building => {
            buildingSelect.innerHTML += `<option value="${building.id}">${building.number}</option>`;
        });
    }
}

async function updateStairOptions() {
    const buildingId = document.getElementById('buildingSelect').value;
    const stairSelect = document.getElementById('stairSelect');
    const floorSelect = document.getElementById('floorSelect');
    const roomSelect = document.getElementById('roomSelect');

    stairSelect.innerHTML = '<option value="">梯号</option>';
    floorSelect.innerHTML = '<option value="">层号</option>';
    roomSelect.innerHTML = '<option value="">房号</option>';

    if (!buildingId) {
        filterResidents();
        return;
    }

    const result = await getStairs(buildingId);
    if (result.success && result.data) {
        result.data.forEach(stair => {
            stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
        });
    }

    filterResidents();
}

async function updateFloorOptions() {
    const stairId = document.getElementById('stairSelect').value;
    const floorSelect = document.getElementById('floorSelect');
    const roomSelect = document.getElementById('roomSelect');

    floorSelect.innerHTML = '<option value="">层号</option>';
    roomSelect.innerHTML = '<option value="">房号</option>';

    if (!stairId) {
        filterResidents();
        return;
    }

    const result = await getFloors(stairId);
    if (result.success && result.data) {
        result.data.forEach(floor => {
            floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
        });
    }

    filterResidents();
}

async function updateRoomOptions() {
    const floorId = document.getElementById('floorSelect').value;
    const stairId = document.getElementById('stairSelect').value;
    const roomSelect = document.getElementById('roomSelect');

    roomSelect.innerHTML = '<option value="">房号</option>';

    if (!floorId) {
        filterResidents();
        return;
    }

    const result = await getRooms(floorId, stairId);
    if (result.success && result.data) {
        result.data.forEach(room => {
            roomSelect.innerHTML += `<option value="${room.id}">${room.roomNumber}</option>`;
        });
    }

    filterResidents();
}

async function loadAllResidents() {
    const result = await getResidents();
    if (result.success && result.data) {
        allResidents = result.data;
        renderResidents(allResidents);
        updateTotalDebt(allResidents);
    }
}

function updateTotalDebt(filteredResidents) {
    const totalDebt = filteredResidents
        .filter(r => r.hasDebt)
        .reduce((sum, r) => sum + (r.debtAmount || 0), 0);

    const totalDebtDisplay = document.getElementById('totalDebtDisplay');
    if (totalDebt > 0) {
        totalDebtDisplay.textContent = `（欠房款总额：¥${totalDebt.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}）`;
    } else {
        totalDebtDisplay.textContent = '';
    }
}

function filterResidents() {
    const buildingId = document.getElementById('buildingSelect').value;
    const stairId = document.getElementById('stairSelect').value;
    const floorId = document.getElementById('floorSelect').value;
    const roomId = document.getElementById('roomSelect').value;
    const searchText = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
    const statusFilter = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : '';
    const renovationFilter = document.getElementById('renovationFilter') ? document.getElementById('renovationFilter').value : '';
    const debtFilter = document.getElementById('debtFilter') ? document.getElementById('debtFilter').value : '';
    const propertyFilter = document.getElementById('propertyFilter') ? document.getElementById('propertyFilter').value : '';

    let filtered = allResidents;

    if (searchText) {
        filtered = filtered.filter(r =>
            (r.name && r.name.toLowerCase().includes(searchText)) ||
            (r.roomNumber && r.roomNumber.toLowerCase().includes(searchText))
        );
    }

    if (buildingId) {
        filtered = filtered.filter(r => r.buildingId == buildingId);
    }

    if (stairId) {
        filtered = filtered.filter(r => r.stairId == stairId);
    }

    if (floorId) {
        filtered = filtered.filter(r => r.floorId == floorId);
    }

    if (roomId) {
        filtered = filtered.filter(r => r.roomId == roomId);
    }

    if (statusFilter) {
        filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (renovationFilter) {
        filtered = filtered.filter(r => r.renovationStatus === renovationFilter);
    }

    if (debtFilter) {
        filtered = filtered.filter(r => r.hasDebt == debtFilter);
    }

    if (propertyFilter) {
        filtered = filtered.filter(r => r.property === propertyFilter);
    }

    renderResidents(filtered);
    updateTotalDebt(filtered);
}

function renderResidents(residents) {
    const tbody = document.querySelector('table.table tbody');

    if (residents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = residents.map((r, index) => {
        const roomDisplay = r.buildingNumber
            ? `${r.buildingNumber}${r.stairNumber ? r.stairNumber : ''}${r.floorNumber ? r.floorNumber + '层' : ''}${r.roomNumber || ''}`
            : (r.roomNumber || '-');

        const statusText = r.status === 'active' ? '入住' : '未入住';
        const statusClass = r.status === 'active' ? 'text-success' : 'text-warning';

        const renovationStatusText = {
            'completed': '已装修',
            'in_progress': '装修中',
            'no': '未装修'
        }[r.renovationStatus] || '-';

        const debtStatusText = r.hasDebt ? '欠款' : '已结清';
        const debtStatusClass = r.hasDebt ? 'text-danger' : 'text-success';

        const propertyText = {
            'excellent': '优',
            'medium': '中',
            'poor': '差'
        }[r.property] || '-';

        const remarkCard = r.remark ? `<div class="hover-card" style="position: relative; display: inline-block; cursor: pointer;">
            <span class="remark-text">${r.remark.length > 8 ? r.remark.substring(0, 8) + '...' : r.remark}</span>
            <div class="hover-card-content" style="display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 10px 14px; border-radius: 6px; white-space: normal; width: 500px; max-width: 500px; z-index: 1000; font-size: 13px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                ${r.remark}
            </div>
        </div>` : '<span class="text-muted">-</span>';

        let propertyCard = '';
        if (r.property === 'excellent' || r.property === 'poor') {
            propertyCard = `<div class="hover-card" style="position: relative; display: inline-block; cursor: pointer;">
                <span class="text-primary">${propertyText}</span>
                <div class="hover-card-content" style="display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 10px 14px; border-radius: 6px; white-space: normal; width: 300px; max-width: 300px; z-index: 1000; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    ${r.propertyDescription || '无'}
                </div>
            </div>`;
        } else {
            propertyCard = `<span class="text-primary">${propertyText}</span>`;
        }

        let debtCard = '';
        if (r.hasDebt) {
            debtCard = `<div class="hover-card" style="position: relative; display: inline-block; cursor: pointer;">
                <span class="${debtStatusClass}">${debtStatusText}</span>
                <div class="hover-card-content" style="display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 10px 14px; border-radius: 6px; white-space: normal; width: 400px; max-width: 400px; z-index: 1000; font-size: 13px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <div style="margin-bottom: 4px;">¥${r.debtAmount || 0}</div>
                    <div style="color: #ccc;">${r.debtDescription || '无'}</div>
                </div>
            </div>`;
        } else {
            debtCard = `<span class="${debtStatusClass}">${debtStatusText}</span>`;
        }

        const actionButtons = `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); editResident(${r.id})">编辑</button>
                              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); handleDeleteResident(${r.id})">删除</button>`;

        return `
        <tr onclick="showResidentDetails(${r.id})" style="cursor: pointer;">
            <td>${r.id}</td>
            <td>${r.name}</td>
            <td>${r.buildingNumber || '-'}</td>
            <td>${r.stairNumber || '-'}</td>
            <td>${r.floorNumber ? r.floorNumber + '层' : '-'}</td>
            <td>${r.roomNumber || '-'}</td>
            <td>${r.phone || '-'}</td>
            <td>${remarkCard}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td><span class="text-info">${renovationStatusText}</span></td>
            <td>${debtCard}</td>
            <td>${propertyCard}</td>
            <td>${actionButtons}</td>
        </tr>
    `}).join('');

    document.querySelectorAll('.hover-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.querySelector('.hover-card-content').style.display = 'block';
        });
        card.addEventListener('mouseleave', function() {
            this.querySelector('.hover-card-content').style.display = 'none';
        });
    });
}

async function handleDeleteResident(id) {
    if (!confirm('确定要删除该住户吗？')) {
        return;
    }

    try {
        const result = await deleteResident(id);
        if (result.success) {
            alert('删除成功！');
            await loadAllResidents();
        } else {
            alert('删除失败：' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('删除住户时出错:', error);
        alert('删除住户时出错，请重试');
    }
}

function showResidentDetails(residentId) {
    const resident = allResidents.find(r => r.id === residentId);
    if (!resident) return;

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="width: 600px;">
            <div class="modal-header">
                <h3>住户详细信息</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>姓名</label>
                    <div class="form-control-plaintext">${resident.name}</div>
                </div>
                <div class="form-group">
                    <label>电话</label>
                    <div class="form-control-plaintext">${resident.phone || '-'}</div>
                </div>
                <div class="form-group">
                    <label>房屋</label>
                    <div class="form-control-plaintext">${resident.buildingNumber || ''}${resident.stairNumber || ''}${resident.floorNumber ? resident.floorNumber + '层' : ''}${resident.roomNumber || ''}</div>
                </div>
                <div class="form-group">
                    <label>面积</label>
                    <div class="form-control-plaintext">${resident.area || '-'} ㎡</div>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <div class="form-control-plaintext">${resident.status === 'active' ? '入住' : '未入住'}</div>
                </div>
                <div class="form-group">
                    <label>装修状态</label>
                    <div class="form-control-plaintext">${{
                        'completed': '已装修',
                        'in_progress': '装修中',
                        'no': '未装修'
                    }[resident.renovationStatus] || '-'}</div>
                </div>
                <div class="form-group">
                    <label>住户性质</label>
                    <div class="form-control-plaintext">${{
                        'excellent': '优',
                        'medium': '中',
                        'poor': '差'
                    }[resident.property] || '-'}${resident.propertyDescription ? ' - ' + resident.propertyDescription : ''}</div>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <div class="form-control-plaintext">${resident.remark || '-'}</div>
                </div>
                <div class="form-group">
                    <label>是否欠房款</label>
                    <div class="form-control-plaintext">${resident.hasDebt ? '是' : '否'}</div>
                </div>
                ${resident.hasDebt ? `
                <div class="form-group">
                    <label>欠款金额</label>
                    <div class="form-control-plaintext">¥${resident.debtAmount || 0}</div>
                </div>
                <div class="form-group">
                    <label>欠款描述</label>
                    <div class="form-control-plaintext">${resident.debtDescription || '-'}</div>
                </div>
                ` : ''}
                <div class="form-group">
                    <label>创建时间</label>
                    <div class="form-control-plaintext">${resident.createdAt ? new Date(resident.createdAt).toLocaleString() : '-'}</div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}