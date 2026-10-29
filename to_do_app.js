
"use strict";

// ==========================================
// STEP 1: GET HTML ELEMENTS
// ==========================================

const loginPage = document.getElementById("login-page");
const registerPage = document.getElementById("register-page");
const todoPage = document.getElementById("todo-page");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const taskForm = document.getElementById("task-form");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

const registerName = document.getElementById("register-name");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");
const confirmPassword = document.getElementById("confirm-password");

const taskInput = document.getElementById("task-input");
const taskPriority = document.getElementById("task-priority");
const taskDueDate = document.getElementById("task-due-date");
const taskDueTime = document.getElementById("task-due-time");
const taskReminder = document.getElementById("task-reminder");

const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const taskMessage = document.getElementById("task-message");
const emptyMessage = document.getElementById("empty-message");

const totalTasksElement = document.getElementById("total-tasks");
const completedTasksElement = document.getElementById("completed-tasks");
const pendingTasksElement = document.getElementById("pending-tasks");
const progressPercentageElement =
    document.getElementById("progress-percentage");

const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const progressBar = document.getElementById("progress-bar");

const completionChart = document.getElementById("completion-chart");
const priorityChart = document.getElementById("priority-chart");

const completionChartSummary =
    document.getElementById("completion-chart-summary");

const priorityChartSummary =
    document.getElementById("priority-chart-summary");

const addTaskButton = document.getElementById("add-task");
const cancelEditButton = document.getElementById("cancel-edit");

const allFilter = document.getElementById("all-filter");
const activeFilter = document.getElementById("active-filter");
const completedFilter = document.getElementById("completed-filter");

// ==========================================
// STEP 2: STORAGE AND APP VARIABLES
// ==========================================

const USERS_KEY = "smartTodoUsers";
const SESSION_KEY = "smartTodoCurrentUser";
const LEGACY_TASKS_KEY = "tasks";

let currentUser = null;
let tasks = [];
let currentFilter = "all";
let editingTaskId = null;

// Track reminders already shown during this session.
const notifiedReminders = new Set();

// ==========================================
// STEP 3: HELPER FUNCTIONS
// ==========================================

// Generate a unique ID for each task.
function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

// Read JSON safely from localStorage.
function readStorage(key, fallbackValue) {
    try {
        const value = localStorage.getItem(key);

        return value === null ? fallbackValue : JSON.parse(value);
    } catch (error) {
        console.error("Could not read saved data:", error);
        return fallbackValue;
    }
}

// Save data in localStorage.
function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Could not save data:", error);
        alert("Your data could not be saved. Check browser storage.");
        return false;
    }
}

// Use a separate task list for each account.
function getTasksKey() {
    return "smartTodoTasks_" + encodeURIComponent(currentUser.email);
}

// Display a message safely.
function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = "message";

    if (type) {
        element.classList.add(type);
    }
}

// ==========================================
// STEP 4: ACCOUNT AND PAGE NAVIGATION
// ==========================================

function showPage(page) {
    loginPage.hidden = page !== "login";
    registerPage.hidden = page !== "register";
    todoPage.hidden = page !== "todo";
}

document.getElementById("show-register").addEventListener("click", () => {
    showMessage(document.getElementById("login-message"), "");
    showMessage(document.getElementById("register-message"), "");
    showPage("register");
});

document.getElementById("show-login").addEventListener("click", () => {
    showMessage(document.getElementById("login-message"), "");
    showMessage(document.getElementById("register-message"), "");
    showPage("login");
});

// ==========================================
// STEP 5: REGISTER A NEW ACCOUNT
// ==========================================

registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = registerName.value.trim();
    const email = registerEmail.value.trim().toLowerCase();
    const password = registerPassword.value;
    const confirm = confirmPassword.value;

    if (password.length < 6) {
        showMessage(
            document.getElementById("register-message"),
            "Password must contain at least 6 characters.",
            "error"
        );
        return;
    }

    if (password !== confirm) {
        showMessage(
            document.getElementById("register-message"),
            "Passwords do not match.",
            "error"
        );
        return;
    }

    const users = readStorage(USERS_KEY, []);

    if (!Array.isArray(users)) {
        showMessage(
            document.getElementById("register-message"),
            "Account storage is invalid. Please check your browser data.",
            "error"
        );
        return;
    }

    const accountExists = users.some((user) => user.email === email);

    if (accountExists) {
        showMessage(
            document.getElementById("register-message"),
            "This email already has an account. Please log in.",
            "error"
        );
        return;
    }

    // DEMO ONLY: passwords are stored as plain text.
    // Never use this authentication approach for a real website.
    users.push({
        name: name,
        email: email,
        password: password
    });

    if (!writeStorage(USERS_KEY, users)) {
        return;
    }

    showMessage(
        document.getElementById("register-message"),
        "Account created! You can now log in.",
        "success"
    );

    registerForm.reset();
    loginEmail.value = email;
    showPage("login");
});

// ==========================================
// STEP 6: LOG IN
// ==========================================

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    const users = readStorage(USERS_KEY, []);

    const user = Array.isArray(users)
        ? users.find((item) =>
            item.email === email && item.password === password
        )
        : null;

    if (!user) {
        showMessage(
            document.getElementById("login-message"),
            "Incorrect email or password.",
            "error"
        );
        return;
    }

    if (!writeStorage(SESSION_KEY, { email: user.email })) {
        return;
    }

    startApp(user);
});

// ==========================================
// STEP 7: START THE APP
// ==========================================

function startApp(user) {
    currentUser = user;

    document.getElementById("welcome-message").textContent =
        "Welcome, " + user.name + "! Organize your day, one task at a time.";

    loadTasks();
    showPage("todo");
    renderTasks();
    updateDashboard();

    // Ask permission only if reminders may be needed.
    if (tasks.some((task) => task.reminder && !task.completed)) {
        requestNotificationPermission();
    }

    checkReminders();
}

// ==========================================
// STEP 8: LOAD AND SAVE TASKS
// ==========================================

function normalizeTask(task) {
    // Support older task objects that used "text".
    const rawPriority = String(task.priority || "medium").toLowerCase();

    return {
        id: String(task.id || createId()),
        title: String(task.title || task.text || "Untitled task"),
        completed: Boolean(task.completed),
        priority: ["high", "medium", "low"].includes(rawPriority)
            ? rawPriority
            : "medium",
        dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
        dueTime: typeof task.dueTime === "string" ? task.dueTime : "",
        reminder: typeof task.reminder === "string" ? task.reminder : ""
    };
}

function loadTasks() {
    const key = getTasksKey();
    const savedTasks = readStorage(key, null);

    if (Array.isArray(savedTasks)) {
        tasks = savedTasks.map(normalizeTask);
        return;
    }

    // One-time migration attempt for the old shared "tasks" array.
    // If the old app used this key, preserve its tasks for the first login.
    const legacyTasks = readStorage(LEGACY_TASKS_KEY, []);

    if (Array.isArray(legacyTasks) && legacyTasks.length > 0) {
        tasks = legacyTasks.map(normalizeTask);
        saveTasks();
    } else {
        tasks = [];
    }
}

function saveTasks() {
    if (!currentUser) {
        return false;
    }

    return writeStorage(getTasksKey(), tasks);
}

