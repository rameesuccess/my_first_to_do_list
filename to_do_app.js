
/* ==========================================
   STEP 1: SELECT HTML ELEMENTS
========================================== */

const loginPage = document.getElementById("login-page");
const registerPage = document.getElementById("register-page");
const todoPage = document.getElementById("todo-page");

const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginMessage = document.getElementById("login-message");

const registerForm = document.getElementById("register-form");
const registerName = document.getElementById("register-name");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");
const confirmPassword = document.getElementById("confirm-password");
const registerMessage = document.getElementById("register-message");

const showRegisterButton = document.getElementById("show-register");
const showLoginButton = document.getElementById("show-login");
const logoutButton = document.getElementById("logout-button");
const welcomeMessage = document.getElementById("welcome-message");

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");

const allFilter = document.getElementById("all-filter");
const activeFilter = document.getElementById("active-filter");
const completedFilter = document.getElementById("completed-filter");
const clearCompletedButton = document.getElementById("clear-completed");


/* ==========================================
   STEP 2: STORAGE KEYS
========================================== */

const USERS_KEY = "smartTodoUsers";
const SESSION_KEY = "smartTodoCurrentUser";

let currentUser = null;
let tasks = [];
let currentFilter = "all";


/* ==========================================
   STEP 3: SAVE AND LOAD USERS
========================================== */

function getUsers() {
    try {
        const savedUsers = localStorage.getItem(USERS_KEY);
        const users = savedUsers ? JSON.parse(savedUsers) : [];

        return Array.isArray(users) ? users : [];
    } catch (error) {
        console.error("Could not load accounts:", error);
        return [];
    }
}

function saveUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    } catch (error) {
        alert("Could not save your account in this browser.");
        return false;
    }
}


/* ==========================================
   STEP 4: SHOW THE CORRECT PAGE
========================================== */

function showPage(page) {
    loginPage.hidden = page !== "login";
    registerPage.hidden = page !== "register";
    todoPage.hidden = page !== "todo";
}

showRegisterButton.addEventListener("click", function () {
    loginMessage.textContent = "";
    registerMessage.textContent = "";
    registerForm.reset();
    showPage("register");
});

showLoginButton.addEventListener("click", function () {
    loginMessage.textContent = "";
    registerMessage.textContent = "";
    loginForm.reset();
    showPage("login");
});


/* ==========================================
   STEP 5: CREATE A NEW ACCOUNT
========================================== */

registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = registerName.value.trim();
    const email = registerEmail.value.trim().toLowerCase();
    const password = registerPassword.value;
    const confirmation = confirmPassword.value;

    if (password.length < 6) {
        registerMessage.textContent =
            "Your password must have at least 6 characters.";
        return;
    }

    if (password !== confirmation) {
        registerMessage.textContent =
            "The passwords do not match.";
        return;
    }

    const users = getUsers();

    const existingUser = users.find(function (user) {
        return user.email === email;
    });

    if (existingUser) {
        registerMessage.textContent =
            "An account with this email already exists. Please log in.";
        return;
    }

    // DEMO ONLY: Never store real passwords this way.
    const newUser = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        name: name,
        email: email,
        password: password
    };

    users.push(newUser);

    if (!saveUsers(users)) {
        return;
    }

    registerForm.reset();
    loginEmail.value = email;
    loginMessage.textContent =
        "Account created successfully. Please log in.";

    showPage("login");
});


/* ==========================================
   STEP 6: LOG IN TO AN EXISTING ACCOUNT
========================================== */

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    const users = getUsers();

    const user = users.find(function (account) {
        return account.email === email &&
               account.password === password;
    });

    if (!user) {
        loginMessage.textContent =
            "Incorrect email or password. Please try again.";
        return;
    }

    currentUser = user;

    // Keep the signed-in state for this browser tab session.
    sessionStorage.setItem(SESSION_KEY, user.id);

    loginForm.reset();
    loginMessage.textContent = "";

    openUserTasks();
});


/* ==========================================
   STEP 7: LOAD TASKS FOR THE CURRENT USER
========================================== */

