let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function addTask() {

    let input = document.getElementById("taskInput");
    let taskText = input.value;

    if(taskText === "") {
        alert("Please enter a task");
        return;
    }

    tasks.push(taskText);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    let li = document.createElement("li");

    let span = document.createElement("span");
    span.textContent = taskText;

    let editBtn = document.createElement("button");
    editBtn.textContent = "Edit";

    let deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";

    editBtn.onclick = function() {
        let newTask = prompt("Edit task:", span.textContent);
        if(newTask !== null && newTask !== "") {
            span.textContent = newTask;
        }
    };

    deleteBtn.onclick = function() {
        li.remove();
        updateTaskStats();
    };

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    checkbox.onchange = function() {
        span.classList.toggle("completed");
    };

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    document.getElementById("taskList").appendChild(li);

    input.value = "";
}

function toggleTask(checkbox) {

    let taskText = checkbox.nextElementSibling;
    
    taskText.classList.toggle("completed");
    
}

function loadTasks() {

    tasks.forEach(task => {

        let li = document.createElement("li");

        let span = document.createElement("span");
        span.textContent = task;

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.onchange = function() {
            span.classList.toggle("completed");
            updateTaskStats();
        };

        let deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = function() {
            li.remove();
        };

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);

        document.getElementById("taskList").appendChild(li);

    });

}


function updateTaskStats() {
    
    let total = document.querySelectorAll("#taskList li").length;
    let completed = document.querySelectorAll(".completed").length;
    let pending = total - completed;
    
    document.getElementById("taskStats").textContent =
    `Total: ${total} | Completed: ${completed} | Pending: ${pending}`;
}

loadTasks();
updateTaskStats();