// 当前选中的住户
let currentResident = null;
// 临时收费项目列表
let tempPaymentList = [];
// 缓存数据
let buildingsCache = [];
let stairsCache = [];
let floorsCache = [];
let roomsCache = [];
let residentsCache = [];
// 标志：防止搜索函数被重复调用
let isUpdatingResident = false;

// 页面加载完成后初始化
window.addEventListener('load', async function() {
    // 预加载数据
    await preloadData();

    initYearSelect();
    updateFeeTypeOptions();
    updateBuildingOptions();
    setDefaultDate();
});

// 预加载所有数据
async function preloadData() {
    const [buildingsResult, stairsResult, floorsResult, roomsResult, residentsResult] = await Promise.all([
        getBuildings(),
        getStairs(),
        getFloors(),
        getRooms(),
        getResidents()
    ]);

    buildingsCache = buildingsResult.success ? buildingsResult.data : [];
    stairsCache = stairsResult.success ? stairsResult.data : [];
    floorsCache = floorsResult.success ? floorsResult.data : [];
    roomsCache = roomsResult.success ? roomsResult.data : [];
    residentsCache = residentsResult.success ? residentsResult.data : [];
}

// 初始化年份选择
function initYearSelect() {
    const yearSelect = document.getElementById('paymentYear');
    const currentYear = new Date().getFullYear();

    yearSelect.innerHTML = '';
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearSelect.innerHTML += `<option value="${i}" ${i === currentYear ? 'selected' : ''}>${i}年</option>`;
    }

    yearSelect.addEventListener('change', function() {
        if (currentResident) {
            checkPaymentStatus(currentResident.id);
        }
    });
}