// ==========================================
// STEP 9: ADD OR UPDATE A TASK
// ==========================================

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        showMessage(taskMessage, "Please enter a task name.", "error");
        return;
    }

    const dueDate = taskDueDate.value;
    const dueTime = taskDueTime.value;
    const reminder = taskReminder.value;

    // A reminder must have a deadline.
    if (reminder && !dueDate) {
        showMessage(
            taskMessage,
            "Please select a due date before setting a reminder.",
            "error"
        );
        return;
    }

    // Do not allow a reminder after the task deadline.
    if (reminder && dueDate) {
        const deadlineString = dueDate + "T" + (dueTime || "23:59");
        const deadline = new Date(deadlineString);
        const reminderDate = new Date(reminder);

        if (
            Number.isNaN(deadline.getTime()) ||
            Number.isNaN(reminderDate.getTime()) ||
            reminderDate.getTime() > deadline.getTime()
        ) {
            showMessage(
                taskMessage,
                "The reminder must be before the task deadline.",
                "error"
            );
            return;
        }
    }

    const taskData = {
        title: title,
        priority: taskPriority.value,
        dueDate: dueDate,
        dueTime: dueTime,
        reminder: reminder
    };

    if (editingTaskId) {
        const index = tasks.findIndex((task) => task.id === editingTaskId);

        if (index === -1) {
            resetTaskForm();
            return;
        }

        tasks[index] = {
            ...tasks[index],
            ...taskData
        };

        notifiedReminders.delete(editingTaskId);

        showMessage(taskMessage, "Task updated successfully.", "success");
    } else {
        tasks.push({
            id: createId(),
            ...taskData,
            completed: false
        });

        showMessage(taskMessage, "Task added successfully.", "success");
    }

    if (!saveTasks()) {
        return;
    }

    resetTaskForm();
    renderTasks();
    updateDashboard();
    requestNotificationPermission();
    checkReminders();
});

// ==========================================
// STEP 10: RESET THE TASK FORM
// ==========================================

function resetTaskForm() {
    taskForm.reset();
    taskPriority.value = "medium";
    editingTaskId = null;

    document.getElementById("form-heading").textContent = "Add a New Task";
    addTaskButton.textContent = "+ Add Task";
    cancelEditButton.hidden = true;
}

cancelEditButton.addEventListener("click", () => {
    resetTaskForm();
    showMessage(taskMessage, "");
});

// ==========================================
// STEP 11: FORMAT DATES
// ==========================================

function formatDueDate(task) {
    if (!task.dueDate) {
        return "";
    }

    // Add midday to avoid date-only timezone shifts.
    const date = new Date(task.dueDate + "T12:00:00");

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    let formatted = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

    if (task.dueTime) {
        const time = new Date("2000-01-01T" + task.dueTime);

        if (!Number.isNaN(time.getTime())) {
            formatted += " at " + time.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit"
            });
        }
    }

    return formatted;
}

function getDeadline(task) {
    if (!task.dueDate) {
        return null;
    }

    const time = task.dueTime || "23:59";
    const deadline = new Date(task.dueDate + "T" + time);

    return Number.isNaN(deadline.getTime()) ? null : deadline;
}

function getTaskStatus(task) {
    if (task.completed) {
        return "completed";
    }

    const deadline = getDeadline(task);

    if (!deadline) {
        return "active";
    }

    const now = new Date();

    if (deadline.getTime() < now.getTime()) {
        return "overdue";
    }

    const oneDay = 24 * 60 * 60 * 1000;

    if (deadline.getTime() - now.getTime() <= oneDay) {
        return "due-soon";
    }

    return "active";
}

// ==========================================
// STEP 12: DISPLAY TASKS
// ==========================================

