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

// 测试物业费计算
async function testPropertyFeeCalculation() {
    console.log('========== 开始测试物业费计算 ==========');
    
    console.log('1. 测试getPropertyBuildingFees API...');
    const result = await getPropertyBuildingFees();
    console.log('API返回结果:', result);
    
    if (result.success) {
        console.log('API调用成功，数据:', result.data);
        
        // 测试匹配逻辑
        const testFloors = [3, 5, 8, 10];
        testFloors.forEach(floorNum => {
            console.log(`\n测试楼层 ${floorNum}:`);
            const matchedFee = result.data.find(fee => {
                const description = fee.description || '';
                
                const rangeMatch1 = description.match(/(\d+)-(\d+)层/);
                if (rangeMatch1) {
                    const startFloor = parseInt(rangeMatch1[1]);
                    const endFloor = parseInt(rangeMatch1[2]);
                    const match = floorNum >= startFloor && floorNum <= endFloor;
                    console.log(`  范围匹配1 ${startFloor}-${endFloor}层:`, match ? '✓' : '✗');
                    return match;
                }

                const rangeMatch2 = description.match(/(\d+)至(\d+)层/);
                if (rangeMatch2) {
                    const startFloor = parseInt(rangeMatch2[1]);
                    const endFloor = parseInt(rangeMatch2[2]);
                    const match = floorNum >= startFloor && floorNum <= endFloor;
                    console.log(`  范围匹配2 ${startFloor}至${endFloor}层:`, match ? '✓' : '✗');
                    return match;
                }

                const aboveMatch = description.match(/(\d+)层及以上?/);
                if (aboveMatch) {
                    const startFloor = parseInt(aboveMatch[1]);
                    const match = floorNum >= startFloor;
                    console.log(`  以上匹配 ${startFloor}层及以上:`, match ? '✓' : '✗');
                    return match;
                }

                const belowMatch = description.match(/(\d+)层以下/);
                if (belowMatch) {
                    const endFloor = parseInt(belowMatch[1]);
                    const match = floorNum <= endFloor;
                    console.log(`  以下匹配 ${endFloor}层以下:`, match ? '✓' : '✗');
                    return match;
                }

                const singleMatch = description.match(/^(\d+)层$/);
                if (singleMatch) {
                    const match = parseInt(singleMatch[1]) === floorNum;
                    console.log(`  单层匹配 ${parseInt(singleMatch[1])}层:`, match ? '✓' : '✗');
                    return match;
                }

                return false;
            });
            
            if (matchedFee) {
                console.log(`  ✓ 匹配成功: ${matchedFee.description}, 金额: ${matchedFee.amount}`);
            } else {
                console.log(`  ✗ 未找到匹配的费用`);
            }
        });
    } else {
        console.log('API调用失败:', result.message);
    }
    
    console.log('\n========== 测试结束 ==========');
}

