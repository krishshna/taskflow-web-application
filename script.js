function addTask() {

    let input = document.getElementById("taskInput");
    let taskText = input.value;

    if(taskText === "") {
        alert("Please enter a task");
        return;
    }

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
    };

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    document.getElementById("taskList").appendChild(li);

    input.value = "";
}