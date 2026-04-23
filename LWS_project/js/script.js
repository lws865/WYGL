// 任务数组
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// 过滤状态
let filter = 'all';

// DOM元素
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-btn');

// 初始化应用
function init() {
    renderTasks();
    addEventListeners();
}

// 添加事件监听器
function addEventListeners() {
    // 添加任务按钮点击事件
    addTaskBtn.addEventListener('click', addTask);
    
    // 输入框回车事件
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // 过滤按钮点击事件
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            this.classList.add('active');
            // 更新过滤状态
            filter = this.dataset.filter;
            // 重新渲染任务
            renderTasks();
        });
    });
    
    // 任务列表事件委托
    taskList.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            const id = parseInt(e.target.parentElement.dataset.id);
            toggleTask(id);
        }
    });
    
    taskList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.parentElement.dataset.id);
            deleteTask(id);
        } else if (e.target.classList.contains('task-text')) {
            const id = parseInt(e.target.parentElement.dataset.id);
            editTask(id, e.target);
        }
    });
}

// 添加任务
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        
        tasks.push(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskInput.focus();
    }
}

// 切换任务完成状态
function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
}

// 删除任务
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

// 编辑任务
function editTask(id, element) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    const originalText = task.text;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'edit-input';
    input.style.flex = '1';
    input.style.padding = '5px';
    input.style.border = '1px solid #ddd';
    input.style.borderRadius = '4px';
    
    element.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    
    input.addEventListener('blur', function() {
        const newText = input.value.trim();
        if (newText) {
            task.text = newText;
            saveTasks();
        }
        renderTasks();
    });
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const newText = input.value.trim();
            if (newText) {
                task.text = newText;
                saveTasks();
            }
            renderTasks();
        } else if (e.key === 'Escape') {
            renderTasks();
        }
    });
}

// 保存任务到本地存储
function saveTasks() {
    // 防抖处理，避免频繁存储
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, 100);
}

// 渲染任务列表
function renderTasks() {
    // 清空任务列表
    taskList.innerHTML = '';
    
    // 过滤任务
    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') {
            return !task.completed;
        } else if (filter === 'completed') {
            return task.completed;
        }
        return true;
    });
    
    // 渲染过滤后的任务
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn">&times;</button>
        `;
        
        taskList.appendChild(li);
    });
}

// 初始化应用
init();