// 设置默认日期为今天
function setDefaultDate() {
    const dateInput = document.getElementById('paymentDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

// 更新楼号选项
function updateBuildingOptions() {
    const buildingSelect = document.getElementById('buildingSelect');

    buildingSelect.innerHTML = '<option value="">选择楼号</option>';
    buildingsCache.forEach(building => {
        buildingSelect.innerHTML += `<option value="${building.id}">${building.number}</option>`;
    });
}

// 更新梯号选项
async function updateStairOptions() {
    const buildingId = document.getElementById('buildingSelect').value;
    const stairSelect = document.getElementById('stairSelect');

    stairSelect.innerHTML = '<option value="">选择梯号</option>';

    if (buildingId) {
        const filteredStairs = stairsCache.filter(s => s.buildingId == buildingId);
        filteredStairs.forEach(stair => {
            stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
        });
    }

    document.getElementById('floorSelect').innerHTML = '<option value="">选择层号</option>';
    document.getElementById('roomSelect').innerHTML = '<option value="">选择房号</option>';
    resetResidentInfo();
}

// 更新层号选项
async function updateFloorOptions() {
    const buildingId = document.getElementById('buildingSelect').value;
    const stairId = document.getElementById('stairSelect').value;
    const floorSelect = document.getElementById('floorSelect');

    floorSelect.innerHTML = '<option value="">选择层号</option>';

    if (buildingId && stairId) {
        const filteredFloors = floorsCache.filter(f => f.stairId == stairId).sort((a, b) => a.floorNumber - b.floorNumber);
        filteredFloors.forEach(floor => {
            floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
        });
    }

    document.getElementById('roomSelect').innerHTML = '<option value="">选择房号</option>';
    resetResidentInfo();
}

// 更新房号选项
async function updateRoomOptions() {
    const buildingId = document.getElementById('buildingSelect').value;
    const stairId = document.getElementById('stairSelect').value;
    const floorId = document.getElementById('floorSelect').value;
    const roomSelect = document.getElementById('roomSelect');

    roomSelect.innerHTML = '<option value="">选择房号</option>';

    if (buildingId && stairId && floorId) {
        const floor = floorsCache.find(f => f.id == floorId);
        if (floor) {
            const filteredRooms = roomsCache.filter(r => r.stairId == stairId && r.floorNumber == floor.floorNumber).sort((a, b) => a.roomNumber - b.roomNumber);
            filteredRooms.forEach(room => {
                roomSelect.innerHTML += `<option value="${room.id}">${room.roomNumber}</option>`;
            });
        }
    }

    resetResidentInfo();
}

// 根据房号查询住户
async function loadResidentByRoom() {
    const roomId = document.getElementById('roomSelect').value;

    if (!roomId) {
        resetResidentInfo();
        return;
    }

    console.log('选择的roomId:', roomId, typeof roomId);
    console.log('residentsCache中的住户数量:', residentsCache.length);
    
    const resident = residentsCache.find(r => {
        console.log('比较:', r.roomId, typeof r.roomId, 'vs', roomId, typeof roomId, '结果:', r.roomId == roomId);
        return r.roomId == roomId;
    });
    
    console.log('找到的住户:', resident);

    if (resident) {
        console.log('住户详情:', resident);
        currentResident = resident;
        updateResidentInfo(resident);
        checkPaymentStatus(resident.id);

        document.getElementById('buildingSelect').value = resident.buildingId;

        const stairSelect = document.getElementById('stairSelect');
        stairSelect.innerHTML = '<option value="">选择梯号</option>';
        const filteredStairs = stairsCache.filter(s => s.buildingId == resident.buildingId);
        filteredStairs.forEach(stair => {
            stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
        });
        stairSelect.value = resident.stairId;

        const floorSelect = document.getElementById('floorSelect');
        floorSelect.innerHTML = '<option value="">选择层号</option>';
        const filteredFloors = floorsCache.filter(f => f.stairId == resident.stairId).sort((a, b) => a.floorNumber - b.floorNumber);
        filteredFloors.forEach(floor => {
            floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
        });
        floorSelect.value = resident.floorId;

        const roomSelect = document.getElementById('roomSelect');
        roomSelect.innerHTML = '<option value="">选择房号</option>';
        const floor = floorsCache.find(f => f.id == resident.floorId);
        if (floor) {
            const filteredRooms = roomsCache.filter(r => r.stairId == resident.stairId && r.floorNumber == floor.floorNumber).sort((a, b) => a.roomNumber - b.roomNumber);
            filteredRooms.forEach(room => {
                roomSelect.innerHTML += `<option value="${room.id}">${room.roomNumber}</option>`;
            });
        }
        roomSelect.value = resident.roomId;

        updateFeeSubTypeOptions();
    } else {
        resetResidentInfo();
        alert('该房号暂无住户信息');
    }
}

// 更新住户信息
function updateResidentInfo(resident) {
    isUpdatingResident = true;

    const nameEl = document.getElementById('residentName');
    const phoneEl = document.getElementById('residentPhone');
    const areaEl = document.getElementById('residentArea');
    const searchEl = document.getElementById('residentSearch');

    if (nameEl) nameEl.textContent = resident.name || '-';
    if (phoneEl) phoneEl.textContent = resident.phone || '-';
    if (areaEl) areaEl.textContent = resident.area ? resident.area.toFixed(2) + '㎡' : '-';
    if (searchEl) {
        searchEl.value = resident.name || '';
    }

    setTimeout(() => {
        isUpdatingResident = false;
    }, 100);
}

// 重置住户信息
function resetResidentInfo() {
    currentResident = null;
    document.getElementById('residentName').textContent = '-';
    document.getElementById('residentPhone').textContent = '-';
    document.getElementById('residentArea').textContent = '-';
}

// 辅助函数：获取楼号名称
function getBuildingName(buildingId) {
    const building = buildingsCache.find(b => b.id == buildingId);
    return building ? building.number : '-';
}

// 辅助函数：获取梯号名称
function getStairName(stairId) {
    const stair = stairsCache.find(s => s.id == stairId);
    return stair ? stair.number : '-';
}

// 辅助函数：获取层号名称
function getFloorName(floorId) {
    const floor = floorsCache.find(f => f.id == floorId);
    return floor ? floor.floorNumber + '层' : '-';
}

// 辅助函数：获取房号
function getRoomNumber(roomId) {
    const room = roomsCache.find(r => r.id == roomId);
    return room ? room.roomNumber : '-';
}

// 搜索住户
async function searchResidents() {
    if (isUpdatingResident) {
        console.log('正在更新住户信息，跳过搜索');
        return;
    }

    console.log('搜索函数被调用');
    const searchInput = document.getElementById('residentSearch');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput || !searchResults) {
        console.error('找不到搜索框或搜索结果容器');
        return;
    }

    const searchTerm = searchInput.value.trim();

    console.log('搜索词:', searchTerm);
    console.log('住户缓存数量:', residentsCache.length);

    if (searchTerm.length === 0) {
        searchResults.classList.remove('show');
        searchResults.style.display = 'none';
        return;
    }

    try {
        const filteredResidents = residentsCache.filter(r => {
            if (!r.name) return false;
            return r.name.toLowerCase().includes(searchTerm.toLowerCase());
        });

        console.log('过滤后的住户数量:', filteredResidents.length);

        if (filteredResidents.length === 0) {
            searchResults.innerHTML = '<div class="no-result">无匹配结果</div>';
        } else {
            searchResults.innerHTML = filteredResidents.map(r =>
                `<div class="search-item" onclick="selectResident(${r.id})">
                    <span class="resident-icon">👤</span>
                    <span class="resident-text">${r.name} - ${getRoomNumber(r.roomId || '')}</span>
                </div>`
            ).join('');
        }

        searchResults.style.display = 'block';
        searchResults.classList.add('show');
        console.log('搜索结果已显示');
    } catch (error) {
        console.error('搜索过程中出错:', error);
        searchResults.innerHTML = '<div class="no-result">搜索出错</div>';
        searchResults.style.display = 'block';
        searchResults.classList.add('show');
    }
}

// 选择住户
async function selectResident(residentId) {
    console.log('选择住户被调用, ID:', residentId);
    const resident = residentsCache.find(r => r.id == residentId);

    if (resident) {
        console.log('找到住户:', resident);
        currentResident = resident;

        console.log('更新住户信息显示...');
        updateResidentInfo(resident);
        console.log('住户信息已更新');
        console.log('住户姓名:', resident.name, '电话:', resident.phone, '面积:', resident.area);

        try {
            await checkPaymentStatus(resident.id);
        } catch (error) {
            console.error('检查缴费状态出错:', error);
        }

        document.getElementById('buildingSelect').value = resident.buildingId || '';

        const stairSelect = document.getElementById('stairSelect');
        stairSelect.innerHTML = '<option value="">选择梯号</option>';
        const filteredStairs = stairsCache.filter(s => s.buildingId == resident.buildingId);
        filteredStairs.forEach(stair => {
            stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
        });
        stairSelect.value = resident.stairId || '';

        const floorSelect = document.getElementById('floorSelect');
        floorSelect.innerHTML = '<option value="">选择层号</option>';
        const filteredFloors = floorsCache.filter(f => f.stairId == resident.stairId).sort((a, b) => a.floorNumber - b.floorNumber);
        filteredFloors.forEach(floor => {
            floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
        });
        floorSelect.value = resident.floorId || '';

        const roomSelect = document.getElementById('roomSelect');
        roomSelect.innerHTML = '<option value="">选择房号</option>';
        const floor = floorsCache.find(f => f.id == resident.floorId);
        if (floor) {
            const filteredRooms = roomsCache.filter(r => r.stairId == resident.stairId && r.floorNumber == floor.floorNumber).sort((a, b) => a.roomNumber - b.roomNumber);
            filteredRooms.forEach(room => {
                roomSelect.innerHTML += `<option value="${room.id}">${room.roomNumber}</option>`;
            });
        }
        roomSelect.value = resident.roomId || '';

        try {
            await updateFeeSubTypeOptions();
        } catch (error) {
            console.error('更新费用子项出错:', error);
        }
    } else {
        console.warn('未找到ID为', residentId, '的住户');
    }

    const searchResults = document.getElementById('searchResults');
    searchResults.classList.remove('show');
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';
    console.log('搜索结果已关闭');
}

// 检查缴费状态
async function checkPaymentStatus(residentId) {
    console.log('检查缴费状态:', residentId);
    const year = document.getElementById('paymentYear').value;
    
    try {
        const result = await getPayments();
        const payments = result.success ? result.data.filter(p => p.residentId == residentId && p.year == year && p.feeType == 'property') : [];

        const hasPaid = payments.length > 0;

        const statusElement = document.getElementById('propertyFeeStatus');
        if (statusElement) {
            if (hasPaid) {
                statusElement.textContent = '已缴费';
                statusElement.className = 'value paid';
            } else {
                statusElement.textContent = '未缴费';
                statusElement.className = 'value unpaid';
            }
        } else {
            console.warn('未找到propertyFeeStatus元素');
        }
    } catch (error) {
        console.error('检查缴费状态出错:', error);
    }
}

// 获取缴费记录
async function getPayments() {
    return await apiGet('/payments');
}

// 更新费用金额
function updateFeeAmount() {
    const feeType = document.getElementById('feeType').value;
    const feeSubType = document.getElementById('feeSubType').value;
    const feeUnitPrice = document.getElementById('feeUnitPrice');
    const feeQuantity = document.getElementById('feeQuantity');
    const feeUnit = document.getElementById('feeUnit');
    const amountInput = document.getElementById('feeAmount');

    if (!feeType) {
        amountInput.value = '';
        return;
    }

    if (feeType !== 'water' && !currentResident) {
        amountInput.value = '';
        return;
    }

    let quantity = feeQuantity ? parseInt(feeQuantity.value) || 1 : 1;

    if (feeType === 'property') {
        if (quantity < 1) quantity = 1;
        if (quantity > 12) quantity = 12;
        if (feeQuantity) feeQuantity.value = quantity;
    }

    let unitPrice = 0;
    if (feeUnitPrice && feeUnitPrice.value) {
        unitPrice = parseFloat(feeUnitPrice.value);
    } else if (feeSubType) {
        unitPrice = parseFloat(feeSubType);
    }

    switch (feeType) {
        case 'property':
            if (unitPrice > 0 && currentResident) {
                const area = currentResident.area || 0;
                const totalAmount = unitPrice * area * quantity;
                amountInput.value = totalAmount.toFixed(2);
            } else {
                amountInput.value = '';
            }
            break;
        case 'car':
        case 'motorcycle':
        case 'sanitation':
        case 'other':
        case 'water':
            if (unitPrice > 0) {
                amountInput.value = (unitPrice * quantity).toFixed(2);
            } else {
                amountInput.value = '';
            }
            break;
        default:
            amountInput.value = '';
            break;
    }
}

// 获取费用类型名称
function getFeeTypeName(feeType) {
    const typeNames = {
        'property': '物业费',
        'elevator': '电梯费',
        'sanitation': '卫生费',
        'car': '汽车停车费',
        'motorcycle': '摩托车停车费',
        'water': '水费',
        'other': '其他费用'
    };
    return typeNames[feeType] || feeType;
}

// 更新缴费分类选项
async function updateFeeTypeOptions() {
    // 直接使用HTML中设置的选项，不覆盖
    updateFeeSubTypeOptions();
}

// 更新缴费子项选项
async function updateFeeSubTypeOptions() {
    const feeType = document.getElementById('feeType').value;
    const feeSubTypeSelect = document.getElementById('feeSubType');
    const feeQuantity = document.getElementById('feeQuantity');
    const amountInput = document.getElementById('feeAmount');

    feeSubTypeSelect.innerHTML = '<option value="">选择子项</option>';

    if (amountInput) {
        amountInput.value = '';
    }

    if ((feeType === 'property' || feeType === 'sanitation' || feeType === 'elevator') && !currentResident) {
        alert('请先选择住户');
        document.getElementById('feeType').value = '';
        document.getElementById('residentSearch').focus();
        return;
    }

    if (feeQuantity) {
        if (feeType === 'property' || feeType === 'elevator') {
            feeQuantity.value = 12;
            feeQuantity.min = 1;
            feeQuantity.max = 12;
            feeQuantity.disabled = false;
            feeQuantity.style.backgroundColor = '';
        } else if (feeType === 'sanitation' || feeType === 'car' || feeType === 'motorcycle') {
            feeQuantity.value = 1;
            feeQuantity.min = 1;
            feeQuantity.max = 1;
            feeQuantity.disabled = false;
            feeQuantity.style.backgroundColor = '';
        } else {
            feeQuantity.value = 1;
            feeQuantity.disabled = true;
            feeQuantity.style.backgroundColor = '#f0f0f0';
        }
    }

    const feeUnit = document.getElementById('feeUnit');
    if (feeUnit) {
        if (feeType === 'property') {
            feeUnit.value = '月';
            feeUnit.disabled = true;
            feeUnit.style.backgroundColor = '#f0f0f0';
        } else if (feeType === 'elevator') {
            feeUnit.value = '月';
            feeUnit.disabled = true;
            feeUnit.style.backgroundColor = '#f0f0f0';
        } else if (feeType === 'sanitation') {
            feeUnit.value = '年';
            feeUnit.disabled = true;
            feeUnit.style.backgroundColor = '#f0f0f0';
        } else if (feeType === 'motorcycle') {
            feeUnit.value = '年';
            feeUnit.disabled = true;
            feeUnit.style.backgroundColor = '#f0f0f0';
        } else if (feeType === 'car') {
            feeUnit.value = '年';
            feeUnit.disabled = true;
            feeUnit.style.backgroundColor = '#f0f0f0';
        } else if (feeType === 'water') {
            feeUnit.value = '月';
            feeUnit.disabled = true;
            feeUnit.style.backgroundColor = '#f0f0f0';
        } else if (feeType === 'other') {
            feeUnit.value = '次';
            feeUnit.disabled = true;
            feeUnit.style.backgroundColor = '#f0f0f0';
        } else {
            feeUnit.value = '';
            feeUnit.disabled = false;
            feeUnit.style.backgroundColor = '';
        }
    }

    const feeModeGroup = document.getElementById('feeModeGroup');
    if (feeModeGroup) {
        feeModeGroup.style.display = feeType === 'other' ? 'block' : 'none';
    }

    if (feeType === 'water') {
        if (feeSubTypeSelect) {
            feeSubTypeSelect.disabled = true;
            feeSubTypeSelect.style.backgroundColor = '#f0f0f0';
        }
        const feeUnitPrice = document.getElementById('feeUnitPrice');
        if (feeUnitPrice) {
            feeUnitPrice.value = '';
            feeUnitPrice.focus();
        }
    } else {
        if (feeSubTypeSelect) {
            feeSubTypeSelect.disabled = false;
            feeSubTypeSelect.style.backgroundColor = '';
        }
    }

    if (feeType) {
        const [propertyResult, elevatorResult, carResult, motorcycleResult, sanitationResult, otherResult] = await Promise.all([
            getFees('property'),
            getFees('elevator'),
            getFees('car'),
            getFees('motorcycle'),
            getFees('sanitation'),
            getFees('other')
        ]);

        if (feeType === 'property') {
            const propertyFees = propertyResult.success ? propertyResult.data : [];

            // 显示所有物业管理费项目
            propertyFees.forEach(fee => {
                const description = fee.description || '';
                if (description) {
                    feeSubTypeSelect.innerHTML += `<option value="${description}">${description}</option>`;
                }
            });

            // 如果选择了住户，自动选择匹配楼层的项目
            if (currentResident && currentResident.floorId && propertyFees.length > 0) {
                const floor = floorsCache.find(f => f.id == currentResident.floorId);
                if (floor) {
                    const currentFloor = parseInt(floor.floorNumber.toString());
                    const matchedFee = propertyFees.find(fee => {
                        const description = fee.description || '';

                        const rangeMatch1 = description.match(/(\d+)-(\d+)层/);
                        if (rangeMatch1) {
                            const startFloor = parseInt(rangeMatch1[1]);
                            const endFloor = parseInt(rangeMatch1[2]);
                            return currentFloor >= startFloor && currentFloor <= endFloor;
                        }

                        const rangeMatch2 = description.match(/(\d+)至(\d+)层/);
                        if (rangeMatch2) {
                            const startFloor = parseInt(rangeMatch2[1]);
                            const endFloor = parseInt(rangeMatch2[2]);
                            return currentFloor >= startFloor && currentFloor <= endFloor;
                        }

                        const aboveMatch = description.match(/(\d+)层及以上?/);
                        if (aboveMatch) {
                            const startFloor = parseInt(aboveMatch[1]);
                            return currentFloor >= startFloor;
                        }

                        const belowMatch = description.match(/(\d+)层以下/);
                        if (belowMatch) {
                            const endFloor = parseInt(belowMatch[1]);
                            return currentFloor <= endFloor;
                        }

                        const singleMatch = description.match(/^(\d+)层$/);
                        if (singleMatch) {
                            return parseInt(singleMatch[1]) === currentFloor;
                        }

                        return false;
                    });

                    if (matchedFee && matchedFee.description) {
                        feeSubTypeSelect.value = matchedFee.description;
                    }
                }
            }
        } else if (feeType === 'elevator') {
            const elevatorFees = elevatorResult.success ? elevatorResult.data : [];

            let floorNumber = '';
            if (currentResident && currentResident.floorId) {
                const floor = floorsCache.find(f => f.id == currentResident.floorId);
                if (floor) {
                    floorNumber = floor.floorNumber.toString();
                }
            }

            if (floorNumber && elevatorFees.length > 0) {
                const currentFloor = parseInt(floorNumber);
                const matchedFee = elevatorFees.find(fee => {
                    const description = fee.description || '';

                    const rangeMatch1 = description.match(/(\d+)-(\d+)层/);
                    if (rangeMatch1) {
                        const startFloor = parseInt(rangeMatch1[1]);
                        const endFloor = parseInt(rangeMatch1[2]);
                        return currentFloor >= startFloor && currentFloor <= endFloor;
                    }

                    const rangeMatch2 = description.match(/(\d+)至(\d+)层/);
                    if (rangeMatch2) {
                        const startFloor = parseInt(rangeMatch2[1]);
                        const endFloor = parseInt(rangeMatch2[2]);
                        return currentFloor >= startFloor && currentFloor <= endFloor;
                    }

                    const aboveMatch = description.match(/(\d+)层及以上?/);
                    if (aboveMatch) {
                        const startFloor = parseInt(aboveMatch[1]);
                        return currentFloor >= startFloor;
                    }

                    const belowMatch = description.match(/(\d+)层以下/);
                    if (belowMatch) {
                        const endFloor = parseInt(belowMatch[1]);
                        return currentFloor <= endFloor;
                    }

                    const singleMatch = description.match(/^(\d+)层$/);
                    if (singleMatch) {
                        return parseInt(singleMatch[1]) === currentFloor;
                    }

                    return false;
                });

                if (matchedFee && matchedFee.amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${matchedFee.amount}">${matchedFee.description}</option>`;
                    feeSubTypeSelect.value = matchedFee.amount;
                    updateFeeAmount();
                    return;
                }
            }

            elevatorFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${amount}">${fee.description}</option>`;
                }
            });
        } else if (feeType === 'car') {
            const carFees = carResult.success ? carResult.data : [];
            carFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${amount}">${fee.description}</option>`;
                }
            });
        } else if (feeType === 'motorcycle') {
            const motorcycleFees = motorcycleResult.success ? motorcycleResult.data : [];
            motorcycleFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${amount}">${fee.description}</option>`;
                }
            });
        } else if (feeType === 'sanitation') {
            const sanitationFees = sanitationResult.success ? sanitationResult.data : [];
            sanitationFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${amount}">${fee.description}</option>`;
                }
            });
        } else if (feeType === 'other') {
            const otherFees = otherResult.success ? otherResult.data : [];
            otherFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${amount}">${fee.description}</option>`;
                }
            });
        }
    }
}