// 处理缴费子项变化
async function handleFeeSubTypeChange() {
    console.log('handleFeeSubTypeChange 被调用');

    const feeType = document.getElementById('feeType').value;
    const feeSubType = document.getElementById('feeSubType').value;

    console.log('当前收费分类:', feeType);
    console.log('当前选择子项:', feeSubType);

    // 如果选择的是物业费，计算单价
    if (feeType === 'property' && feeSubType && currentResident && currentResident.floorNumber && currentResident.area) {
        console.log('开始计算物业费单价');

        const floorNumber = parseInt(currentResident.floorNumber.toString());
        console.log('住户楼层:', floorNumber);
        console.log('住户面积:', currentResident.area);

        try {
            // 从property_building_base_fees表获取费用数据
            const buildingFeesResult = await getPropertyBuildingFees();
            console.log('物业楼层基础费数据:', buildingFeesResult);

            if (buildingFeesResult.success) {
                const buildingFees = buildingFeesResult.data;

                // 根据层号匹配费用
                const matchedFee = buildingFees.find(fee => {
                    const description = fee.description || '';

                    // 匹配"X-Y层"格式
                    const rangeMatch1 = description.match(/(\d+)-(\d+)层/);
                    if (rangeMatch1) {
                        const startFloor = parseInt(rangeMatch1[1]);
                        const endFloor = parseInt(rangeMatch1[2]);
                        return floorNumber >= startFloor && floorNumber <= endFloor;
                    }

                    // 匹配"X至Y层"格式
                    const rangeMatch2 = description.match(/(\d+)至(\d+)层/);
                    if (rangeMatch2) {
                        const startFloor = parseInt(rangeMatch2[1]);
                        const endFloor = parseInt(rangeMatch2[2]);
                        return floorNumber >= startFloor && floorNumber <= endFloor;
                    }

                    // 匹配"X层以上"或"X层及以上"格式
                    const aboveMatch = description.match(/(\d+)层及?以上?/);
                    if (aboveMatch) {
                        const startFloor = parseInt(aboveMatch[1]);
                        return floorNumber >= startFloor;
                    }

                    // 匹配"X层以下"格式
                    const belowMatch = description.match(/(\d+)层以下/);
                    if (belowMatch) {
                        const endFloor = parseInt(belowMatch[1]);
                        return floorNumber <= endFloor;
                    }

                    // 匹配"X层"格式
                    const singleMatch = description.match(/^(\d+)层$/);
                    if (singleMatch) {
                        return parseInt(singleMatch[1]) === floorNumber;
                    }

                    return false;
                });

                console.log('匹配到的费用:', matchedFee);

                if (matchedFee && matchedFee.amount > 0) {
                    // 计算单价：金额 * 面积
                    const unitPrice = matchedFee.amount * currentResident.area;
                    console.log('计算的单价:', unitPrice);

                    const feeUnitPrice = document.getElementById('feeUnitPrice');
                    if (feeUnitPrice) {
                        feeUnitPrice.value = unitPrice.toFixed(2);
                        console.log('单价已设置:', feeUnitPrice.value);
                        // 更新费用金额
                        updateFeeAmount();
                    }
                } else {
                    console.log('没有找到匹配的费用或金额不大于0');
                }
            }
        } catch (err) {
            console.error('获取物业楼层基础费失败:', err);
        }
    }

    // 如果选择的是电梯费，计算单价
    if (feeType === 'elevator' && feeSubType && currentResident) {
        console.log('开始计算电梯费单价');

        // 先获取电梯管理费项目的数据
        const elevatorItemsResult = await getFees('elevator');
        console.log('电梯管理费项目数据:', elevatorItemsResult);
        
        if (elevatorItemsResult.success) {
            const elevatorItem = elevatorItemsResult.data.find(item => item.description === feeSubType);
            
            if (elevatorItem) {
                console.log('找到的电梯管理费项目:', elevatorItem);
                
                // 判断金额是否为0
                if (elevatorItem.amount == 0) {
                    console.log('电梯管理费项目金额为0，使用物业楼层基础费计算');
                    
                    // 数量输入框填写12（月）
                    const feeQuantity = document.getElementById('feeQuantity');
                    if (feeQuantity) {
                        feeQuantity.value = 12;
                        console.log('电梯费数量已设置为12');
                    }
                    
                    // 单位设置为月
                    const feeUnit = document.getElementById('feeUnit');
                    if (feeUnit) {
                        feeUnit.value = '月';
                        console.log('电梯费单位已设置为月');
                    }
                    
                    // 使用物业楼层基础费计算
                    if (currentResident.floorNumber && currentResident.area) {
                        const floorNumber = parseInt(currentResident.floorNumber.toString());
                        console.log('住户楼层:', floorNumber);
                        console.log('住户面积:', currentResident.area);

                        try {
                            // 从property_building_base_fees表获取费用数据
                            const buildingFeesResult = await getPropertyBuildingFees();
                            console.log('物业楼层基础费数据:', buildingFeesResult);

                            if (buildingFeesResult.success) {
                                const buildingFees = buildingFeesResult.data;

                                // 根据层号匹配费用
                                const matchedFee = buildingFees.find(fee => {
                                    const description = fee.description || '';

                                    const rangeMatch1 = description.match(/(\d+)-(\d+)层/);
                                    if (rangeMatch1) {
                                        const startFloor = parseInt(rangeMatch1[1]);
                                        const endFloor = parseInt(rangeMatch1[2]);
                                        return floorNumber >= startFloor && floorNumber <= endFloor;
                                    }

                                    const rangeMatch2 = description.match(/(\d+)至(\d+)层/);
                                    if (rangeMatch2) {
                                        const startFloor = parseInt(rangeMatch2[1]);
                                        const endFloor = parseInt(rangeMatch2[2]);
                                        return floorNumber >= startFloor && floorNumber <= endFloor;
                                    }

                                    const aboveMatch = description.match(/(\d+)层及?以上?/);
                                    if (aboveMatch) {
                                        const startFloor = parseInt(aboveMatch[1]);
                                        return floorNumber >= startFloor;
                                    }

                                    const belowMatch = description.match(/(\d+)层以下/);
                                    if (belowMatch) {
                                        const endFloor = parseInt(belowMatch[1]);
                                        return floorNumber <= endFloor;
                                    }

                                    const singleMatch = description.match(/^(\d+)层$/);
                                    if (singleMatch) {
                                        return parseInt(singleMatch[1]) === floorNumber;
                                    }

                                    return false;
                                });

                                console.log('匹配到的物业楼层基础费:', matchedFee);

                                if (matchedFee && matchedFee.amount > 0) {
                                    // 单价 = 物业楼层基础费金额 × 住户面积
                                    const unitPrice = matchedFee.amount * currentResident.area;
                                    console.log('计算的单价:', unitPrice);

                                    const feeUnitPrice = document.getElementById('feeUnitPrice');
                                    if (feeUnitPrice) {
                                        feeUnitPrice.value = unitPrice.toFixed(2);
                                        console.log('单价已设置:', feeUnitPrice.value);
                                    }
                                    
                                    // 更新金额
                                    const totalAmount = unitPrice * 12;
                                    const amountInput = document.getElementById('feeAmount');
                                    if (amountInput) {
                                        amountInput.value = totalAmount.toFixed(2);
                                        console.log('电梯费金额已设置:', totalAmount.toFixed(2));
                                    }
                                } else {
                                    console.log('没有找到匹配的物业楼层基础费或金额不大于0');
                                }
                            }
                        } catch (err) {
                            console.error('获取物业楼层基础费失败:', err);
                        }
                    }
                } else {
                    console.log('电梯管理费项目金额不为0，直接使用项目金额');
                    
                    // 数量输入框填写1
                    const feeQuantity = document.getElementById('feeQuantity');
                    if (feeQuantity) {
                        feeQuantity.value = 1;
                        console.log('数量已设置为1');
                    }
                    
                    // 单价填写电梯管理费项目的金额
                    const feeUnitPrice = document.getElementById('feeUnitPrice');
                    if (feeUnitPrice) {
                        feeUnitPrice.value = elevatorItem.amount.toFixed(2);
                        console.log('单价已设置:', elevatorItem.amount.toFixed(2));
                    }
                    
                    // 单位设置为年
                    const feeUnit = document.getElementById('feeUnit');
                    if (feeUnit) {
                        feeUnit.value = '年';
                        console.log('单位已设置为年');
                    }
                    
                    // 金额输入框自动填写数量乘单价的结果
                    const totalAmount = elevatorItem.amount * 1;
                    const amountInput = document.getElementById('feeAmount');
                    if (amountInput) {
                        amountInput.value = totalAmount.toFixed(2);
                        console.log('金额已设置:', totalAmount.toFixed(2));
                    }
                }
            }
        }
    }

    // 如果选择的是卫生费，自动填写数量、单价、单位和金额
    if (feeType === 'sanitation' && feeSubType) {
        console.log('开始处理卫生费');

        // 先获取卫生费项目的数据
        const sanitationItemsResult = await getFees('sanitation');
        console.log('卫生费项目数据:', sanitationItemsResult);
        
        if (sanitationItemsResult.success) {
            const sanitationItem = sanitationItemsResult.data.find(item => item.description === feeSubType);
            
            if (sanitationItem) {
                console.log('找到的卫生费项目:', sanitationItem);
                
                // 数量输入框填写1
                const feeQuantity = document.getElementById('feeQuantity');
                if (feeQuantity) {
                    feeQuantity.value = 1;
                    console.log('卫生费数量已设置为1');
                }
                
                // 单价填写卫生费项目的金额
                const feeUnitPrice = document.getElementById('feeUnitPrice');
                if (feeUnitPrice) {
                    feeUnitPrice.value = sanitationItem.amount.toFixed(2);
                    console.log('卫生费单价已设置:', sanitationItem.amount.toFixed(2));
                }
                
                // 单位设置为年
                const feeUnit = document.getElementById('feeUnit');
                if (feeUnit) {
                    feeUnit.value = '年';
                    console.log('卫生费单位已设置为年');
                }
                
                // 金额输入框自动填写数量乘单价的结果
                const totalAmount = sanitationItem.amount * 1;
                const amountInput = document.getElementById('feeAmount');
                if (amountInput) {
                    amountInput.value = totalAmount.toFixed(2);
                    console.log('卫生费金额已设置:', totalAmount.toFixed(2));
                }
            }
        }
    }

    // 如果选择的是汽车停车费，自动填写数量、单价、单位和金额
    if (feeType === 'car' && feeSubType) {
        console.log('开始处理汽车停车费');

        // 先获取汽车停车费项目的数据
        const carItemsResult = await getFees('car');
        console.log('汽车停车费项目数据:', carItemsResult);
        
        if (carItemsResult.success) {
            const carItem = carItemsResult.data.find(item => item.description === feeSubType);
            
            if (carItem) {
                console.log('找到的汽车停车费项目:', carItem);
                
                // 数量输入框填写1
                const feeQuantity = document.getElementById('feeQuantity');
                if (feeQuantity) {
                    feeQuantity.value = 1;
                    console.log('汽车停车费数量已设置为1');
                }
                
                // 单价填写汽车停车费项目的金额
                const feeUnitPrice = document.getElementById('feeUnitPrice');
                if (feeUnitPrice) {
                    feeUnitPrice.value = carItem.amount.toFixed(2);
                    console.log('汽车停车费单价已设置:', carItem.amount.toFixed(2));
                }
                
                // 单位设置为年
                const feeUnit = document.getElementById('feeUnit');
                if (feeUnit) {
                    feeUnit.value = '年';
                    console.log('汽车停车费单位已设置为年');
                }
                
                // 金额输入框自动填写数量乘单价的结果
                const totalAmount = carItem.amount * 1;
                const amountInput = document.getElementById('feeAmount');
                if (amountInput) {
                    amountInput.value = totalAmount.toFixed(2);
                    console.log('汽车停车费金额已设置:', totalAmount.toFixed(2));
                }
            }
        }
    }

    // 如果选择的是摩托车停车费，自动填写数量、单价、单位和金额
    if (feeType === 'motorcycle' && feeSubType) {
        console.log('开始处理摩托车停车费');

        // 先获取摩托车停车费项目的数据
        const motorcycleItemsResult = await getFees('motorcycle');
        console.log('摩托车停车费项目数据:', motorcycleItemsResult);
        
        if (motorcycleItemsResult.success) {
            const motorcycleItem = motorcycleItemsResult.data.find(item => item.description === feeSubType);
            
            if (motorcycleItem) {
                console.log('找到的摩托车停车费项目:', motorcycleItem);
                
                // 数量输入框填写1
                const feeQuantity = document.getElementById('feeQuantity');
                if (feeQuantity) {
                    feeQuantity.value = 1;
                    console.log('摩托车停车费数量已设置为1');
                }
                
                // 单价填写摩托车停车费项目的金额
                const feeUnitPrice = document.getElementById('feeUnitPrice');
                if (feeUnitPrice) {
                    feeUnitPrice.value = motorcycleItem.amount.toFixed(2);
                    console.log('摩托车停车费单价已设置:', motorcycleItem.amount.toFixed(2));
                }
                
                // 单位设置为年
                const feeUnit = document.getElementById('feeUnit');
                if (feeUnit) {
                    feeUnit.value = '年';
                    console.log('摩托车停车费单位已设置为年');
                }
                
                // 金额输入框自动填写数量乘单价的结果
                const totalAmount = motorcycleItem.amount * 1;
                const amountInput = document.getElementById('feeAmount');
                if (amountInput) {
                    amountInput.value = totalAmount.toFixed(2);
                    console.log('摩托车停车费金额已设置:', totalAmount.toFixed(2));
                }
            }
        }
    }

    // 如果选择的是其他费用，自动填写数量、单价、单位和金额
    if (feeType === 'other' && feeSubType) {
        // 检查收费模式，只有自动模式才自动填写
        const feeMode = document.getElementById('feeMode');
        const currentMode = feeMode ? feeMode.value : 'auto';
        
        if (currentMode === 'auto') {
            console.log('开始处理其他费用（自动模式）');

            // 先获取其他费用项目的数据
            const otherItemsResult = await getFees('other');
            console.log('其他费用项目数据:', otherItemsResult);
            
            if (otherItemsResult.success) {
                const otherItem = otherItemsResult.data.find(item => item.description === feeSubType);
                
                if (otherItem) {
                    console.log('找到的其他费用项目:', otherItem);
                    
                    // 数量输入框填写1
                    const feeQuantity = document.getElementById('feeQuantity');
                    if (feeQuantity) {
                        feeQuantity.value = 1;
                        console.log('其他费用数量已设置为1');
                    }
                    
                    // 单价填写其他费用项目的金额
                    const feeUnitPrice = document.getElementById('feeUnitPrice');
                    if (feeUnitPrice) {
                        feeUnitPrice.value = otherItem.amount.toFixed(2);
                        console.log('其他费用单价已设置:', otherItem.amount.toFixed(2));
                    }
                    
                    // 单位设置为次
                    const feeUnit = document.getElementById('feeUnit');
                    if (feeUnit) {
                        feeUnit.value = '次';
                        console.log('其他费用单位已设置为次');
                    }
                    
                    // 金额输入框自动填写数量乘单价的结果
                    const totalAmount = otherItem.amount * 1;
                    const amountInput = document.getElementById('feeAmount');
                    if (amountInput) {
                        amountInput.value = totalAmount.toFixed(2);
                        console.log('其他费用金额已设置:', totalAmount.toFixed(2));
                    }
                }
            }
        } else {
            console.log('当前为手动模式，跳过自动填写');
        }
    }
}

