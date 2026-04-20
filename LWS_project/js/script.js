let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let filter = 'all';

const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-btn');

function init() {
    renderTasks();
    addEventListeners();
}

function addEventListeners() {
    addTaskBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            filter = this.dataset.filter;
            renderTasks();
        });
    });

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

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function editTask(id, element) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;

    const originalText = task.text;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'edit-input';
    input.style.flex = '1';
    input.style.padding = '8px 12px';
    input.style.border = 'none';
    input.style.borderRadius = '8px';
    input.style.fontSize = '17px';
    input.style.background = 'rgba(118, 118, 128, 0.18)';
    input.style.outline = 'none';

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

function saveTasks() {
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, 100);
}

function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') {
            return !task.completed;
        } else if (filter === 'completed') {
            return task.completed;
        }
        return true;
    });

    if (filteredTasks.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'empty-state';
        emptyLi.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 12px;">📝</div>
            <div>暂无任务</div>
        `;
        taskList.appendChild(emptyLi);
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn">×</button>
        `;

        taskList.appendChild(li);
    });
}

init();