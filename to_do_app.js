
// 1. SELECT HTML ELEMENTS

const taskForm = document.querySelector("#task-form");

const taskInput = document.querySelector("#task-input");

const taskList = document.querySelector("#task-list");

const taskCount = document.querySelector("#task-count");

const allFilter = document.querySelector("#all-filter");

const activeFilter = document.querySelector("#active-filter");

const completedFilter = document.querySelector("#completed-filter");

const clearCompleted = document.querySelector("#clear-completed");


// 2. APPLICATION STATE

// Stores all tasks
let tasks = [];

// Stores the currently selected filter
let currentFilter = "all";


// 3. ADD TASK

taskForm.addEventListener("submit", function (event) {

    // Stop the form from refreshing the page
    event.preventDefault();


    // Get the user's input
    const taskText = taskInput.value.trim();


    // Don't allow empty tasks
    if (taskText === "") {
        return;
    }


    // Create a task object
    const task = {

        text: taskText,

        completed: false

    };


    // Add task to our data
    tasks.push(task);


    // Save tasks to localStorage
    saveTasks();


    // Display tasks on the page
    renderTasks();


    // Clear input
    taskInput.value = "";

});


// 4. DELETE TASK

taskList.addEventListener("click", function (event) {

    // Check if the clicked element is a delete button
    if (event.target.classList.contains("delete-button")) {

        // Get the <li>
        const taskElement = event.target.parentElement;


        // Find the position of this task
        const taskIndex = Array.from(taskList.children)
            .indexOf(taskElement);


        // Remove task from JavaScript array
        tasks.splice(taskIndex, 1);


        // Save updated tasks
        saveTasks();


        // Rebuild the task list
        renderTasks();

    }

});


// 5. COMPLETE / UNCOMPLETE TASK

taskList.addEventListener("change", function (event) {

    // Check if the changed element is a checkbox
    if (event.target.type === "checkbox") {

        // Get the <li>
        const taskElement = event.target.parentElement;


        // Find which task this is
        const taskIndex = Array.from(taskList.children)
            .indexOf(taskElement);


        // Update completed status
        tasks[taskIndex].completed = event.target.checked;


        // Save updated data
        saveTasks();


        // Rebuild task list
        renderTasks();

    }

});


// 6. UPDATE TASK COUNT

function updateTaskCount() {

    // Start counting from zero
    let remaining = 0;


    // Look at every task
    tasks.forEach(function (task) {

        // Count only active tasks
        if (!task.completed) {

            remaining++;

        }

    });


    // Display correct grammar
    if (remaining === 1) {

        taskCount.textContent = "1 task remaining";

    } else {

        taskCount.textContent = `${remaining} tasks remaining`;

    }

}


// 7. FILTER TASKS

function filterTasks(filter) {

    const taskElements = taskList.querySelectorAll("li");


    taskElements.forEach(function (taskElement, index) {

        const task = tasks[index];


        // Show every task
        if (filter === "all") {

            taskElement.style.display = "";

        }


        // Show only active tasks
        else if (filter === "active") {

            if (task.completed) {

                taskElement.style.display = "none";

            } else {

                taskElement.style.display = "";

            }

        }


        // Show only completed tasks
        else if (filter === "completed") {

            if (task.completed) {

                taskElement.style.display = "";

            } else {

                taskElement.style.display = "none";

            }

        }

    });

}


// 8. RENDER TASKS

// This function takes the tasks array
// and creates the HTML for the page.

function renderTasks() {

    // Clear the current HTML
    taskList.innerHTML = "";


    // Create HTML for every task
    tasks.forEach(function (task) {

        // Create <li>
        const newTask = document.createElement("li");


        // Create checkbox
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.checked = task.completed;


        // Create label
        const label = document.createElement("label");

        label.textContent = task.text;


        // If task is completed,
        // add the completed CSS class
        if (task.completed) {

            label.classList.add("completed");

        }


        // Create delete button
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";

        deleteButton.textContent = "Delete";

        deleteButton.classList.add("delete-button");


        // Put elements inside <li>
        newTask.append(checkbox);

        newTask.append(label);

        newTask.append(deleteButton);


        // Add <li> to task list
        taskList.append(newTask);

    });


    // Update counter
    updateTaskCount();


    // Apply current filter
    filterTasks(currentFilter);

}


// 9. CLEAR COMPLETED TASKS

clearCompleted.addEventListener("click", function () {

    // Keep only active tasks
    tasks = tasks.filter(function (task) {

        return !task.completed;

    });


    // Save updated array
    saveTasks();


    // Rebuild the page
    renderTasks();

});


// 10. FILTER BUTTONS

allFilter.addEventListener("click", function () {

    currentFilter = "all";

    filterTasks(currentFilter);

});


activeFilter.addEventListener("click", function () {

    currentFilter = "active";

    filterTasks(currentFilter);

});


completedFilter.addEventListener("click", function () {

    currentFilter = "completed";

    filterTasks(currentFilter);

});


// 11. SAVE TASKS

function saveTasks() {

    localStorage.setItem(
        "tasks",
        JSON.stringify(tasks)
    );

}


// 12. LOAD TASKS

function loadTasks() {

    // Get saved data
    const savedTasks = localStorage.getItem("tasks");


    // If saved tasks exist,
    // convert them back into JavaScript
    if (savedTasks) {

        tasks = JSON.parse(savedTasks);

    }

}


// 13. START THE APPLICATION

loadTasks();

renderTasks();