// 添加到列表
function addToPaymentList() {
    const feeType = document.getElementById('feeType').value;
    const feeMode = document.getElementById('feeMode') ? document.getElementById('feeMode').value : 'auto';
    const feeSubType = document.getElementById('feeSubType').value;
    const feeUnitPrice = document.getElementById('feeUnitPrice') ? document.getElementById('feeUnitPrice').value : '';
    const feeQuantity = document.getElementById('feeQuantity') ? document.getElementById('feeQuantity').value : 1;
    const feeUnit = document.getElementById('feeUnit') ? document.getElementById('feeUnit').value : '';
    const amount = document.getElementById('feeAmount').value;
    const year = document.getElementById('paymentYear').value;
    const date = document.getElementById('paymentDate').value;

    if (!currentResident) {
        alert('请先选择住户');
        return;
    }

    if (!feeType) {
        alert('请选择缴费类型');
        return;
    }

    if (!amount || parseFloat(amount) <= 0) {
        alert('请输入有效的金额');
        return;
    }

    const paymentItem = {
        id: Date.now(),
        residentId: currentResident.id,
        residentName: currentResident.name,
        feeType: feeType,
        feeTypeName: getFeeTypeName(feeType),
        feeMode: feeMode,
        feeSubType: feeSubType,
        feeUnitPrice: feeUnitPrice,
        feeQuantity: feeQuantity,
        feeUnit: feeUnit,
        amount: parseFloat(amount),
        year: year,
        date: date
    };

    tempPaymentList.push(paymentItem);
    renderPaymentList();

    document.getElementById('feeType').value = '';
    document.getElementById('feeSubType').innerHTML = '<option value="">选择子项</option>';
    document.getElementById('feeUnitPrice').value = '';
    document.getElementById('feeAmount').value = '';
}