function getTaskStorageKey() {
    return "smartTodoTasks_" + currentUser.id;
}

function loadUserTasks() {
    try {
        const savedTasks = localStorage.getItem(getTaskStorageKey());
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        tasks = Array.isArray(parsedTasks) ? parsedTasks : [];
    } catch (error) {
        console.error("Could not load tasks:", error);
        tasks = [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(
            getTaskStorageKey(),
            JSON.stringify(tasks)
        );
    } catch (error) {
        alert("Could not save tasks in this browser.");
    }
}

function openUserTasks() {
    loadUserTasks();

    currentFilter = "all";
    welcomeMessage.textContent =
        "Welcome, " + currentUser.name + "! Organize your day.";

    showPage("todo");
    renderTasks();
}


/* ==========================================
   STEP 8: LOG OUT
========================================== */

logoutButton.addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);

    currentUser = null;
    tasks = [];

    loginForm.reset();
    loginMessage.textContent = "";

    showPage("login");
});


/* ==========================================
   STEP 9: ADD A TASK
========================================== */

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!currentUser) {
        return;
    }

    const text = taskInput.value.trim();

    if (text === "") {
        return;
    }

    tasks.push({
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),
        text: text,
        completed: false
    });

    saveTasks();
    renderTasks();

    taskInput.value = "";
    taskInput.focus();
});


/* ==========================================
   STEP 10: DISPLAY TASKS
========================================== */

function renderTasks() {
    taskList.replaceChildren();

    let visibleTasks = tasks;

    if (currentFilter === "active") {
        visibleTasks = tasks.filter(function (task) {
            return !task.completed;
        });
    } else if (currentFilter === "completed") {
        visibleTasks = tasks.filter(function (task) {
            return task.completed;
        });
    }

    visibleTasks.forEach(function (task) {
        const item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Mark task completed");

        checkbox.addEventListener("change", function () {
            task.completed = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            tasks = tasks.filter(function (savedTask) {
                return savedTask.id !== task.id;
            });

            saveTasks();
            renderTasks();
        });

        item.append(checkbox, text, deleteButton);
        taskList.appendChild(item);
    });

    updateTaskCount();
    updateFilterButtons();
}


/* ==========================================
   STEP 11: COUNT REMAINING TASKS
========================================== */

function updateTaskCount() {
    const remaining = tasks.filter(function (task) {
        return !task.completed;
    }).length;

    taskCount.textContent = remaining +
        (remaining === 1 ? " task remaining" : " tasks remaining");
}


/* ==========================================
   STEP 12: FILTER TASKS
========================================== */

function setFilter(filter) {
    currentFilter = filter;
    renderTasks();
}

allFilter.addEventListener("click", function () {
    setFilter("all");
});

activeFilter.addEventListener("click", function () {
    setFilter("active");
});

completedFilter.addEventListener("click", function () {
    setFilter("completed");
});

function updateFilterButtons() {
    [
        { button: allFilter, name: "all" },
        { button: activeFilter, name: "active" },
        { button: completedFilter, name: "completed" }
    ].forEach(function (filter) {
        const selected = currentFilter === filter.name;

        filter.button.classList.toggle("active-filter", selected);
        filter.button.setAttribute("aria-pressed", String(selected));
    });
}


/* ==========================================
   STEP 13: CLEAR COMPLETED TASKS
========================================== */

clearCompletedButton.addEventListener("click", function () {
    tasks = tasks.filter(function (task) {
        return !task.completed;
    });

    saveTasks();
    renderTasks();
});


/* ==========================================
   STEP 14: RESTORE THE CURRENT SESSION
========================================== */

function startApp() {
    const userId = sessionStorage.getItem(SESSION_KEY);

    if (userId) {
        const users = getUsers();

        currentUser = users.find(function (user) {
            return user.id === userId;
        }) || null;

        if (currentUser) {
            openUserTasks();
            return;
        }

        sessionStorage.removeItem(SESSION_KEY);
    }

    showPage("login");
}

startApp();