function renderTasks() {
    taskList.replaceChildren();

    const filteredTasks = tasks.filter((task) => {
        if (currentFilter === "active") {
            return !task.completed;
        }

        if (currentFilter === "completed") {
            return task.completed;
        }

        return true;
    });

    // Sort by priority, then by deadline.
    const priorityOrder = { high: 1, medium: 2, low: 3 };

    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        const priorityDifference =
            priorityOrder[a.priority] - priorityOrder[b.priority];

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        const deadlineA = getDeadline(a);
        const deadlineB = getDeadline(b);

        if (!deadlineA && !deadlineB) return 0;
        if (!deadlineA) return 1;
        if (!deadlineB) return -1;

        return deadlineA - deadlineB;
    });

    filteredTasks.forEach((task) => {
        const item = document.createElement("li");

        item.className = "task-item priority-" + task.priority;

        if (task.completed) {
            item.classList.add("completed-task");
        }

        // Completion checkbox.
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Complete " + task.title);

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        // Task title and details.
        const content = document.createElement("div");
        content.className = "task-content";

        const title = document.createElement("p");
        title.className = "task-title";
        title.textContent = task.title;

        const metadata = document.createElement("div");
        metadata.className = "task-meta";

        const priorityBadge = document.createElement("span");
        priorityBadge.className = "priority-badge " + task.priority;
        priorityBadge.textContent =
            task.priority.charAt(0).toUpperCase() +
            task.priority.slice(1) + " Priority";

        metadata.appendChild(priorityBadge);

        if (task.dueDate) {
            const dateLabel = document.createElement("span");
            dateLabel.textContent = "📅 Due: " + formatDueDate(task);
            metadata.appendChild(dateLabel);

            const status = getTaskStatus(task);

            if (status === "overdue") {
                const badge = document.createElement("span");
                badge.className = "status-badge overdue";
                badge.textContent = "Overdue";
                metadata.appendChild(badge);
            } else if (status === "due-soon") {
                const badge = document.createElement("span");
                badge.className = "status-badge due-soon";
                badge.textContent = "Due within 24 hours";
                metadata.appendChild(badge);
            }
        }

        if (task.reminder) {
            const reminderLabel = document.createElement("span");
            const reminderDate = new Date(task.reminder);

            reminderLabel.textContent =
                "🔔 Reminder: " +
                (Number.isNaN(reminderDate.getTime())
                    ? task.reminder
                    : reminderDate.toLocaleString());

            metadata.appendChild(reminderLabel);
        }

        content.append(title, metadata);

        // Edit and delete actions.
        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "task-action";
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", "Edit " + task.title);
        editButton.addEventListener("click", () => {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "task-action delete-action";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", "Delete " + task.title);
        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.append(editButton, deleteButton);
        item.append(checkbox, content, actions);
        taskList.appendChild(item);
    });

    emptyMessage.hidden = filteredTasks.length > 0;

    if (filteredTasks.length === 0) {
        emptyMessage.textContent =
            currentFilter === "completed"
                ? "No completed tasks yet."
                : currentFilter === "active"
                    ? "You have no pending tasks."
                    : "No tasks yet. Add your first task above!";
    }

    const pendingCount = tasks.filter((task) => !task.completed).length;

    taskCount.textContent =
        pendingCount + (pendingCount === 1 ? " task remaining" : " tasks remaining");

    // Keep the Clear Completed button useful.
    document.getElementById("clear-completed").disabled =
        !tasks.some((task) => task.completed);
}

// ==========================================
// STEP 13: COMPLETE OR UNCOMPLETE A TASK
// ==========================================

function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    if (task.completed) {
        notifiedReminders.delete(task.id);
    }

    if (!saveTasks()) {
        task.completed = !task.completed;
        return;
    }

    renderTasks();
    updateDashboard();
}

// ==========================================
// STEP 14: EDIT A TASK
// ==========================================