// 渲染收费项目列表
function renderPaymentList() {
    const listContainer = document.getElementById('paymentList');

    if (tempPaymentList.length === 0) {
        listContainer.innerHTML = '<div class="empty-list">暂无收费项目</div>';
        return;
    }

    listContainer.innerHTML = tempPaymentList.map(item => `
        <div class="payment-item">
            <div class="payment-info">
                <span class="payment-type">${item.feeTypeName}</span>
                ${item.feeQuantity ? `<span class="payment-quantity">${item.feeQuantity}${item.feeUnit || ''}</span>` : ''}
                <span class="payment-amount">¥${item.amount.toFixed(2)}</span>
                <span class="payment-year">${item.year}年</span>
            </div>
            <button class="btn-remove" onclick="removeFromPaymentList(${item.id})">删除</button>
        </div>
    `).join('');
}

// 从列表中删除
function removeFromPaymentList(id) {
    tempPaymentList = tempPaymentList.filter(item => item.id !== id);
    renderPaymentList();
}

// 确认收费
async function confirmPayment() {
    if (tempPaymentList.length === 0) {
        alert('请先添加收费项目');
        return;
    }

    for (const item of tempPaymentList) {
        await apiPost('/payments', {
            residentId: item.residentId,
            feeType: item.feeType,
            amount: item.amount,
            paymentDate: item.date,
            status: 'paid'
        });
    }

    alert('收费成功！');

    tempPaymentList = [];
    renderPaymentList();

    if (currentResident) {
        await checkPaymentStatus(currentResident.id);
    }
}

// 点击页面其他地方关闭搜索结果
document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.classList.remove('show');
        }
    }
});