// 处理收费模式切换（自动/手动）
function handleFeeModeChange() {
    const feeMode = document.getElementById('feeMode').value;
    const feeQuantity = document.getElementById('feeQuantity');
    const feeUnit = document.getElementById('feeUnit');
    const feeUnitPrice = document.getElementById('feeUnitPrice');
    const feeAmount = document.getElementById('feeAmount');
    const feeSubTypeSelect = document.getElementById('feeSubType');
    const feeSubTypeInputGroup = document.getElementById('feeSubTypeInputGroup');
    
    console.log('收费模式已切换:', feeMode);
    
    if (feeMode === 'manual') {
        // 手动模式：隐藏子项下拉列表，显示输入框所在的整行
        if (feeSubTypeSelect) {
            feeSubTypeSelect.style.display = 'none';
        }
        if (feeSubTypeInputGroup) {
            feeSubTypeInputGroup.style.display = 'block';
            const feeSubTypeInput = document.getElementById('feeSubTypeInput');
            if (feeSubTypeInput) {
                feeSubTypeInput.value = '';
            }
        }
        
        // 数量输入框：清空并变为可输入状态
        if (feeQuantity) {
            feeQuantity.value = '';
            feeQuantity.disabled = false;
            console.log('数量输入框已启用');
        }
        
        // 单位输入框：清空readonly属性，变为可输入状态
        if (feeUnit) {
            feeUnit.removeAttribute('readonly');
            feeUnit.value = '';
            console.log('单位输入框readonly属性已移除，当前readonly:', feeUnit.hasAttribute('readonly'));
        }
        
        // 单价输入框：清空并变为可输入状态
        if (feeUnitPrice) {
            feeUnitPrice.value = '';
            feeUnitPrice.disabled = false;
            console.log('单价输入框已启用');
        }
        
        // 金额输入框：清空并变为可输入状态，金额会根据数量和单价自动计算
        if (feeAmount) {
            feeAmount.value = '';
            feeAmount.disabled = false;
            console.log('金额输入框已启用');
        }
    } else {
        // 自动模式：显示子项下拉列表，隐藏输入框所在的整行
        if (feeSubTypeSelect) {
            feeSubTypeSelect.style.display = 'block';
        }
        if (feeSubTypeInputGroup) {
            feeSubTypeInputGroup.style.display = 'none';
            const feeSubTypeInput = document.getElementById('feeSubTypeInput');
            if (feeSubTypeInput) {
                feeSubTypeInput.value = '';
            }
        }
        
        // 重新触发子项选择逻辑，自动填充费用
        handleFeeSubTypeChange();
    }
}