function editTask(id) {
    const task = tasks.find((item) => item.id === id);

    if (!task) {
        return;
    }

    editingTaskId = task.id;

    taskInput.value = task.title;
    taskPriority.value = task.priority;
    taskDueDate.value = task.dueDate;
    taskDueTime.value = task.dueTime;
    taskReminder.value = task.reminder;

    document.getElementById("form-heading").textContent = "Edit Task";
    addTaskButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    showMessage(taskMessage, "");
    taskInput.focus();

    document.getElementById("task-form").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// ==========================================
// STEP 15: DELETE A TASK
// ==========================================

function deleteTask(id) {
    const task = tasks.find((item) => item.id === id);

    if (!task) {
        return;
    }

    if (!confirm('Delete the task "' + task.title + '"?')) {
        return;
    }

    const previousTasks = tasks;
    tasks = tasks.filter((item) => item.id !== id);
    notifiedReminders.delete(id);

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    if (editingTaskId === id) {
        resetTaskForm();
    }

    renderTasks();
    updateDashboard();
}

// ==========================================
// STEP 16: FILTER TASKS
// ==========================================

function setFilter(filter) {
    currentFilter = filter;

    const buttons = [
        [allFilter, "all"],
        [activeFilter, "active"],
        [completedFilter, "completed"]
    ];

    buttons.forEach(([button, buttonFilter]) => {
        const isActive = buttonFilter === filter;

        button.classList.toggle("active-filter", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    renderTasks();
}

allFilter.addEventListener("click", () => setFilter("all"));
activeFilter.addEventListener("click", () => setFilter("active"));
completedFilter.addEventListener("click", () => setFilter("completed"));

// ==========================================
// STEP 17: CLEAR COMPLETED TASKS
// ==========================================

document.getElementById("clear-completed").addEventListener("click", () => {
    const completedTasks = tasks.filter((task) => task.completed);

    if (completedTasks.length === 0) {
        return;
    }

    if (!confirm("Delete all " + completedTasks.length + " completed tasks?")) {
        return;
    }

    const previousTasks = tasks;

    tasks = tasks.filter((task) => !task.completed);

    completedTasks.forEach((task) => {
        notifiedReminders.delete(task.id);
    });

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    resetTaskForm();
    renderTasks();
    updateDashboard();
});

// ==========================================
// STEP 18: UPDATE DASHBOARD STATISTICS
// ==========================================

function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasksElement.textContent = total;
    completedTasksElement.textContent = completed;
    pendingTasksElement.textContent = pending;
    progressPercentageElement.textContent = percentage + "%";

    progressFill.style.width = percentage + "%";
    progressLabel.textContent = percentage + "% completed";

    progressBar.setAttribute("aria-valuenow", percentage);

    drawCompletionChart();
    drawPriorityChart();
}

// ==========================================
// STEP 19: DRAW A BAR CHART
// ==========================================

// Draw charts using the HTML canvas API.
// This avoids needing an external chart library.

function drawBarChart(canvas, chartData, maxValue) {
    const context = canvas.getContext("2d");

    if (!context) {
        return;
    }

    const rectangle = canvas.getBoundingClientRect();

    if (rectangle.width === 0 || rectangle.height === 0) {
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.round(rectangle.width * pixelRatio);
    canvas.height = Math.round(rectangle.height * pixelRatio);

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, rectangle.width, rectangle.height);

    const width = rectangle.width;
    const height = rectangle.height;

    const padding = {
        left: 36,
        right: 14,
        top: 24,
        bottom: 48
    };

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    if (graphWidth <= 0 || graphHeight <= 0) {
        return;
    }

    const safeMax = Math.max(1, maxValue);
    const gridLines = 4;

    context.font = "12px Arial";
    context.textBaseline = "middle";

    // Horizontal grid lines and number labels.
    for (let i = 0; i <= gridLines; i++) {
        const value = safeMax * (gridLines - i) / gridLines;
        const y = padding.top + graphHeight * i / gridLines;

        context.beginPath();
        context.strokeStyle = "#e6ece8";
        context.lineWidth = 1;
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();

        context.fillStyle = "#6b786f";
        context.textAlign = "right";
        context.fillText(
            String(Math.round(value)),
            padding.left - 8,
            y
        );
    }

    const slotWidth = graphWidth / chartData.length;
    const barWidth = Math.min(55, slotWidth * 0.55);

    chartData.forEach((item, index) => {
        const barHeight = graphHeight * item.value / safeMax;
        const x = padding.left + slotWidth * index +
            (slotWidth - barWidth) / 2;

        const y = padding.top + graphHeight - barHeight;

        context.fillStyle = item.color;

        // Rounded top corners when supported.
        if (typeof context.roundRect === "function") {
            context.beginPath();
            context.roundRect(x, y, barWidth, barHeight, 5);
            context.fill();
        } else {
            context.fillRect(x, y, barWidth, barHeight);
        }

        context.fillStyle = "#17251c";
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillText(String(item.value), x + barWidth / 2, y - 5);

        context.fillStyle = "#536258";
        context.textBaseline = "top";
        context.fillText(
            item.label,
            padding.left + slotWidth * index + slotWidth / 2,
            padding.top + graphHeight + 12
        );
    });
}

// ==========================================
// STEP 20: COMPLETION GRAPH
// ==========================================

function drawCompletionChart() {
    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.length - completed;

    drawBarChart(
        completionChart,
        [
            { label: "Completed", value: completed, color: "#15803d" },
            { label: "Pending", value: pending, color: "#d97706" }
        ],
        Math.max(completed, pending, 1)
    );

    completionChartSummary.textContent =
        completed + " completed · " + pending + " pending";
}

// ==========================================
// STEP 21: PRIORITY GRAPH
// ==========================================

function drawPriorityChart() {
    const high = tasks.filter((task) => task.priority === "high").length;
    const medium = tasks.filter((task) => task.priority === "medium").length;
    const low = tasks.filter((task) => task.priority === "low").length;

    drawBarChart(
        priorityChart,
        [
            { label: "High", value: high, color: "#dc2626" },
            { label: "Medium", value: medium, color: "#d97706" },
            { label: "Low", value: low, color: "#15803d" }
        ],
        Math.max(high, medium, low, 1)
    );

    priorityChartSummary.textContent =
        "High: " + high + " · Medium: " + medium + " · Low: " + low;
}

// Redraw graphs when the browser size changes.
window.addEventListener("resize", () => {
    if (currentUser) {
        drawCompletionChart();
        drawPriorityChart();
    }
});

// ==========================================
// STEP 22: BROWSER NOTIFICATION PERMISSION
// ==========================================

async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        showMessage(
            taskMessage,
            "Your browser does not support notifications.",
            "error"
        );
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission === "denied") {
        showMessage(
            taskMessage,
            "Notifications are blocked. Enable them in your browser settings.",
            "error"
        );
        return false;
    }

    // Call this following a user action, such as adding a reminder.
    try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    } catch (error) {
        console.error("Notification permission request failed:", error);
        return false;
    }
}

