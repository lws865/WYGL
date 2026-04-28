/**
 * 收费平台页面业务逻辑
 * 负责住户搜索、费用计算、收费管理等核心功能
 */

// 当前选中的住户对象
let currentResident = null;
// 临时收费项目列表（待确认收费的项目）
let tempPaymentList = [];
// 缓存数据：楼栋、梯号、层号、房号、住户
let buildingsCache = [];
let stairsCache = [];
let floorsCache = [];
let roomsCache = [];
let residentsCache = [];
// 标志：防止搜索函数被重复调用（用于避免updateResidentInfo触发搜索）
let isUpdatingResident = false;

/**
 * 测试物业费计算功能
 * 用于调试和验证楼层匹配逻辑
 */
async function testPropertyFeeCalculation() {
    console.log('========== 开始测试物业费计算 ==========');
    
    // 测试获取物业楼层基础费API
    console.log('1. 测试getPropertyBuildingFees API...');
    const result = await getPropertyBuildingFees();
    console.log('API返回结果:', result);
    
    // 如果API调用成功，测试匹配逻辑
    if (result.success) {
        console.log('API调用成功，数据:', result.data);
        
        // 测试不同楼层的匹配情况
        const testFloors = [3, 5, 8, 10];
        testFloors.forEach(floorNum => {
            console.log(`\n测试楼层 ${floorNum}:`);
            const matchedFee = result.data.find(fee => {
                const description = fee.description || '';
                
                // 匹配"X-Y层"格式
                const rangeMatch1 = description.match(/(\d+)-(\d+)层/);
                if (rangeMatch1) {
                    const startFloor = parseInt(rangeMatch1[1]);
                    const endFloor = parseInt(rangeMatch1[2]);
                    const match = floorNum >= startFloor && floorNum <= endFloor;
                    console.log(`  范围匹配1 ${startFloor}-${endFloor}层:`, match ? '✓' : '✗');
                    return match;
                }

                // 匹配"X至Y层"格式
                const rangeMatch2 = description.match(/(\d+)至(\d+)层/);
                if (rangeMatch2) {
                    const startFloor = parseInt(rangeMatch2[1]);
                    const endFloor = parseInt(rangeMatch2[2]);
                    const match = floorNum >= startFloor && floorNum <= endFloor;
                    console.log(`  范围匹配2 ${startFloor}至${endFloor}层:`, match ? '✓' : '✗');
                    return match;
                }

                // 匹配"X层及以上"格式
                const aboveMatch = description.match(/(\d+)层及以上?/);
                if (aboveMatch) {
                    const startFloor = parseInt(aboveMatch[1]);
                    const match = floorNum >= startFloor;
                    console.log(`  以上匹配 ${startFloor}层及以上:`, match ? '✓' : '✗');
                    return match;
                }

                // 匹配"X层以下"格式
                const belowMatch = description.match(/(\d+)层以下/);
                if (belowMatch) {
                    const endFloor = parseInt(belowMatch[1]);
                    const match = floorNum <= endFloor;
                    console.log(`  以下匹配 ${endFloor}层以下:`, match ? '✓' : '✗');
                    return match;
                }

                // 匹配"X层"格式
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

/**
 * 处理缴费子项变化
 * 根据选择的费用类型和子项自动计算并填充费用信息
 */
async function handleFeeSubTypeChange() {
    console.log('handleFeeSubTypeChange 被调用');

    // 获取当前选择的收费分类和子项
    const feeType = document.getElementById('feeType').value;
    const feeSubType = document.getElementById('feeSubType').value;

    console.log('当前收费分类:', feeType);
    console.log('当前选择子项:', feeSubType);

    // ==================== 物业费处理 ====================
    if (feeType === 'property' && feeSubType && currentResident && currentResident.floorNumber && currentResident.area) {
        console.log('开始计算物业费单价');

        // 获取住户楼层和面积
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

                    // 设置单价输入框（禁用状态，灰色不可写）
                    const feeUnitPrice = document.getElementById('feeUnitPrice');
                    if (feeUnitPrice) {
                        feeUnitPrice.value = unitPrice.toFixed(2);
                        feeUnitPrice.disabled = true;
                        feeUnitPrice.style.backgroundColor = '#f0f0f0';
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

    // ==================== 电梯费处理 ====================
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
                                    setFeeAmount(totalAmount.toFixed(2));
                                    console.log('电梯费金额已设置:', totalAmount.toFixed(2));
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
                    setFeeAmount(totalAmount.toFixed(2));
                    console.log('金额已设置:', totalAmount.toFixed(2));
                }
            }
        }
    }

    // ==================== 卫生费处理 ====================
    if (feeType === 'sanitation' && feeSubType) {
        console.log('开始处理卫生费');

        // 获取卫生费项目的数据
        const sanitationItemsResult = await getFees('sanitation');
        console.log('卫生费项目数据:', sanitationItemsResult);
        
        if (sanitationItemsResult.success) {
            const sanitationItem = sanitationItemsResult.data.find(item => item.description === feeSubType);
            
            if (sanitationItem) {
                console.log('找到的卫生费项目:', sanitationItem);
                
                // 设置数量为1
                const feeQuantity = document.getElementById('feeQuantity');
                if (feeQuantity) {
                    feeQuantity.value = 1;
                    console.log('卫生费数量已设置为1');
                }
                
                // 设置单价（禁用状态，灰色不可写）
                const feeUnitPrice = document.getElementById('feeUnitPrice');
                if (feeUnitPrice) {
                    feeUnitPrice.value = sanitationItem.amount.toFixed(2);
                    feeUnitPrice.disabled = true;
                    feeUnitPrice.style.backgroundColor = '#f0f0f0';
                    console.log('卫生费单价已设置:', sanitationItem.amount.toFixed(2));
                }
                
                // 设置单位为年（禁用状态，灰色不可写）
                const feeUnit = document.getElementById('feeUnit');
                if (feeUnit) {
                    feeUnit.value = '年';
                    feeUnit.disabled = true;
                    feeUnit.style.backgroundColor = '#f0f0f0';
                    console.log('卫生费单位已设置为年');
                }
                
                // 设置金额
                const totalAmount = sanitationItem.amount * 1;
                setFeeAmount(totalAmount.toFixed(2));
                console.log('卫生费金额已设置:', totalAmount.toFixed(2));
            }
        }
    }

    // ==================== 汽车停车费处理 ====================
    if (feeType === 'car' && feeSubType) {
        console.log('开始处理汽车停车费');

        // 获取汽车停车费项目的数据
        const carItemsResult = await getFees('car');
        console.log('汽车停车费项目数据:', carItemsResult);
        
        if (carItemsResult.success) {
            const carItem = carItemsResult.data.find(item => item.description === feeSubType);
            
            if (carItem) {
                console.log('找到的汽车停车费项目:', carItem);
                
                // 设置数量为1
                const feeQuantity = document.getElementById('feeQuantity');
                if (feeQuantity) {
                    feeQuantity.value = 1;
                    console.log('汽车停车费数量已设置为1');
                }
                
                // 设置单价（禁用状态，灰色不可写）
                const feeUnitPrice = document.getElementById('feeUnitPrice');
                if (feeUnitPrice) {
                    feeUnitPrice.value = carItem.amount.toFixed(2);
                    feeUnitPrice.disabled = true;
                    feeUnitPrice.style.backgroundColor = '#f0f0f0';
                    console.log('汽车停车费单价已设置:', carItem.amount.toFixed(2));
                }
                
                // 根据描述中的括号内容设置单位
                const feeUnit = document.getElementById('feeUnit');
                if (feeUnit) {
                    // 匹配括号内的内容
                    const description = carItem.description || '';
                    const bracketMatch = description.match(/（([^）]+)）/); // 匹配中文括号
                    if (!bracketMatch) {
                        // 如果没有中文括号，尝试匹配英文括号
                        bracketMatch = description.match(/\(([^)]+)\)/);
                    }
                    
                    let unit = '年'; // 默认单位为年
                    if (bracketMatch && bracketMatch[1]) {
                        const bracketContent = bracketMatch[1];
                        console.log('括号内内容:', bracketContent);
                        if (bracketContent.includes('月费')) {
                            unit = '月';
                        } else if (bracketContent.includes('年费')) {
                            unit = '年';
                        }
                    }
                    
                    feeUnit.value = unit;
                    feeUnit.disabled = true;
                    feeUnit.style.backgroundColor = '#f0f0f0';
                    console.log('汽车停车费单位已设置为:', unit);
                }
                
                // 设置金额
                const totalAmount = carItem.amount * 1;
                setFeeAmount(totalAmount.toFixed(2));
                console.log('汽车停车费金额已设置:', totalAmount.toFixed(2));
            }
        }
    }

    // ==================== 摩托车停车费处理 ====================
    if (feeType === 'motorcycle' && feeSubType) {
        console.log('开始处理摩托车停车费');

        // 获取摩托车停车费项目的数据
        const motorcycleItemsResult = await getFees('motorcycle');
        console.log('摩托车停车费项目数据:', motorcycleItemsResult);
        
        if (motorcycleItemsResult.success) {
            const motorcycleItem = motorcycleItemsResult.data.find(item => item.description === feeSubType);
            
            if (motorcycleItem) {
                console.log('找到的摩托车停车费项目:', motorcycleItem);
                
                // 设置数量为1
                const feeQuantity = document.getElementById('feeQuantity');
                if (feeQuantity) {
                    feeQuantity.value = 1;
                    console.log('摩托车停车费数量已设置为1');
                }
                
                // 设置单价（禁用状态，灰色不可写）
                const feeUnitPrice = document.getElementById('feeUnitPrice');
                if (feeUnitPrice) {
                    feeUnitPrice.value = motorcycleItem.amount.toFixed(2);
                    feeUnitPrice.disabled = true;
                    feeUnitPrice.style.backgroundColor = '#f0f0f0';
                    console.log('摩托车停车费单价已设置:', motorcycleItem.amount.toFixed(2));
                }
                
                // 设置单位为年（禁用状态，灰色不可写）
                const feeUnit = document.getElementById('feeUnit');
                if (feeUnit) {
                    feeUnit.value = '年';
                    feeUnit.disabled = true;
                    feeUnit.style.backgroundColor = '#f0f0f0';
                    console.log('摩托车停车费单位已设置为年');
                }
                
                // 设置金额
                const totalAmount = motorcycleItem.amount * 1;
                setFeeAmount(totalAmount.toFixed(2));
                console.log('摩托车停车费金额已设置:', totalAmount.toFixed(2));
            }
        }
    }

    // ==================== 其他费用处理 ====================
    if (feeType === 'other' && feeSubType) {
        // 检查收费模式
        const feeMode = document.getElementById('feeMode');
        const currentMode = feeMode ? feeMode.value : 'auto';
        
        if (currentMode === 'manual') {
            // 手动模式：确保所有输入框可写入
            const feeQuantity = document.getElementById('feeQuantity');
            const feeUnit = document.getElementById('feeUnit');
            const feeUnitPrice = document.getElementById('feeUnitPrice');
            const feeAmount = document.getElementById('feeAmount');
            
            // 数量输入框：可写入状态
            if (feeQuantity) {
                feeQuantity.disabled = false;
                feeQuantity.style.backgroundColor = '';
            }
            
            // 单位输入框：可写入状态
            if (feeUnit) {
                feeUnit.removeAttribute('readonly');
                feeUnit.disabled = false;
                feeUnit.style.backgroundColor = '';
            }
            
            // 单价输入框：可写入状态
            if (feeUnitPrice) {
                feeUnitPrice.disabled = false;
                feeUnitPrice.style.backgroundColor = '';
            }
            
            // 金额输入框：可写入状态（金额会根据数量和单价自动计算）
            if (feeAmount) {
                feeAmount.disabled = false;
                feeAmount.style.backgroundColor = '';
            }
            
            console.log('其他费用手动模式：所有输入框已设置为可写入状态');
            return;
        }
        
        if (currentMode === 'auto') {
            console.log('开始处理其他费用（自动模式）');

            // 获取其他费用项目的数据
            const otherItemsResult = await getFees('other');
            console.log('其他费用项目数据:', otherItemsResult);
            
            if (otherItemsResult.success) {
                const otherItem = otherItemsResult.data.find(item => item.description === feeSubType);
                
                if (otherItem) {
                    console.log('找到的其他费用项目:', otherItem);
                    
                    // 设置数量为1
                    const feeQuantity = document.getElementById('feeQuantity');
                    if (feeQuantity) {
                        feeQuantity.value = 1;
                        console.log('其他费用数量已设置为1');
                    }
                    
                    // 设置单价（禁用状态，灰色不可写）
                    const feeUnitPrice = document.getElementById('feeUnitPrice');
                    if (feeUnitPrice) {
                        feeUnitPrice.value = otherItem.amount.toFixed(2);
                        feeUnitPrice.disabled = true;
                        feeUnitPrice.style.backgroundColor = '#f0f0f0';
                        console.log('其他费用单价已设置:', otherItem.amount.toFixed(2));
                    }
                    
                    // 设置单位为次（禁用状态，灰色不可写）
                    const feeUnit = document.getElementById('feeUnit');
                    if (feeUnit) {
                        feeUnit.value = '次';
                        feeUnit.disabled = true;
                        feeUnit.style.backgroundColor = '#f0f0f0';
                        console.log('其他费用单位已设置为次');
                    }
                    
                    // 设置金额
                    const totalAmount = otherItem.amount * 1;
                    setFeeAmount(totalAmount.toFixed(2));
                    console.log('其他费用金额已设置:', totalAmount.toFixed(2));
                }
            }
        } else {
            console.log('当前为手动模式，跳过自动填写');
        }
    }
}

/**
 * 处理收费模式切换（自动/手动）
 */
function handleFeeModeChange() {
    // 获取相关DOM元素
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
        
        // 数量输入框：清空并变为可输入状态（白色背景）
        if (feeQuantity) {
            feeQuantity.value = '';
            feeQuantity.disabled = false;
            feeQuantity.style.backgroundColor = '';
            console.log('数量输入框已启用');
        }
        
        // 单位输入框：清空readonly属性，变为可输入状态（白色背景）
        if (feeUnit) {
            feeUnit.removeAttribute('readonly');
            feeUnit.disabled = false;
            feeUnit.value = '';
            feeUnit.style.backgroundColor = '';
            console.log('单位输入框已启用');
        }
        
        // 单价输入框：清空并变为可输入状态（白色背景）
        if (feeUnitPrice) {
            feeUnitPrice.value = '';
            feeUnitPrice.disabled = false;
            feeUnitPrice.style.backgroundColor = '';
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

/**
 * 快速测试API连接
 */
async function testAPI() {
    console.log('========== 快速测试API ==========');
    try {
        // 测试获取物业楼层基础费API
        const response = await fetch('http://localhost:3001/api/property-building-fees');
        console.log('HTTP响应状态:', response.status);
        const text = await response.text();
        console.log('响应文本:', text);
        
        // 尝试解析JSON
        const data = JSON.parse(text);
        console.log('解析后的数据:', data);
    } catch (error) {
        console.error('测试API失败:', error);
    }
    console.log('========== 测试结束 ==========');
}

/**
 * 页面加载完成后初始化
 */
window.addEventListener('load', async function() {
    // 预加载数据
    await preloadData();

    // 初始化日期选择
    initDateSelect();
    // 更新费用类型选项
    updateFeeTypeOptions();
    // 更新楼号选项
    updateBuildingOptions();
    // 设置默认日期
    setDefaultDate();
});

/**
 * 预加载所有数据（楼栋、梯号、层号、房号、住户）
 */
async function preloadData() {
    // 并行请求所有数据
    const [buildingsResult, stairsResult, floorsResult, roomsResult, residentsResult] = await Promise.all([
        getBuildings(),
        getStairs(),
        getFloors(),
        getRooms(),
        getResidents()
    ]);

    // 将数据存入缓存
    buildingsCache = buildingsResult.success ? buildingsResult.data : [];
    stairsCache = stairsResult.success ? stairsResult.data : [];
    floorsCache = floorsResult.success ? floorsResult.data : [];
    roomsCache = roomsResult.success ? roomsResult.data : [];
    residentsCache = residentsResult.success ? residentsResult.data : [];
}

/**
 * 初始化日期选择框
 */
function initDateSelect() {
    const dateInput = document.getElementById('paymentDate');
    const currentDate = new Date();
    
    // 设置默认日期为今天
    dateInput.value = currentDate.toISOString().split('T')[0];
    
    // 日期变化时检查缴费状态
    dateInput.addEventListener('change', function() {
        if (currentResident) {
            checkPaymentStatus(currentResident.id);
        }
    });
}

/**
 * 设置默认日期为今天
 */
function setDefaultDate() {
    const dateInput = document.getElementById('paymentDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

/**
 * 更新楼号下拉列表选项
 */
function updateBuildingOptions() {
    const buildingSelect = document.getElementById('buildingSelect');

    // 清空并添加默认选项
    buildingSelect.innerHTML = '<option value="">选择楼号</option>';
    
    // 添加所有楼栋选项
    buildingsCache.forEach(building => {
        buildingSelect.innerHTML += `<option value="${building.id}">${building.number}</option>`;
    });
}

/**
 * 更新梯号下拉列表选项
 */
async function updateStairOptions() {
    const buildingId = document.getElementById('buildingSelect').value;
    const stairSelect = document.getElementById('stairSelect');

    // 清空并添加默认选项
    stairSelect.innerHTML = '<option value="">选择梯号</option>';

    // 如果选择了楼栋，过滤该楼栋下的梯号
    if (buildingId) {
        const filteredStairs = stairsCache.filter(s => s.buildingId == buildingId);
        filteredStairs.forEach(stair => {
            stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
        });
    }

    // 重置层号和房号选择
    document.getElementById('floorSelect').innerHTML = '<option value="">选择层号</option>';
    document.getElementById('roomSelect').innerHTML = '<option value="">选择房号</option>';
    resetResidentInfo();
}

/**
 * 更新层号下拉列表选项
 */
async function updateFloorOptions() {
    const buildingId = document.getElementById('buildingSelect').value;
    const stairId = document.getElementById('stairSelect').value;
    const floorSelect = document.getElementById('floorSelect');

    // 清空并添加默认选项
    floorSelect.innerHTML = '<option value="">选择层号</option>';

    // 如果选择了楼栋和梯号，过滤该梯号下的层号
    if (buildingId && stairId) {
        const filteredFloors = floorsCache.filter(f => f.stairId == stairId).sort((a, b) => a.floorNumber - b.floorNumber);
        filteredFloors.forEach(floor => {
            floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
        });
    }

    // 重置房号选择和住户信息
    document.getElementById('roomSelect').innerHTML = '<option value="">选择房号</option>';
    resetResidentInfo();
}

/**
 * 更新房号下拉列表选项
 */
async function updateRoomOptions() {
    const buildingId = document.getElementById('buildingSelect').value;
    const stairId = document.getElementById('stairSelect').value;
    const floorId = document.getElementById('floorSelect').value;
    const roomSelect = document.getElementById('roomSelect');

    // 清空并添加默认选项
    roomSelect.innerHTML = '<option value="">选择房号</option>';

    // 如果选择了楼栋、梯号和层号，过滤该楼层下的房号
    if (buildingId && stairId && floorId) {
        const floor = floorsCache.find(f => f.id == floorId);
        if (floor) {
            const filteredRooms = roomsCache.filter(r => r.stairId == stairId && r.floorNumber == floor.floorNumber).sort((a, b) => a.roomNumber - b.roomNumber);
            filteredRooms.forEach(room => {
                roomSelect.innerHTML += `<option value="${room.id}">${room.roomNumber}</option>`;
            });
        }
    }

    // 重置住户信息
    resetResidentInfo();
}

/**
 * 根据房号查询住户信息
 */
async function loadResidentByRoom() {
    const roomId = document.getElementById('roomSelect').value;

    // 如果没有选择房号，重置住户信息
    if (!roomId) {
        resetResidentInfo();
        return;
    }

    console.log('选择的roomId:', roomId, typeof roomId);
    console.log('residentsCache中的住户数量:', residentsCache.length);
    
    // 在缓存中查找住户
    const resident = residentsCache.find(r => {
        console.log('比较:', r.roomId, typeof r.roomId, 'vs', roomId, typeof roomId, '结果:', r.roomId == roomId);
        return r.roomId == roomId;
    });
    
    console.log('找到的住户:', resident);

    if (resident) {
        console.log('住户详情:', resident);
        currentResident = resident;
        
        // 更新住户信息显示
        updateResidentInfo(resident);
        // 检查缴费状态
        checkPaymentStatus(resident.id);

        // 更新楼栋选择
        document.getElementById('buildingSelect').value = resident.buildingId;

        // 更新梯号选择
        const stairSelect = document.getElementById('stairSelect');
        stairSelect.innerHTML = '<option value="">选择梯号</option>';
        const filteredStairs = stairsCache.filter(s => s.buildingId == resident.buildingId);
        filteredStairs.forEach(stair => {
            stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
        });
        stairSelect.value = resident.stairId;

        // 更新层号选择
        const floorSelect = document.getElementById('floorSelect');
        floorSelect.innerHTML = '<option value="">选择层号</option>';
        const filteredFloors = floorsCache.filter(f => f.stairId == resident.stairId).sort((a, b) => a.floorNumber - b.floorNumber);
        filteredFloors.forEach(floor => {
            floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
        });
        floorSelect.value = resident.floorId;

        // 更新房号选择
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

        // 更新费用子项选项
        updateFeeSubTypeOptions();
    } else {
        // 未找到住户
        resetResidentInfo();
        alert('该房号暂无住户信息');
    }
}

/**
 * 更新住户信息显示
 * @param {Object} resident - 住户对象
 */
function updateResidentInfo(resident) {
    console.log('更新住户信息，完整住户对象:', resident);
    // 设置标志防止触发搜索
    isUpdatingResident = true;

    // 获取DOM元素
    const nameEl = document.getElementById('residentName');
    const phoneEl = document.getElementById('residentPhone');
    const areaEl = document.getElementById('residentArea');
    const searchEl = document.getElementById('residentSearch');

    // 更新显示内容
    if (nameEl) nameEl.textContent = resident.name || '-';
    if (phoneEl) phoneEl.textContent = resident.phone || '-';
    if (areaEl) areaEl.textContent = resident.area ? resident.area.toFixed(2) + '㎡' : '-';
    if (searchEl) {
        searchEl.value = resident.name || '';
    }

    // 100ms后重置标志
    setTimeout(() => {
        isUpdatingResident = false;
    }, 100);
}

/**
 * 重置住户信息显示
 */
function resetResidentInfo() {
    currentResident = null;
    document.getElementById('residentName').textContent = '-';
    document.getElementById('residentPhone').textContent = '-';
    document.getElementById('residentArea').textContent = '-';
}

/**
 * 辅助函数：获取楼号名称
 * @param {number} buildingId - 楼栋ID
 * @returns {string} - 楼栋编号
 */
function getBuildingName(buildingId) {
    const building = buildingsCache.find(b => b.id == buildingId);
    return building ? building.number : '-';
}

/**
 * 辅助函数：获取梯号名称
 * @param {number} stairId - 梯号ID
 * @returns {string} - 梯号
 */
function getStairName(stairId) {
    const stair = stairsCache.find(s => s.id == stairId);
    return stair ? stair.number : '-';
}

/**
 * 辅助函数：获取层号名称
 * @param {number} floorId - 层号ID
 * @returns {string} - 层号（如"3层"）
 */
function getFloorName(floorId) {
    const floor = floorsCache.find(f => f.id == floorId);
    return floor ? floor.floorNumber + '层' : '-';
}

/**
 * 辅助函数：获取房号
 * @param {number} roomId - 房号ID
 * @returns {string} - 房号
 */
function getRoomNumber(roomId) {
    const room = roomsCache.find(r => r.id == roomId);
    return room ? room.roomNumber : '-';
}

/**
 * 搜索住户（模糊搜索）
 */
async function searchResidents() {
    // 如果正在更新住户信息，跳过搜索（防止递归调用）
    if (isUpdatingResident) {
        console.log('正在更新住户信息，跳过搜索');
        return;
    }

    console.log('搜索函数被调用');
    
    // 获取DOM元素
    const searchInput = document.getElementById('residentSearch');
    const searchResults = document.getElementById('searchResults');

    // 检查元素是否存在
    if (!searchInput || !searchResults) {
        console.error('找不到搜索框或搜索结果容器');
        return;
    }

    // 获取搜索关键词
    const searchTerm = searchInput.value.trim();

    console.log('搜索词:', searchTerm);
    console.log('住户缓存数量:', residentsCache.length);

    // 如果搜索词为空，隐藏搜索结果
    if (searchTerm.length === 0) {
        searchResults.classList.remove('show');
        searchResults.style.display = 'none';
        return;
    }

    try {
        // 模糊匹配住户姓名（不区分大小写）
        const filteredResidents = residentsCache.filter(r => {
            if (!r.name) return false;
            return r.name.toLowerCase().includes(searchTerm.toLowerCase());
        });

        console.log('过滤后的住户数量:', filteredResidents.length);

        // 显示搜索结果
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

/**
 * 选择住户
 * @param {number} residentId - 住户ID
 */
async function selectResident(residentId) {
    console.log('选择住户被调用, ID:', residentId);
    
    // 在缓存中查找住户
    const resident = residentsCache.find(r => r.id == residentId);

    if (resident) {
        console.log('找到住户:', resident);
        currentResident = resident;

        // 更新住户信息显示
        console.log('更新住户信息显示...');
        updateResidentInfo(resident);
        console.log('住户信息已更新');
        console.log('住户姓名:', resident.name, '电话:', resident.phone, '面积:', resident.area);

        // 检查缴费状态
        try {
            await checkPaymentStatus(resident.id);
        } catch (error) {
            console.error('检查缴费状态出错:', error);
        }

        // 更新楼栋选择
        document.getElementById('buildingSelect').value = resident.buildingId || '';

        // 更新梯号选择
        const stairSelect = document.getElementById('stairSelect');
        stairSelect.innerHTML = '<option value="">选择梯号</option>';
        const filteredStairs = stairsCache.filter(s => s.buildingId == resident.buildingId);
        filteredStairs.forEach(stair => {
            stairSelect.innerHTML += `<option value="${stair.id}">${stair.number}</option>`;
        });
        stairSelect.value = resident.stairId || '';

        // 更新层号选择
        const floorSelect = document.getElementById('floorSelect');
        floorSelect.innerHTML = '<option value="">选择层号</option>';
        const filteredFloors = floorsCache.filter(f => f.stairId == resident.stairId).sort((a, b) => a.floorNumber - b.floorNumber);
        filteredFloors.forEach(floor => {
            floorSelect.innerHTML += `<option value="${floor.id}">${floor.floorNumber}层</option>`;
        });
        floorSelect.value = resident.floorId || '';

        // 更新房号选择
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

        // 更新费用子项选项
        try {
            await updateFeeSubTypeOptions();
        } catch (error) {
            console.error('更新费用子项出错:', error);
        }
    } else {
        console.warn('未找到ID为', residentId, '的住户');
    }

    // 关闭搜索结果
    const searchResults = document.getElementById('searchResults');
    searchResults.classList.remove('show');
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';
    console.log('搜索结果已关闭');
}

/**
 * 检查住户缴费状态
 * @param {number} residentId - 住户ID
 */
async function checkPaymentStatus(residentId) {
    console.log('检查缴费状态:', residentId);
    // 从日期中提取年份
    const date = document.getElementById('paymentDate').value;
    const year = date ? new Date(date).getFullYear().toString() : '';
    
    try {
        // 获取所有缴费记录
        const result = await getPayments();
        // 过滤当前住户、当前年份、物业费类型的记录
        const payments = result.success ? result.data.filter(p => p.residentId == residentId && p.year == year && p.feeType == 'property') : [];

        // 判断是否已缴费
        const hasPaid = payments.length > 0;

        // 更新状态显示
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
    
    // 同步实收金额
    syncActualAmount();
}

/**
 * 获取缴费记录
 * @returns {Promise<Object>} - 缴费记录列表
 */
async function getPayments() {
    return await apiGet('/payments');
}

/**
 * 更新费用金额
 */
function updateFeeAmount() {
    // 获取相关DOM元素
    const feeType = document.getElementById('feeType').value;
    const feeSubType = document.getElementById('feeSubType').value;
    const feeUnitPrice = document.getElementById('feeUnitPrice');
    const feeQuantity = document.getElementById('feeQuantity');
    const feeUnit = document.getElementById('feeUnit');
    const amountInput = document.getElementById('feeAmount');

    // 如果没有选择费用类型，清空金额
    if (!feeType) {
        setFeeAmount('');
        return;
    }

    // 如果不是水费且没有选择住户，清空金额
    if (feeType !== 'water' && !currentResident) {
        setFeeAmount('');
        return;
    }

    // 获取数量（默认为1）
    let quantity = feeQuantity ? parseInt(feeQuantity.value) || 1 : 1;

    // 物业费数量限制在1-12之间
    if (feeType === 'property') {
        if (quantity < 1) quantity = 1;
        if (quantity > 12) quantity = 12;
        if (feeQuantity) feeQuantity.value = quantity;
    }

    // 获取单价
    let unitPrice = 0;
    if (feeUnitPrice && feeUnitPrice.value) {
        unitPrice = parseFloat(feeUnitPrice.value);
    } else if (feeSubType) {
        unitPrice = parseFloat(feeSubType);
    }

    // 根据费用类型计算金额
    switch (feeType) {
        case 'property':
            if (unitPrice > 0) {
                const totalAmount = unitPrice * quantity;
                setFeeAmount(totalAmount.toFixed(2));
            } else {
                setFeeAmount('');
            }
            break;
        case 'elevator':
            if (unitPrice > 0) {
                const totalAmount = unitPrice * quantity;
                setFeeAmount(totalAmount.toFixed(2));
            } else {
                setFeeAmount('');
            }
            break;
        case 'car':
        case 'motorcycle':
        case 'sanitation':
        case 'other':
        case 'water':
            if (unitPrice > 0) {
                setFeeAmount((unitPrice * quantity).toFixed(2));
            } else {
                setFeeAmount('');
            }
            break;
        default:
            setFeeAmount('');
            break;
    }
    
    // 同步实收金额
    syncActualAmount();
}

/**
 * 设置金额并同步到实收金额
 * @param {string} value - 金额值
 */
function setFeeAmount(value) {
    const feeAmount = document.getElementById('feeAmount');
    const actualAmount = document.getElementById('actualAmount');
    
    if (feeAmount) {
        feeAmount.value = value;
    }
    
    if (actualAmount) {
        actualAmount.value = value;
    }
}

/**
 * 同步实收金额
 * 当金额输入框变化时，自动同步到实收金额输入框
 */
function syncActualAmount() {
    const feeAmount = document.getElementById('feeAmount');
    const actualAmount = document.getElementById('actualAmount');
    
    if (feeAmount && actualAmount) {
        // 每次金额输入框得到内容时，都同步到实收金额输入框
        actualAmount.value = feeAmount.value;
    }
}

/**
 * 获取费用类型名称
 * @param {string} feeType - 费用类型标识
 * @returns {string} - 费用类型中文名称
 */
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

/**
 * 更新缴费分类选项
 */
async function updateFeeTypeOptions() {
    // 直接使用HTML中设置的选项，不覆盖
    updateFeeSubTypeOptions();
}

/**
 * 更新缴费子项选项
 */
async function updateFeeSubTypeOptions() {
    console.log('=====================================');
    console.log('updateFeeSubTypeOptions 被调用');
    const feeType = document.getElementById('feeType').value;
    console.log('当前选择的收费分类:', feeType);
    console.log('当前住户:', currentResident);
    console.log('楼层缓存:', floorsCache);
    console.log('=====================================');
    
    // 获取相关DOM元素
    const feeSubTypeSelect = document.getElementById('feeSubType');
    const feeQuantity = document.getElementById('feeQuantity');
    const amountInput = document.getElementById('feeAmount');
    const actualAmountInput = document.getElementById('actualAmount');

    // 清空子项选择
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
        
        // 清空实收金额输入框
        if (actualAmountInput) {
            actualAmountInput.value = '';
        }
    } else {
        // 如果是水费，只清空金额输入框
        if (amountInput) {
            amountInput.value = '';
        }
        
        // 清空实收金额输入框
        if (actualAmountInput) {
            actualAmountInput.value = '';
        }
    }

    // 检查是否需要选择住户
    if ((feeType === 'property' || feeType === 'sanitation' || feeType === 'elevator') && !currentResident) {
        alert('请先选择住户');
        document.getElementById('feeType').value = '';
        document.getElementById('residentSearch').focus();
        return;
    }

    // 设置数量输入框状态
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

    // 设置单位输入框状态
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

    // 控制自动/手动模式下拉框的显示
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

    // 水费特殊处理：禁用子项选择，单价输入框可写入
    if (feeType === 'water') {
        if (feeSubTypeSelect) {
            feeSubTypeSelect.disabled = true;
            feeSubTypeSelect.style.backgroundColor = '#f0f0f0';
        }
        if (feeUnitPrice) {
            feeUnitPrice.value = '';
            feeUnitPrice.disabled = false;
            feeUnitPrice.style.backgroundColor = '';
            feeUnitPrice.focus();
        }
    } else {
        // 其他费用类型：启用子项选择
        if (feeSubTypeSelect) {
            feeSubTypeSelect.disabled = false;
            feeSubTypeSelect.style.backgroundColor = '';
        }
    }

    // 如果选择了费用类型，加载对应子项
    if (feeType) {
        // 并行获取所有费用类型的数据
        const [propertyResult, elevatorResult, carResult, motorcycleResult, sanitationResult, otherResult] = await Promise.all([
            getFees('property'),
            getFees('elevator'),
            getFees('car'),
            getFees('motorcycle'),
            getFees('sanitation'),
            getFees('other')
        ]);

        // 根据费用类型添加子项选项
        if (feeType === 'property') {
            const propertyFees = propertyResult.success ? propertyResult.data : [];
            // 显示所有物业管理费项目
            propertyFees.forEach(fee => {
                const description = fee.description || '';
                if (description) {
                    feeSubTypeSelect.innerHTML += `<option value="${description}">${description}</option>`;
                }
            });
            // 不自动选择子项，让用户手动选择
        } else if (feeType === 'elevator') {
            const elevatorFees = elevatorResult.success ? elevatorResult.data : [];

            // 获取住户楼层号
            let floorNumber = '';
            if (currentResident && currentResident.floorId) {
                const floor = floorsCache.find(f => f.id == currentResident.floorId);
                if (floor) {
                    floorNumber = floor.floorNumber.toString();
                }
            }

            // 如果有楼层号且有电梯费数据，尝试匹配
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

                // 如果匹配到且金额大于0，自动选择
                if (matchedFee && matchedFee.amount > 0) {
                    feeSubTypeSelect.innerHTML += `<option value="${matchedFee.description}">${matchedFee.description}</option>`;
                    feeSubTypeSelect.value = matchedFee.description;
                    updateFeeAmount();
                    return;
                }
            }

            // 显示所有电梯费项目
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

/**
 * 添加收费项目到列表
 */
function addToPaymentList() {
    // 获取表单数据
    const feeType = document.getElementById('feeType').value;
    const feeMode = document.getElementById('feeMode') ? document.getElementById('feeMode').value : 'auto';
    const feeSubType = document.getElementById('feeSubType').value;
    const feeUnitPrice = document.getElementById('feeUnitPrice') ? document.getElementById('feeUnitPrice').value : '';
    const feeQuantity = document.getElementById('feeQuantity') ? document.getElementById('feeQuantity').value : 1;
    const feeUnit = document.getElementById('feeUnit') ? document.getElementById('feeUnit').value : '';
    const amount = document.getElementById('feeAmount').value;
    const actualAmount = document.getElementById('actualAmount') ? document.getElementById('actualAmount').value : amount;
    const date = document.getElementById('paymentDate').value;
    // 从日期中提取年份
    const year = date ? new Date(date).getFullYear().toString() : '';

    // 验证数据
    if (!currentResident) {
        alert('请先选择住户');
        return;
    }

    if (!feeType) {
        alert('请选择缴费类型');
        return;
    }

    if (!actualAmount || parseFloat(actualAmount) <= 0) {
        alert('请输入有效的实收金额');
        return;
    }

    // 创建收费项目对象
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
        amount: parseFloat(actualAmount),
        year: year,
        date: date
    };

    // 添加到临时列表
    tempPaymentList.push(paymentItem);
    // 重新渲染列表
    renderPaymentList();

    // 清空表单
    document.getElementById('feeType').value = '';
    document.getElementById('feeSubType').innerHTML = '<option value="">选择子项</option>';
    document.getElementById('feeUnitPrice').value = '';
    document.getElementById('feeAmount').value = '';
    document.getElementById('actualAmount').value = '';
}

/**
 * 渲染收费项目列表
 */
function renderPaymentList() {
    const listContainer = document.getElementById('paymentList');

    // 如果列表为空，显示提示
    if (tempPaymentList.length === 0) {
        listContainer.innerHTML = '<div class="empty-list">暂无收费项目</div>';
        return;
    }

    // 渲染列表项
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

/**
 * 从收费项目列表中删除项目
 * @param {number} id - 项目ID
 */
function removeFromPaymentList(id) {
    tempPaymentList = tempPaymentList.filter(item => item.id !== id);
    renderPaymentList();
}

/**
 * 确认收费（提交收费记录）
 */
async function confirmPayment() {
    // 检查是否有收费项目
    if (tempPaymentList.length === 0) {
        alert('请先添加收费项目');
        return;
    }

    // 遍历所有收费项目，逐个提交
    for (const item of tempPaymentList) {
        await apiPost('/payments', {
            residentId: item.residentId,
            feeType: item.feeType,
            amount: item.amount,
            paymentDate: item.date,
            status: 'paid'
        });
    }

    // 提示成功
    alert('收费成功！');

    // 清空临时列表并重新渲染
    tempPaymentList = [];
    renderPaymentList();

    // 更新缴费状态
    if (currentResident) {
        await checkPaymentStatus(currentResident.id);
    }
}

/**
 * 点击页面其他地方关闭搜索结果下拉框
 */
document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search-container');
    // 如果点击的不是搜索容器内的元素，关闭搜索结果
    if (searchContainer && !searchContainer.contains(e.target)) {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.classList.remove('show');
        }
    }
});