// 快速测试API
async function testAPI() {
    console.log('========== 快速测试API ==========');
    try {
        const response = await fetch('http://localhost:3001/api/property-building-fees');
        console.log('HTTP响应状态:', response.status);
        const text = await response.text();
        console.log('响应文本:', text);
        const data = JSON.parse(text);
        console.log('解析后的数据:', data);
    } catch (error) {
        console.error('测试API失败:', error);
    }
    console.log('========== 测试结束 ==========');
}

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
    console.log('更新住户信息，完整住户对象:', resident);
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
            if (unitPrice > 0) {
                const totalAmount = unitPrice * quantity;
                amountInput.value = totalAmount.toFixed(2);
            } else {
                amountInput.value = '';
            }
            break;
        case 'elevator':
            if (unitPrice > 0) {
                const totalAmount = unitPrice * quantity;
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
    console.log('=====================================');
    console.log('updateFeeSubTypeOptions 被调用');
    const feeType = document.getElementById('feeType').value;
    console.log('当前选择的收费分类:', feeType);
    console.log('当前住户:', currentResident);
    console.log('楼层缓存:', floorsCache);
    console.log('=====================================');
    const feeSubTypeSelect = document.getElementById('feeSubType');
    const feeQuantity = document.getElementById('feeQuantity');
    const amountInput = document.getElementById('feeAmount');

    feeSubTypeSelect.innerHTML = '<option value="">选择子项</option>';

    // 获取单价输入框
    const feeUnitPrice = document.getElementById('feeUnitPrice');
    
    // 如果不是水费，清空数量、单位、单价和金额输入框
    if (feeType !== 'water') {
        if (feeQuantity) {
            feeQuantity.value = '';
        }
        
        const feeUnit = document.getElementById('feeUnit');
        if (feeUnit) {
            feeUnit.value = '';
        }
        
        if (feeUnitPrice) {
            feeUnitPrice.value = '';
        }
        
        if (amountInput) {
            amountInput.value = '';
        }
    } else {
        // 如果是水费，只清空金额输入框
        if (amountInput) {
            amountInput.value = '';
        }
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

    const feeMode = document.getElementById('feeMode');
    if (feeMode) {
        console.log('feeMode元素存在:', feeMode);
        if (feeType === 'other') {
            console.log('选择了其他费用，显示feeMode下拉列表');
            feeMode.style.display = 'block';
            feeMode.value = 'auto';
            console.log('feeMode已设置为auto');
        } else {
            console.log('不是其他费用，隐藏feeMode下拉列表');
            feeMode.style.display = 'none';
        }
    } else {
        console.error('feeMode元素不存在！');
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

            // 显示所有物业管理费项目（从property_management_items表）
            propertyFees.forEach(fee => {
                const description = fee.description || '';
                if (description) {
                    feeSubTypeSelect.innerHTML += `<option value="${description}">${description}</option>`;
                }
            });

            // 不自动选择子项，让用户手动选择
            // 用户选择子项后会触发handleFeeSubTypeChange()计算单价
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
                    feeSubTypeSelect.innerHTML += `<option value="${matchedFee.description}">${matchedFee.description}</option>`;
                    feeSubTypeSelect.value = matchedFee.description;
                    updateFeeAmount();
                    return;
                }
            }

            elevatorFees.forEach(fee => {
                const description = fee.description || '';
                if (description) {
                    feeSubTypeSelect.innerHTML += `<option value="${description}">${description}</option>`;
                }
            });
        } else if (feeType === 'car') {
            const carFees = carResult.success ? carResult.data : [];
            carFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${fee.description}">${fee.description}</option>`;
                }
            });
        } else if (feeType === 'motorcycle') {
            const motorcycleFees = motorcycleResult.success ? motorcycleResult.data : [];
            motorcycleFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${fee.description}">${fee.description}</option>`;
                }
            });
        } else if (feeType === 'sanitation') {
            const sanitationFees = sanitationResult.success ? sanitationResult.data : [];
            sanitationFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${fee.description}">${fee.description}</option>`;
                }
            });
        } else if (feeType === 'other') {
            const otherFees = otherResult.success ? otherResult.data : [];
            otherFees.forEach(fee => {
                const amount = fee.amount || 0;
                if (amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${fee.description}">${fee.description}</option>`;
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