// ==========================================
// STEP 23: CHECK TASK REMINDERS
// ==========================================

function checkReminders() {
    if (!currentUser || !("Notification" in window)) {
        return;
    }

    if (Notification.permission !== "granted") {
        return;
    }

    const now = Date.now();

    tasks.forEach((task) => {
        if (!task.reminder || task.completed) {
            return;
        }

        const reminderTime = new Date(task.reminder).getTime();

        if (Number.isNaN(reminderTime)) {
            return;
        }

        // Notify once when the reminder time arrives or has passed.
        if (
            reminderTime <= now &&
            !notifiedReminders.has(task.id)
        ) {
            try {
                const notification = new Notification("Smart To-Do List", {
                    body: "Reminder: " + task.title,
                    tag: "task-reminder-" + task.id
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                notifiedReminders.add(task.id);
            } catch (error) {
                console.error("Could not display reminder:", error);
            }
        }
    });
}

// Check every 15 seconds while this page is open.
setInterval(checkReminders, 15000);

// Check again when returning to the app.
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        checkReminders();
        renderTasks();
        updateDashboard();
    }
});

// ==========================================
// STEP 24: LOG OUT
// ==========================================

document.getElementById("logout-button").addEventListener("click", () => {
    // Preserve saved tasks; clear only the current login session.
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error("Could not clear login session:", error);
    }

    currentUser = null;
    tasks = [];
    editingTaskId = null;
    notifiedReminders.clear();

    loginForm.reset();
    resetTaskForm();

    showMessage(document.getElementById("login-message"), "");
    showPage("login");
});

// ==========================================
// STEP 25: RESTORE SESSION AFTER REFRESH
// ==========================================

function restoreSession() {
    const session = readStorage(SESSION_KEY, null);

    if (!session || !session.email) {
        showPage("login");
        return;
    }

    const users = readStorage(USERS_KEY, []);

    if (!Array.isArray(users)) {
        showPage("login");
        return;
    }

    const user = users.find((item) => item.email === session.email);

    if (!user) {
        showPage("login");
        return;
    }

    startApp(user);
}

// ==========================================
// STEP 26: START THE APPLICATION
// ==========================================

restoreSession();
